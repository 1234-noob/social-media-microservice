const express = require("express");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controller/post-controller");
const router = express.Router();
const { authenticateRequest } = require("../middleware/authMiddleware");
//middleware to get user id

router.use(authenticateRequest);

router.post("/create", createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;
