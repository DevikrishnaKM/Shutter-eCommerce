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
      }).populate("category")
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
      const findProduct = await Product.findById(req.params.id).populate(
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
    console.log(req.body)
    try {
      const id = req.params.id
      const data = req.body
      const images = []
      if (req.files && req.files.length > 0) {
          for (let i = 0; i < req.files.length; i++) {
              images.push(req.files[i].filename);
          }
      }
      console.log(req.files)
      if (req.files.length > 0) {
          console.log("Yes image is there")
          const updatedProduct = await Product.findByIdAndUpdate(id, {
              id: Date.now(),
              productName: data.productName,
              description: data.description,
              category: data.category,
              regularPrice: data.regularPrice,
              quantity: data.quantity,
              createdOn: new Date(),
              productImage: images
          }, { new: true })
          console.log("product updated");
          res.redirect("/admin/products")
      } else {
          console.log("No images i ther")
          const updatedProduct = await Product.findByIdAndUpdate(id, {
              id: Date.now(),
              productName: data.productName,
              description: data.description,
              category: data.category,
              regularPrice: data.regularPrice,
              salePrice: data.regularPrice,
              quantity: data.quantity,
              createdOn: new Date(),
          }, { new: true })
          console.log("product updated");
          res.redirect("/admin/products")
      }
  } catch (error) {
      console.log(error.message);
  }

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
  getProdDetails: async (req, res) => {
    const productId = req.params.id;
    try {
      const product = await Product.findOne({ _id: productId });

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      return res.status(200).json({ success: true, product });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  getStocks: async (req, res) => {
    try {
      let perPage = 9;
      let page = req.query.page || 1;

      const products = await Product.find()
        .sort({ createdAt: -1 })
        .populate("category")
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec();

      const count = await Product.find().countDocuments();
      const nextPage = parseInt(page) + 1;
      const hasNextPage = nextPage <= Math.ceil(count / perPage);

      // console.log(products);
      console.log(products[0]);
      res.render("admin/products/stocks", {
        products,
        layout,
        current: page,
        pages: Math.ceil(count / perPage),
        nextPage: hasNextPage ? nextPage : null,
        currentRoute: "/admin/products/",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
