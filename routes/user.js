const express = require("express");
const router = express.Router();

const {
  requireSignIn,
  authMiddleware,
  adminMiddleware,
} = require("../controllers/auth");

const { read } = require("../controllers/user");

router.get("/user", requireSignIn, authMiddleware, read);
router.get("/admin", requireSignIn, adminMiddleware, read);

module.exports = router;
