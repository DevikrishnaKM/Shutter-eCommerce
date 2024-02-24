const express = require('express');
const router = express.Router();


const authController = require('../controller/authController')

router
    .route("/login")
    .get(authController.getLogin)
    // .post(authController.userLogin);
router
    .route("/register")
    .get(authController.getRegister)
    .post(authController.userRegister);
router
    .route("/verify-otp")
    .get( authController.getVerifyOtp )

    router
  .route("/forgot-password")
  .get( authController.getForgotPass)
//   .post(forgotPassValidation, authController.forgotPass);


module.exports = router;
