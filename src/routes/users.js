var express = require('express');
var router = express.Router();

const User = require("../model/userSchema");
const Cart = require("../model/cartSchema");
const Order = require("../model/orderSchema");
const WishList = require("../model/wishlistSchema");

const { isLoggedIn } = require("../middlewares/authMiddleware");

const userController = require("../controller/userController");
const orderController = require("../controller/orderController");
const checkoutController = require("../controller/checkoutController");

router.use(isLoggedIn, async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return res.redirect("/admin");
  }
     res.locals.success = req.flash("success");
     res.locals.error = req.flash("error");
  next();
});

/**
 * User Profile
 */

router.get("/profile",userController.getProfile)
router.post("/profile",userController.editProfile) 
router.post("/change-password",userController.changePassword)
/**
 * User Address
 */

router.route("/address").get(userController.getAddress);
router.route("/address/add-address").post(userController.addAddress);

router
  .route("/address/edit-address/:id")
  .get(userController.getEditAddress)
  .post(userController.editAddress)

router
  .route("/address/delete-address/:id")
  .delete(userController.deleteAddress);

router.post("/place-order", checkoutController.placeOrder);  
router.route("/orders").get(orderController.getUserOrders);
router.get("/order/:orderId", orderController.getSingleOrder);
router.post("/cancel-order/:id/:itemId", orderController.cancelOrder);

/**
 * User Wishlist
 */

router.get("/wishlist", userController.getWishlist);
router.post("/add-to-wishlist", userController.addToWishlist);

module.exports = router;


