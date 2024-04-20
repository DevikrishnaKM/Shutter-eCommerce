const User = require("../model/userSchema");
const Address = require("../model/addressSchema");
const Product = require("../model/productSchema");
const WishList = require("../model/wishlistSchema");
const Order = require("../model/orderSchema");
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
  editProfile: async (req, res) => {
    try {
      console.log(req.body);
      const user = await User.findById(req.user.id);

      const { firstName, lastName, phone } = req.body;

      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.phone = phone || user.phone;

      await user.save();

      // Send a success response back to the client
      res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
      // Handle errors and send an error response
      console.error(error);
      res.status(500).json({
        message: "An error occurred while updating the profile",
        error,
      });
    }
  },
  /**
   * address
   */
  getAddress: async (req, res) => {
    const address = await Address.find({
      customer_id: req.user.id,
      delete: false,
    });

    // console.log(address);

    const locals = {
      title: "Shutter - Profile",
    };

    res.render("user/address", {
      locals,
      address,
      user: req.user,
    });
  },
  addAddress: async (req, res) => {
    console.log(req.body);
    await Address.create(req.body);
    req.flash("success", "Address Addedd");
    res.redirect("/user/address");
  },
  getEditAddress: async (req, res) => {
    const addressId = req.params.id;

    try {
      const address = await Address.findOne({ _id: addressId });
      if (address) {
        res.status(200).json({ status: true, address });
      } else {
        // Send a  404 status code with a JSON object indicating the address was not found
        res.status(404).json({ status: false, message: "Address not found" });
      }
    } catch (error) {
      // Handle any errors that occurred during the database operation
      console.error(error);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
  editAddress: async (req, res) => {
    try {
      const addressId = req.params.id;
      const updatedAddress = req.body;

      // Assuming you have a model for addresses, e.g., Address
      const address = await Address.findByIdAndUpdate(
        addressId,
        updatedAddress,
        {
          new: true, // returns the new document if true
        }
      );

      if (!address) {
        return res
          .status(404)
          .send({ message: "Address not found with id " + addressId });
      }

      req.flash("success", "Address Edited");
      res.redirect("/user/address");
    } catch (error) {
      console.error(error);
      req.flash("error", "Error editing address. Please try again.");
      res.redirect("/user/address");
    }
  },
  deleteAddress: async (req, res) => {
    let id = req.params.id;
    try {
      // Check if the address is in use by any orders
      const order = await Order.findOne({ "address._id": id });
      if (order) {
        console.log(order);
        // If the address is in use, perform a soft delete by setting the delete boolean to true
        const result = await Address.findByIdAndUpdate(
          id,
          { delete: true },
          { new: true }
        );
        if (result) {
          console.log(result);
          res
            .status(200)
            .json({ message: "Address marked as deleted successfully" });
        } else {
          res.status(404).json({ message: "Address not found" });
        }
      } else {
        // If the address is not in use, proceed with the deletion
        const result = await Address.deleteOne({ _id: id });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Address deleted successfully" });
        } else {
          res.status(404).json({ message: "Address not found" });
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /***
   * User Wishlist Mangement
   */

  getWishlist: async (req, res) => {
    const locals = {
      title: "Shutter - Wishlist",
    };
    let user = await User.findById(req.user.id);
    let wishlist = await WishList.findById(user.wishlist).populate({
      path: "products",
    });
    // console.log(wishlist);
    let products;

    if (!wishlist) {
      products = [];
    } else {
      products = wishlist.products;
    }

    res.render("user/wishlist", {
      locals,
      user,
      wishlist,
      products,
    });
  },

  addToWishlist: async (req, res) => {
    console.log(req.body);

    const { productId } = req.body;
    let product,
      user,
      userWishListID,
      userWishListData,
      productsInWishList,
      productAlreadyInWishList;

    try {
      product = await Product.findById(productId);
      user = await User.findById(req.user.id);

      if (!product) {
        console.log("Product not found");
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      if (!user) {
        console.log("User not found");
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      userWishListID = user.wishlist;

      if (!userWishListID) {
        const newWishList = new WishList({ userId: user._id });
        await newWishList.save();
        userWishListID = newWishList._id;
        await User.findByIdAndUpdate(user._id, {
          $set: { wishlist: userWishListID },
        });
      }

      userWishListData = await WishList.findById(userWishListID);
      productsInWishList = userWishListData.products;

      productAlreadyInWishList = productsInWishList.some((existingProduct) =>
        existingProduct.equals(product._id)
      );

      if (productAlreadyInWishList) {
        console.log("Product already exists in wishlist");
        return res.status(400).json({
          success: false,
          message: "Product already exists in wishlist",
        });
      }

      await WishList.findByIdAndUpdate(userWishListID, {
        $push: { products: product._id },
      });

      console.log("Product added to wishlist");
      return res
        .status(201)
        .json({ success: true, message: "Product added to wishlist" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "An error occurred, server facing issues !",
      });
    }
  },

  // Password Reset From Profile
  changePassword: async (req, res) => {
    try {
      console.log(req.body);
       const { oldPassword, newPassword, confirmNewPassword } = req.body;
       // Find the user by ID
       let user = await User.findById(req.user.id);
        console.log(user);
       // Check if the old password is correct
       let validPass = await bcrypt.compare(oldPassword, user.password);
       if (!validPass) {
         req.flash('error', 'The old password is incorrect.');
         return res.status(400).json({ success: false, message: 'The old password is incorrect.' });
       }
   
       // Check if the new password matches the confirmation
       if (newPassword !== confirmNewPassword) {
         req.flash('error', 'The new password does not match the confirmation.');
         return res.status(400).json({ success: false, message: 'The new password does not match the confirmation.' });
       }
   
       // Check if the new password is the same as the old password
       let samePass = oldPassword === newPassword || await bcrypt.compare(newPassword, user.password);
       if (samePass) {
         req.flash('error', 'The new password is the same as the old password.');
         return res.status(400).json({ success: false, message: 'The new password is the same as the old password.' });
       }
   
       // Update the user's password
       user.password = newPassword
       await user.save();
   
       req.flash('success', 'Password changed successfully.');
       return res.status(200).json({success:true,message:"change password successfully"})
    } catch (error) {
       console.error(error); // Log the error for debugging purposes
       req.flash('error', 'An error occurred while changing the password.');
       return res.redirect('/user/profile');
    }
   },
   
};
