const mongoose = require("mongoose");
const Category = require("../model/categorySchema");
const Product = require("../model/productSchema");
const Address = require("../model/addressSchema");
const Order = require("../model/orderSchema");
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
  search: async (req,res)=>{
    try {
      console.log(req.query);
      let search="";

      if(req.query.search){
        search = req.query.search.trim();
      }
      let page = 1;

      if(req.query.page){
        page = req.query.page;
      }
      const categoryID = req.query.category;
      // const categoryID = new mongoose.Types.ObjectId(req.query.category);

      const limit = 9;

      const sortBy = req.query.sortBy;

      let sortQuery = {};
      if (sortBy) {
        if (sortBy === "lowPrice") {
          sortQuery = { regularPrice: 1 };
        } else if (sortBy === "highPrice") {
          sortQuery = { regularPrice: -1 };
        }
      }
      let filterQuery = {};

      if (search) {
        filterQuery.productName = { $regex: search, $options: "i" };
      }
      if (categoryID) {
        filterQuery.category = categoryID;
      }
      const products = await Product.find(filterQuery)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .exec();
      const count = await Product.find(filterQuery).countDocuments();

      const categories = await Category.find({ isActive: true });
      return res.render("shop/search", {
        sortBy,
        categoryID,
        products,
        categories,
        count,
        pages: Math.ceil(count / limit),
        current: page,
        previous: page - 1,
        nextPage: Number(page) + 1,
        limit,
        search,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({success:false,message:error.message});
    }
  },
  // getProductList: async (req, res) => {
  //   const locals = {
  //     title: "Shutter - Product",
  //   };

  //   let perPage = 12;
  //   let page = req.query.page || 1;

  //   const count = await Product.countDocuments();
  //   const nextPage = parseInt(page) + 1;
  //   const hasNextPage = nextPage <= Math.ceil(count / perPage);

  //   const products = await Product.find({ isBlocked: false })
  //     .sort({ createdAt: -1 })
  //     .skip(perPage * page - perPage)
  //     .limit(perPage)
  //     .exec();

  //   console.log(products[0]);
  //   const categories = await Category.find({ isActive: true });
  //   res.render("shop/productList", {
  //     locals,
  //     products,
  //     categories,
  //     current: page,
  //     pages: Math.ceil(count / perPage),
  //     nextPage: hasNextPage ? nextPage : null,
  //   });
  // },
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
  },
 
};
