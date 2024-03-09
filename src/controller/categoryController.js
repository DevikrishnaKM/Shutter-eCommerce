const fs = require("fs");

const layout = "./layouts/adminLayout.ejs";
const Category = require("../model/categorySchema");

module.exports = {
    getAllCategory: async (req, res) => {
        const locals = {
            title: "Category management",
        };
        const categories = await Category.find();
        res.render("admin/categories/categories", {
            locals,
            categories,
            layout,
        });
    },
    getAddCategory: async (req, res) => {
        res.render("admin/categories/addCategory", {
            layout,
        });
    },
    addCategory: async (req, res) => {
        console.log(req.body, req.files);
        const name = String(req.body.category_name).toLowerCase()
        const category = await Category.findOne({ name: name });
        if (category) {
            return res.json({ 'error': "Category Already Exist!!" })
        } else {

             console.log(req.body, req.files);
            const newCategory = new Category({
                name: name,
                image: {
                    filename: req.files.category_image[0].filename,
                    originalname: req.files.category_image[0].originalname,
                    path: req.files.category_image[0].path,
                },
            });
            const addCategory = newCategory.save();
            if (addCategory) {
                res.json({
                    success: true,
                });
            }
        }
    },
}