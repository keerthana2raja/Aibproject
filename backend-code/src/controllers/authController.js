const asyncHandler = require("express-async-handler");
const { loginUser } = require("../services/authService");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  res.status(200).json({ success: true, data: result });
});

const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully." });
});

module.exports = { login, logout };
