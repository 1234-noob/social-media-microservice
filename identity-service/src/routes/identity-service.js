const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokenUser,
} = require("../controllers/identity-controllers");

const router = express.Router();

//register router

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshTokenUser);
router.post("/logout", logoutUser);

module.exports = router;
