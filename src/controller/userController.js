const User = require("../model/userSchema");
const Product = require("../model/productSchema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

module.exports = {
     /**
   * User Profile Mangement
   */
  getProfile: async (req, res) => {
    const locals = {
      title: "Shutter - Profile",
    };

    res.render("user/profile", {
      locals,
      user: req.user,
    });
  },
}
