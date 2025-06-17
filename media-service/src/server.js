require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const connectToDb = require("./config/database");
const PORT = process.env.PORT || 3003;
const mediaRoute = require("./routes/media-routes");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./event/media-event-handlers");

connectToDb();
app.use(helmet());
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body} `);
  next();
});

//hw do ip rate limit on sensitive endpoint

app.use("/api/media", mediaRoute);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectToRabbitMQ();
    //consume all the event
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
};

startServer();

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled Rejection at", promise, "reason", reason);
});
