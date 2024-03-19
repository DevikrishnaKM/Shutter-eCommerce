const mongoose = require("mongoose");
const Category = require("../model/categorySchema");
const Product = require("../model/productSchema");
const User = require("../model/userSchema");



module.exports={
    getHome:async (req,res)=>{
        const locals={
            title: "Shutter - Home"
        }
        const products = await Product.find({  isBlocked: false })
        console.log(products)
        const categories = await Category.find({ isActive: true });
        console.log(categories);

        res.render('index',{
            locals,
            categories,
            products,
            user: req.user,
        });
    },
}