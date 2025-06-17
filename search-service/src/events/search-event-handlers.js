const Search = require("../models/search");
const logger = require("../utils/logger");

const handlePostCreated = async (event) => {
  try {
    const { postId, userId, content, createdAt } = event;
    const newSearchPost = new Search({
      postId: postId,
      userId: userId,
      content: content,
      createdAt: createdAt,
    });

    await newSearchPost.save();
    logger.info("Search post created", postId, newSearchPost._id.toString());
  } catch (error) {
    logger.error("Error handling post creation event", error);
  }
};

const handlePostDeleted = async (event) => {
  try {
    const { postId } = event;
    await Search.findOneAndDelete({
      postId,
    });
    logger.info("Search post deleted", postId);
  } catch (error) {
    logger.error("Error handling post deletion event", error);
  }
};

module.exports = {
  handlePostCreated,
  handlePostDeleted,
};
