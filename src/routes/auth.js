const express = require('express');
const router = express.Router();


const authController = require('../controller/authController')

router
    .route("/login")
    .get(authController.getLogin)
    .post(authController.userLogin);
router
    .route("/register")
    .get(authController.getRegister)
    .post(authController.userRegister);
router
    .route("/verify-otp")
    .get( authController.getVerifyOtp )
    .post(authController.verifyOtp);
router
    .route("/forgot-password/verify-otp")
    .get(authController.getForgotPassOtp )
  
router.route("/resend-otp").get(authController.resendOTP);

router
  .route("/forgot-password")
  .get( authController.getForgotPass)
  .post(authController.forgotPass);

router
  .route("/reset-password")
  .get( authController.getResetPass)
  .post( authController.resetPass);

router
  .route("/admin/login")
  .get(authController.getAdminLogin)
//   .post(loginValidation, authController.adminLogin);

router
  .route("/admin/register")
  .get(authController.getAdminRegister)
//   .post(loginValidation, authController.adminLogin);


module.exports = router;
