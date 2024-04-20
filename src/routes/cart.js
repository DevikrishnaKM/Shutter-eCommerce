const express = require('express');
const router = express.Router();

const Cart = require("../model/cartSchema");
const cartController = require("../controller/cartController");
const shopController = require("../controller/shopController");

const { isLoggedIn }=require("../middlewares/authMiddleware");

router.get("/cart",isLoggedIn,cartController.getCart);
router.post("/user/add-to-cart/", cartController.addToCart);

module.exports = router;
