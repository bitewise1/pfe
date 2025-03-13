const express = require("express");
const { selectMode, logout, updateProfile } = require("../controllers/userController");

const router = express.Router();
router.post("/updateProfile", updateProfile);
router.post("/select-mode", selectMode);
router.post("/logout", logout);

module.exports = router;
