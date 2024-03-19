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
  editCategory: async (req, res) => {
    try {
      const { status, imageName } = req.body;
      let name = req.body.name.toLowerCase();
      let editCategory = {
        name: name,
        isActive: status === "true" ? true : false,
      };

      if (req.files) {
        editCategory.image = {
          filename: req.files.category_image[0].filename,
          originalname: req.files.category_image[0].originalname,
          path: req.files.category_image[0].path,
        };

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
        res.json({
          success: true,
          category: update_category, // Optionally return the updated category
        });
      } else {
        res.status(404).json({ success: false, message: "Category not found" });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
}