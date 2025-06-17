const jwt = require("jsonwebtoken");
const refreshToken = require("../models/refreshToken");
const crypto = require("crypto");
const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "5m",
    }
  );

  const refreshTokens = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token expires in 7 days

  await refreshToken.create({
    token: refreshTokens,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshTokens };
};

module.exports = generateToken;
