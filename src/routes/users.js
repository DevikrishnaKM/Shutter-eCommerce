var express = require('express');
var router = express.Router();

const User = require("../model/userSchema");


const { isLoggedIn } = require("../middlewares/authMiddleware");

const userController = require("../controller/userController");


/**
 * User Profile
 */

router
  .route("/profile")
  .get(userController.getProfile);

  
module.exports = router;


