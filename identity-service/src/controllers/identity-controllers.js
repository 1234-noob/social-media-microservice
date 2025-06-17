const logger = require("../utils/logger");
const generateToken = require("../utils/generateTokens");
const { validateRegistration, validateLogin } = require("../utils/validation");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");
//user registration

const registerUser = async (req, res) => {
  logger.info("Registeration endpoint hit....");
  try {
    //validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    user = new User({
      username,
      email,
      password,
    });
    await user.save();
    logger.info("User saved successfully", user._id);

    const { accessToken, refreshTokens } = await generateToken(user);

    res.status(201).json({
      success: true,
      message: "User Register Successfully",
      refreshTokens,
      accessToken,
    });
  } catch (error) {
    logger.error("Registration error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//user login

const loginUser = async (req, res) => {
  logger.info("Login Endpoint hit");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid user");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //checking for valid password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const { accessToken, refreshTokens } = await generateToken(user);
    return res.status(200).json({
      success: true,
      message: "User Logged in",
      userId: user._id,
      accessToken,
      refreshTokens,
    });
  } catch (error) {
    logger.error("Login error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//refresh token

const refreshTokenUser = async (req, res) => {
  logger.info("Refresh Token Endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshTokens: newRefreshToken } =
      await generateToken(user);

    //Delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshTokens: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//logout

const logoutUser = async (req, res) => {
  logger.info("Logout Endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    await RefreshToken.deleteOne({
      token: refreshToken,
    });
    logger.info("Refresh token deleted successfully");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Error while logging out", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };
