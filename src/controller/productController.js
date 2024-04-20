const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");

const layout = "./layouts/adminLayout.ejs";

module.exports = {
  getAllProducts: async (req, res) => {
    try {
      const search = req.query.search || "";
      const page = req.query.page || 1;
      const limit = 4;
      const productData = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          
        ],
      })
        .sort({ createdOn: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const count = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          
        ],
      }).countDocuments();

      res.render("admin/products/products", {
        layout,
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      console.log(error.message);
    }
  },
  getProductAddPage: async (req, res) => {
    try {
      const categories = await Category.find({ isActive: true });
      // const brand = await Brand.find({ isBlocked: false })
      res.render("admin/products/addProduct", {
        categories,
        // brand: brand,
        layout,
      });
    } catch (error) {
      console.log(error.message);
    }
  },
  addProducts: async (req, res) => {
    try {
      console.log("working newwww");
      const products = req.body;
      // console.log(products);
      const productExists = await Product.findOne({
        productName: products.productName,
      });
      if (!productExists) {
        const images = [];

        if (req.files && req.files.length > 0) {
          for (let i = 0; i < req.files.length; i++) {
            await sharp(
              "./public/uploads/product-images/" + req.files[i].filename
            )
              .resize(480, 480)
              .toFile(
                "./public/uploads/product-images/crp/" + req.files[i].filename
              );

            images.push(req.files[i].filename);
          }
        }

        const newProduct = new Product({
          id: Date.now(),
          productName: products.productName,
          description: products.description,
          category: products.category,
          regularPrice: products.regularPrice,
          salePrice: products.salePrice,
          createdOn: new Date(),
          quantity: products.quantity,
          images: images,
        });
        await newProduct.save();
        res.redirect("/admin/products");
        // res.json("success")
      } else {
        res.json("failed");
      }
    } catch (error) {
      console.log(error.message);
    }
  },
  getEditProduct: async (req, res) => {
    try {
      const findProduct = await Product.findById(req.query.id).populate(
        "category"
      );

      const categories = await Category.find({ isActive: true });
      console.log(findProduct);
      res.render("admin/products/editProduct", {
        product: findProduct,
        cat: categories,
        layout,
      });
    } catch (error) {
      console.log(error.message);
    }
  },
  editProduct: async (req,res)=>{

  },
  blockProduct: async (req,res)=>{

    console.log(req.params);

    const {id} = req.params;
    try {
      let product = await Product.findById(id)
      if(!product){
        return res.status(400).json({success:false,message:"product not found"});
      }

      product.isBlocked = !product.isBlocked
      await product.save();
      req.flash("success","product blocked successfully");
      return res.redirect("/admin/products")

    } catch (error) {
      console.log(error)
    }
  },
  unBlockProduct: async (req,res)=>{

    console.log(req.params);

    const {id} = req.params;
    try {
      let product = await Product.findById(id)
      if(!product){
        return res.status(400).json({success:false,message:"product not found"});
      }

      product.isBlocked = !product.isBlocked
      await product.save();
      req.flash("success","product Unblocked successfully");
      return res.redirect("/admin/products")

    } catch (error) {
      console.log(error)
    }
  },

};
