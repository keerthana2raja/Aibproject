const express = require("express");
const router = express.Router();
const { login, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");

router.post("/login", validate(["email", "password"]), login);
router.post("/logout", protect, logout);

module.exports = router;
