const express = require("express");
const router = express.Router();
const shopController = require("../controller/shopController");
const userController = require("../controller/userController");
const cartController = require("../controller/cartController");

const Category = require("../model/categorySchema");
const Product = require("../model/productSchema");
const Cart = require('../model/cartSchema');

const {isLoggedIn} = require("../middlewares/authMiddleware");
const {cartList} = require("../middlewares/cartMiddleware");
 



  router.use((req, res, next) => {
    if (req.isAuthenticated()) {
      res.locals.user = req.user;
    }
    //  res.locals.success = req.flash("success");
    //  res.locals.error = req.flash("error");
    next();
  });

/* GET users listing. */
router.get("/", shopController.getHome);
router.get("/shop", shopController.search);
router.get("/shop", shopController.getProductList);
router.get("/shop/product/:id", shopController.getProduct);
router.get("/user/cart", isLoggedIn, cartController.getCart);
router.post("/user/add-to-cart/", cartController.addToCart);
router.post("/update-quantity/:id", cartController.updateQuantity);

router.delete("/cart/remove-cartItem/:id", cartController.removeCartItem);
// router.get("/order-success", isLoggedIn, cartController.getOrderSuccess);


module.exports = router;