const fs = require("fs")
const path = require("path")
const Product = require("../model/productSchema")
const Category = require("../model/categorySchema")

const layout = "./layouts/adminLayout.ejs";

module.exports = {
    getAllProducts: async (req, res) => {
        try {
            const search = req.query.search || ""
            const page = req.query.page || 1
            const limit = 4
            const productData = await Product.find({
                $or: [
                    { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                    { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
                ],
            })
                .sort({ createdOn: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec()

            const count = await Product.find({
                $or: [
                    { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                    { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
                ],
            }).countDocuments()



            res.render("admin/products/products", {
                layout,
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit)

            });

        } catch (error) {
            console.log(error.message);
        }
    },
    getProductAddPage: async (req, res) => {
        try {
            const categories = await Category.find({ isActive: true })
            // const brand = await Brand.find({ isBlocked: false })
            res.render("admin/products/addProduct", {
                categories,
                // brand: brand,
                layout,
            })
        } catch (error) {
            console.log(error.message);
        }
    },
    addProducts : async (req, res) => {
        try {
            console.log("working newwww");
    
            const products = req.body
            console.log(products);
            const productExists = await Product.findOne({ productName: products.productName })
            if (!productExists) {
                const images = []
                if (req.files && req.files.length > 0) {
                    for (let i = 0; i < req.files.length; i++) {
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
                    images: images
                })
                await newProduct.save()
                res.redirect("/admin/products")
                // res.json("success")
            } else {
    
                res.json("failed");
            }
    
        } catch (error) {
            console.log(error.message);
        }
    }
    
}