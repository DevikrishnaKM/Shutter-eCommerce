var express = require('express');
var router = express.Router();

const User = require("../model/userSchema");


const { isLoggedIn } = require("../middlewares/authMiddleware");

const userController = require("../controller/userController");

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

module.exports = router;


