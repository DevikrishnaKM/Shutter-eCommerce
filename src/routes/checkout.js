const express = require("express");
const router = express.Router();

const shopController = require("../controller/shopController");
const cartController = require("../controller/cartController");
const userController = require("../controller/userController");

const { isLoggedIn } = require("../middlewares/authMiddleware");
const checkoutController = require("../controller/checkoutController");

router.use(isLoggedIn, (req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  // res.locals.success = req.flash("success");
  // res.locals.error = req.flash("error");
  next();
});

/* GET checkout page. */
router.get("/", checkoutController.getCheckout);
router.post("/add-address", checkoutController.addAddress);
router.route("/edit-address/:id").get(userController.getEditAddress);

router.post("/edit-address/:id", checkoutController.editAddress);
router.delete("/edit-address/:id", checkoutController.deleteAddress);

router.get('/order-success',cartController.getOrderSuccess);

module.exports = router;
