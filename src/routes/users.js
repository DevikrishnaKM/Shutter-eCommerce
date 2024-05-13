var express = require('express');
var router = express.Router();

const User = require("../model/userSchema");
const Cart = require("../model/cartSchema");
const Order = require("../model/orderSchema");
const WishList = require("../model/wishlistSchema");
const Wallet = require("../model/walletSchema");

const { isLoggedIn } = require("../middlewares/authMiddleware");

const userController = require("../controller/userController");
const orderController = require("../controller/orderController");
const checkoutController = require("../controller/checkoutController");
const couponController = require("../controller/couponController");

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

router.post("/apply-coupon", couponController.applyCoupon);
router.post("/remove-coupon", couponController.removeCoupon);


router.post("/place-order", checkoutController.placeOrder);  
router.post("/verify-payment", checkoutController.verifyPayment);


router.route("/orders").get(orderController.getUserOrders);
router.get("/order/:orderId", orderController.getSingleOrder);
router.post("/cancel-order/:id/:itemId", orderController.cancelOrder);
router.post("/return-order/", orderController.returnOrder);

/**
 * User Wishlist
 */

router.get("/wishlist", userController.getWishlist);
router.post("/add-to-wishlist", userController.addToWishlist);
router.delete("/remove-from-wishlist", userController.removeFromWishlist);

/**
 * User Wallet
 */

router.get("/wallet", userController.getWallet);
router.post('/add-to-wallet', userController.addToWallet)
router.post('/verify-wallet-payment', userController.verifyPayment)

router.get("/referrals", userController.getRefferals);

// invoice
router.get("/invoice/:id/:itemId", orderController.getInvoice);
router.get("/invoice/download/:id/:itemId", orderController.downloadInvoice);

module.exports = router;


