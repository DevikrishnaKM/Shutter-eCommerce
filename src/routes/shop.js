const express = require("express");
const router = express.Router();
const shopController = require("../controller/shopController");

const {
    isLoggedIn,
  } = require("../middlewares/authMiddleware");
  
 const userController = require("../controller/userController");


  router.use((req, res, next) => {
    if (req.isAuthenticated()) {
      res.locals.user = req.user;
    }
     res.locals.success = req.flash("success");
     res.locals.error = req.flash("error");
    next();
  });

/* GET users listing. */
router.get("/", shopController.getHome);
router.get("/shop", shopController.getProductList);
router.get("/shop/product/:id", shopController.getProduct);

module.exports = router;