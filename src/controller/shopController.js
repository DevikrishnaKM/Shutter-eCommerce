const mongoose = require("mongoose");
const Category = require("../model/categorySchema");
const Product = require("../model/productSchema");
const User = require("../model/userSchema");

module.exports = {
  getHome: async (req, res) => {
    const locals = {
      title: "Shutter - Home",
    };
    const products = await Product.find({ isBlocked: false });
    console.log(products);
    const categories = await Category.find({ isActive: true });
    console.log(categories);

    res.render("index", {
      locals,
      categories,
      products,
      user: req.user,
    });
  },
  getProductList: async (req, res) => {
    const locals = {
      title: "Shutter - Product",
    };

    let perPage = 12;
    let page = req.query.page || 1;

    const count = await Product.countDocuments();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    const products = await Product.find({ isBlocked: false })
      .sort({ createdAt: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    console.log(products[0]);
    const categories = await Category.find({ isActive: true });
    res.render("shop/productList", {
      locals,
      products,
      categories,
      current: page,
      pages: Math.ceil(count / perPage),
      nextPage: hasNextPage ? nextPage : null,
    });
  },
  getProduct: async (req,res)=>{
    const productId = req.params.id;
    console.log(productId);

    try {
      
       const productData = await Product.findById(productId);
       console.log(productData);
       
      // Check if product data was found
      if (!productData || productData.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.render('shop/productDetail',{
        product: productData,
      })
    } catch (error) {
      console.log(error)
    }
  }
};
