require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectToDb = async () => {
  try {
    await mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => {
        logger.info("Connected to Mongo Db");
      })
      .catch((e) => {
        logger.error("Error connecting to Mongo Db", e);
      });
  } catch (error) {
    process.exit(1);
  }
};

module.exports = connectToDb;
