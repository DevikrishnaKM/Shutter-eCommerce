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
    // .post(authController.userLogin);



module.exports = router;
