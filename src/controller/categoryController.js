const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const layout = "./layouts/adminLayout.ejs";
const Category = require("../model/categorySchema");
// Function to ensure the directory exists
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (fs.existsSync(dir)) {
    return true;
  }
  ensureDirectoryExists(dir);
  fs.mkdirSync(dir);
}

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
    console.log(req.file);
    try {
      const name = String(req.body.category_name).toLowerCase();
      const category = await Category.findOne({ name });
      if (category) {
        req.flash('error', "category already exist!!");
        res.redirect("/admin/category/add-category");
      } else {
        console.log(req.body);
        const category_image = req.file;

        // Process the image with sharp to ensure it's a square
        const processedImage = await sharp("./public/uploads/category-images/" + category_image.filename)
          .resize(480, 480)
          .toFile("./public/uploads/category-images/crp/" + category_image.filename);

        console.log(processedImage)

        const newCategory = new Category({
          name: name,
          image: {
            filename: category_image.filename,
            originalname: category_image.originalname,
            path: category_image.path,
          },
        });
        const addCategory = await newCategory.save();
        if (addCategory) {
          req.flash('success', "category successfully added");
          res.redirect("/admin/category");
        }
      }
    } catch (error) {
      console.log(error);
      req.flash('error', "category added failed");
      res.redirect("/admin/category/add-category");
    }
  },
  getEditCategory: async (req, res) => {
    const category = await Category.findById(req.params.id);
    res.render("admin/categories/editCategory", {
      category,
      layout,
    });
  },
  //edit category
  editCategory: async (req, res) => {
    console.log(req.body,req.file);
    try {
      const { status, imageName } = req.body;
      let name = req.body.name.toLowerCase();
      let editCategory = {
        name: name,
        isActive: status === "true" ? true : false,
      };

      if (req.file) {
        const category_image = req.file;
        editCategory.image = {
          filename: category_image.filename,
          originalname: category_image.originalname,
          path: category_image.path,
        };
        const processedImage = await sharp("./public/uploads/category-images/" + editCategory.image.filename)
        .resize(480, 480)
        .toFile("./public/uploads/category-images/crp/" + editCategory.image.filename);

        // Deleting old image from the multer
        fs.unlink(`./public/uploads/category-images/${imageName}`, (err) => {
          if (err) {
            console.error(err); // Log the error instead of throwing it
          }
        });
      }

      // Update category details
      const id = req.params.id;
      const update_category = await Category.findByIdAndUpdate(
        id, // Directly use the id instead of { _id: id }
        editCategory,
        { new: true } // This option returns the updated document
      );

      if (update_category) {
        req.flash('success', "category updated successfully ");
        res.redirect("/admin/category");
      } else {
        req.flash('error', "category updated failed ");
        res.redirect("/admin/category")
        
      }
    } catch (error) {
      console.error(error.message);
      req.flash('error', "category updated failed ");
      res.redirect("/admin/category")
    }
  },
  //delete category
  deleteCategory: async (req, res) => {
    const id = req.query.id;
    const image = req.query.image;

    try {
      // Check if the category is used by any product
      const productsUsingCategory = await Product.find({ category: id });

      if (productsUsingCategory.length > 0) {
        // If the category is used by any product, send a response indicating that the category is in use
        return res.status(400).json({
          success: false,
          message: "Category is in use by some products",
        });
      } else {
        // If the category is not used by any product, proceed to delete the category
        // delete banner image from file
        fs.unlink(`./public/uploads/category-images/${image}`, (err) => {
          if (err) throw err;
        });

        // deleting banner image from db
        const deleteCategory = await Category.findByIdAndDelete({ _id: id });
        if (deleteCategory) {
          res.json({
            success: true,
          });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Category not found" });
        }
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete category" });
    }
  },
}