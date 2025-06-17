require("dotenv").config();
const Redis = require("ioredis");
const express = require("express");
const app = express();
const connectToDb = require("./config/database");
const logger = require("./utils/logger");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { RedisStore } = require("rate-limit-redis");
const identitiyRoute = require("./routes/identity-service");
const errorHandler = require("./middleware/errorHandler");

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request Body ${req.body} `);
  next();
});

const redisClient = new Redis(process.env.REDIS_URL);
//DDOS protection and rate limiting

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((e) => {
      logger.warn("rate limit execeeded for IP: ", req.ip);
      res.status(429).json({
        success: false,
        message: "To many requests",
      });
    });
});

//Ip based rate limiting for sensitive endpoint

const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit execeeded for IPL ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "To many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply this sensitive endpoint limiter to our router

app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes

app.use("/api/auth", identitiyRoute);

//error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
connectToDb();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled Rejection at", promise, "reason", reason);
});
