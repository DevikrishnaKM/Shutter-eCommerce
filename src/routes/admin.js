const express = require("express");
const router = express.Router();


const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
// const bannerController = require("../controller/bannerController");
// const productController = require("../controller/productController");

const { categoryValidation } = require("../validators/adminValidator");

const { isAdmin } = require("../middlewares/authMiddleware");
const { categoryUpload} = require("../middlewares/multer");

/* Common Midleware for admin routes*/
router.use(isAdmin, (req, res, next) => {
    if (req.user && req.user.isAdmin) {
      res.locals.admin = req.user;
    }
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
  });

router.get("/", adminController.getDashboard);
/**
 * User Management
 */

router.route("/users").get(adminController.getUsersList);

router.route("/users/toggle-block/:id").patch(adminController.toggleBlock)


/**
 * Category Management
 */

router.route("/category").get(categoryController.getAllCategory);

router
  .route("/category/add-category")
  .get(categoryController.getAddCategory)
  .post(
    categoryUpload.fields([{ name: "category_image" }]),
    categoryController.addCategory
  );

module.exports = router;