require("dotenv").config();
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const { RedisStore } = require("rate-limit-redis");
const connectToDb = require("./config/database");
const redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoutes = require("./routes/search-routes");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./events/search-event-handlers");
const PORT = process.env.PORT || 3004;
const app = express();
connectToDb();

const redisClient = new redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body} `);
  next();
});

const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
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

app.use("api/search/posts", sensitiveEndpointsLimiter);

app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    //consume the search event published in post created controller
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();
//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled Rejection at", promise, "reason", reason);
});
