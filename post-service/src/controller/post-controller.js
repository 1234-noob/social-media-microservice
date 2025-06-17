const logger = require("../utils/logger");
const Post = require("../model/post");
const { validateCreatePost } = require("../utils/validation");
const invalidatePostCache = require("../utils/caching");
const { publishEvent } = require("../utils/rabbitmq");

//create post
const createPost = async (req, res) => {
  logger.info("Create post endpoint hit....");

  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    //publish the event for search schema
    await publishEvent("post.created", {
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt: newlyCreatedPost.createdAt,
    });
    await invalidatePostCache(req, newlyCreatedPost._id.toString());
    logger.info("Post created successfully", newlyCreatedPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    logger.error("Error in creating post", error);
  }
};

//get all posts
const getAllPosts = async (req, res) => {
  logger.info("Get all post endpoint hit....");
  try {
    const page = parseInt(req.query.page) || 2;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;

    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: 1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfPosts = await Post.countDocuments({});
    const result = {
      posts,
      currentpage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };

    //save your post in redis cache

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    logger.error("Error fetching posts", error);
  }
};

//get post by id
const getPost = async (req, res) => {
  logger.info("Get post endpoint hit....");
  try {
    const postId = req.params.id;

    const cacheKey = `post:${postId}`;

    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const postById = await Post.findById(postId);

    if (!postById) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(postById));
    return res.status(200).json({
      postById,
      success: true,
      message: "Post found",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    logger.error("Error fetching post ", error);
  }
};

const deletePost = async (req, res) => {
  logger.info("Delete post endpoint hit....");

  try {
    const postDelete = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!postDelete) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    //Publish post delete method
    await publishEvent("post.deleted", {
      postId: postDelete._id.toString(),
      userId: req.user.userId,
      mediaIds: postDelete.mediaIds,
    });
    await invalidatePostCache(req, req.params.id);
    logger.info("Post deleted successfully");
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      postDelete,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    logger.error("Error deleting post", error);
  }
};

module.exports = {
  createPost,
  getPost,
  getAllPosts,
  deletePost,
};
