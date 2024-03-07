const express = require("express");
const router = express.Router();


const adminController = require("../controller/adminController");
// const categoryController = require("../controller/categoryController");
// const bannerController = require("../controller/bannerController");
// const productController = require("../controller/productController");

router.get("/", adminController.getDashboard);






module.exports = router;