const express = require("express");
const { authenticateUser } = require("../middleware/auth"); // ✅ Destructure the function

const router = express.Router();

router.get("/", authenticateUser, (req, res) => {
  res.json(req.user);
});

module.exports = router;
