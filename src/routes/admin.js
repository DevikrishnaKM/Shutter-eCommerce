const express = require("express");
const router = express.Router();

const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
// const bannerController = require("../controller/bannerController");

const { categoryValidation } = require("../validators/adminValidator");

const { isAdmin } = require("../middlewares/authMiddleware");
const { categoryUpload, productUpload } = require("../middlewares/multer");

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

router.route("/users/toggle-block/:id").patch(adminController.toggleBlock);

/**
 * Category Management
 */

router.route("/category").get(categoryController.getAllCategory);

router
  .route("/category/add-category")
  .get(categoryController.getAddCategory)
  .post(
    categoryValidation,
    categoryUpload.single("category-image"),
    categoryController.addCategory
  );

router
  .route("/category/edit-category/:id")
  .get(categoryController.getEditCategory)
  .post(
    categoryValidation,
    categoryUpload.single("category-image"),
    categoryController.editCategory
  );

router
  .route("/category/delete-category/")
  .get(categoryController.deleteCategory);

/**
 * Product Management
 */
router.route("/products").get(productController.getAllProducts);
router
  .route("/products/add-product")
  .get(productController.getProductAddPage)
  .post(productUpload.array("images", 5), productController.addProducts);

module.exports = router;
