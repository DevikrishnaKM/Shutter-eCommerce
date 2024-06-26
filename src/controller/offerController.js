const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Offer = require("../model/offerSchema");

const layout = "./layouts/adminLayout";

module.exports = {
  getOffers: async (req, res) => {
    res.render("admin/offers", {
      layout,
      offers: [],
      refferal: {},
    });
  },
  getProductOffers: async (req, res) => {
    const products = await Product.find({});
    const offers = await Offer.find({});
    res.render("admin/offers/products", {
      products,
      layout,
    });
  },
  getCategoryOffers: async (req, res) => {
    const categories = await Category.find({});

    res.render("admin/offers/categories", {
      categories,
      layout,
    });
  },
  addCatOffer: async (req, res) => {
    const categoryId = req.params.id;
    const { offerDiscountRate } = req.body;

    if (!categoryId || !offerDiscountRate) {
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });
    }

    if (isNaN(offerDiscountRate) || offerDiscountRate < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Discount rate should be positive" });
    }
    if (offerDiscountRate <= 0 || offerDiscountRate > 95) {
      return res.status(400).json({
        success: false,
        message: "Discount rate should be a positive number between 1 and 95",
      });
    }

    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }

      const productsInCategory = await Product.find({ category: categoryId});
      if (!productsInCategory) {
        return res.status(404).json({
          success: false,
          message: "Products not found in this category",
        });
      }

      if (productsInCategory.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products found in this category",
        });
      }

      category.offerDiscountRate = offerDiscountRate;
      // category.onOffer = true;

      for (const product of productsInCategory) {
        if (!product.onOffer) {
          const discountAmount = Math.ceil(
            (product.regularPrice * offerDiscountRate) / 100
          );
          const offerPrice = Math.ceil(product.regularPrice - discountAmount);
          product.offerDiscountPrice = offerPrice;
          product.offerDiscountRate = offerDiscountRate;
          product.onOffer = true;

          await product.save();
        }
      }

      await category.save();

      return res
        .status(200)
        .json({ success: true, message: "Offer added successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error", error });
    }
  },

  toggleActiveCatOffer: async (req, res) => {
    const categoryId = req.params.id;

    try {
      const category = await Category.findById(categoryId);

      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }

      const productsInCategory = await Product.find({ category: categoryId });
      if (!productsInCategory) {
        return res.status(404).json({
          success: false,
          message: "Products not found in this category",
        });
      }

      if (productsInCategory.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products found in this category",
        });
      }


      if (category.offerDiscountRate <= 0) {
        return res.status(400).json({
          success: false,
          message: "Discount rate should be a positive number between 1 and 95",
        });
      }

      category.onOffer = !category.onOffer;

      await category.save();

      for (const product of productsInCategory) {
        if (product.offerDiscountRate === category.offerDiscountRate) {
          product.onOffer = category.onOffer;
          await product.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: category.onOffer ? "Offer enabled" : "Offer disabled",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error", error });
    }
  },

  addProdOffer: async (req, res) => {
    const productId = req.params.id;
    const { offerDiscountRate } = req.body;

    if (!productId || !offerDiscountRate) {
      return res
        .status(400)
        .json({ success: false, message: "Missing parameters" });
    }

    if (
      isNaN(offerDiscountRate) ||
      offerDiscountRate <= 0 ||
      offerDiscountRate > 95
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount rate should be a positive number between 1 and 95",
      });
    }

    try {
      const product = await Product.findById(productId);

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      let discountAmount = 0;

      if (offerDiscountRate !== 0) {
        discountAmount = Math.ceil(
          (product.regularPrice * offerDiscountRate) / 100
        );
      } else {
        discountAmount = product.regularPrice;
      }

      product.offerDiscountPrice = product.regularPrice - discountAmount;
      product.offerDiscountRate = offerDiscountRate;

      await product.save();

      return res
        .status(200)
        .json({ success: true, message: "Offer added successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error", error });
    }
  },
  toggleActiveProdOffer: async (req, res) => {
    const productId = req.params.id;

    try {
      const product = await Product.findById(productId);

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      if (product.offerDiscountRate <= 0) {
        return res.status(400).json({
          success: false,
          message: "Discount rate should be a positive number between 1 and 95",
        });
      }

      product.onOffer = !product.onOffer;

      await product.save();

      return res.status(200).json({
        success: true,
        message: product.onOffer ? "Offer enabled" : "Offer disabled",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error", error });
    }
  },
};
