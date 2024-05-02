const express = require("express");
const router = express.Router();

const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
// const bannerController = require("../controller/bannerController");
const orderController = require("../controller/orderController");
const couponController = require("../controller/couponController");
const returnController = require("../controller/returnController");
const offerController = require("../controller/offerController");
const reportsController = require("../controller/reportsController");

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

router.get("/products/editProduct/:id", productController.getEditProduct);
router.post("/products/editProduct/:id", productUpload.array("images", 5), productController.editProduct)

router.get("/blockProduct/:id",productController.blockProduct)
router.get("/unBlockProduct/:id",productController.unBlockProduct)
// router.get("/stocks", productController.getStocks);
/**
 * order management
 */
router.route("/orders").get(orderController.getOrders);
router.route("/orders/manage-order/:id").get(orderController.getOrderDetails);
router
  .route("/orders/manage-order/changeStatus/:id")
  .post(orderController.changeOrderStatus);

/***
 * Coupon Management
 */

 router.get('/coupons', couponController.getCoupons)
 router.post('/coupons/add-coupon', couponController.addCoupon);
 router
  .route("/coupons/edit/:id")
  .get(couponController.getCoupon)
  .put(couponController.editCoupon);

router.patch("/coupon/toggleStatus/:id", couponController.toggleStatus)

/**
 * Offer Management
 *  - Category Offer
 *  - Product Offer
 *  - Refferals
 */

// Category Offer
router.get('/category-offers', offerController.getCategoryOffers)
 router.get('/category-details/:id', categoryController.getCategoryDetails)
 router.patch('/category-offer/:id', offerController.addCatOffer)
 router.patch('/toggle-active-category/:id', offerController.toggleActiveCatOffer)

// Product Offer
router.get('/product-offers', offerController.getProductOffers)
 router.get('/product-details/:id', productController.getProdDetails)
 router.patch('/product-offer/:id', offerController.addProdOffer)
 router.patch('/toggle-active-product/:id', offerController.toggleActiveProdOffer)

/**
 * Order Return
 */

router.get('/returns', returnController.getReturnRequests)

router.post('/returns/approve-return', returnController.approveReturn)

router.post('/returns/reject-return', returnController.declineReturn)




/**
 * Sales Report
 */

 router.get('/sales-report', reportsController.getSalesReport)
 router.get('/sales-report/excel', reportsController.salesReportExcel)
 router.get('/sales-report/pdf-download', reportsController.getSalesReportPdf)

module.exports = router;
