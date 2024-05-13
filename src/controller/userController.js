const User = require("../model/userSchema");
const Address = require("../model/addressSchema");
const Product = require("../model/productSchema");
const WishList = require("../model/wishlistSchema");
const Order = require("../model/orderSchema");
const Wallet = require("../model/walletSchema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// Razorpay
const Razorpay = require("razorpay");
const crypto = require("crypto");

var instance = new Razorpay({
  key_id: process.env.RAZ_KEY_ID,
  key_secret: process.env.RAZ_KEY_SECRET,
});

const createRazorpayOrder = async (order_id, total) => {
  let options = {
    amount: total * 100, // amount in the smallest currency unit
    currency: "INR",
    receipt: order_id.toString(),
  };
  const order = await instance.orders.create(options);

  return order;
};

function generateRefferalCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let referralCode = '';
  for (let i = 0; i < length; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return referralCode;
}

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
    console.log(req.body)
    const locals = {
      title: "Shutter - Wishlist",
    };
    let user = await User.findById(req.user.id);
    let wishlist = await WishList.findOne({ userId: req.user.id }).populate({
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
    console.log(req.body,req.params);
    

    const productId = req.body.productId;

    try {
      const product = await Product.findById(productId);
      if(!product){
        res.status(400).json({success:false,message:"product not found"})
      }
      const user = await User.findById(req.user.id);
      if(!user){
        res.status(400).json({success:false,message:"user not found"})
      }
      let wishlist = await WishList.findOne({userId: req.user.id});
      if(!wishlist){
        let items=[]
        items.push(product._id);
        wishlist = new WishList({
          userId: user._id,
          products:items,
        })
        await wishlist.save();
        return res.status(200).json({success:true,message:"added to wishlist"})
      }

      let productExist = wishlist.products.find(
        (item) => item.toString() === product._id.toString()
      );

      if(productExist){
        return res.status(400).json({success:false,message:"product already in wishlist"})
      }

      wishlist.products.push(product._id);
      await wishlist.save();
      return res.status(200).json({success:true,message:"added to wishlist"})
    } catch (error) {
      console.log(error);
      res.status(500).json({success:false,message:"Internal server error"})
    }
   
    
  },
  removeFromWishlist: async (req, res) => {
    try {
      const { productId } = req.body;
  
      // Assuming User and WishList models are properly imported
      const user = await User.findById(req.user.id);
      const updatedWishList = await WishList.findOneAndUpdate(
        { userId: user._id },
        { $pull: { products: productId } },
        { new: true }
      );
  
      if (updatedWishList) {
        return res.status(201).json({
          success: true,
          message: "Removed item from wishlist",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to remove product from wishlist. Please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to remove product from wishlist. Please try again.",
      });
    }
  },
  

  // Password Reset From Profile
  changePassword: async (req, res) => {
    try {
      // console.log(req.body);
       const { oldPassword, newPassword, confirmNewPassword } = req.body;
       // Find the user by ID
       let user = await User.findById(req.user.id);
        // console.log(user);
        
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
      
      res.redirect("/user/profile")
    } catch (error) {
       console.error(error); // Log the error for debugging purposes
       req.flash('error', 'An error occurred while changing the password.');
       return res.redirect('/user/profile');
    }
   },
   


/**
   * User Wallet
   */

getWallet: async (req, res) => {
  const locals = {
    title: "Shutter- User Wallet",
  };


  // TODO : pagination with 14 results per page

  let userWallet = await Wallet.findOne({ userId: req.user.id });
//  console.log(userWallet)
  const user = await User.findById(req.user.id);
  if (userWallet) {
    userWallet.transactions.reverse();
  }

  if(!userWallet){
    userWallet = {
      balance: 0,
      transactions: [],
    }
  }

  // console.log(userWallet);
  res.render("user/wallet", {
    locals,
    user,
    userWallet,
  });
},
addToWallet: async (req, res) => {
  try {
    // console.log(req.body)
    const { amount, notes } = req.body;
    const id = crypto.randomBytes(8).toString("hex");
    const payment = await createRazorpayOrder(id, amount);

    const user = await User.findOne({ _id: req.user.id });

    if (!payment) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create payment" });
    }

    res.json({ success: true, payment, user });
  } catch (error) {
    const { message } = error;
    res.status(500).json({ success: false, message });
  }
},

  verifyPayment : async (req, res) => {
    console.log(req.body)
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body.response;
    const secret = process.env.RAZ_KEY_SECRET;
    const {amount} = req.body.order;
    const userId = req.user.id;

    try {
      const hmac = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
      
    const isSignatureValid = hmac === razorpay_signature;
    console.log(hmac,razorpay_signature,isSignatureValid)

    if (isSignatureValid) {
      const wallet = await Wallet.findOne({ userId: userId });

      if (!wallet) {
        const newWallet = new Wallet({
          userId,
          balance: Math.ceil(amount / 100),
          transactions: [
            {
              date: new Date(),
              amount: Math.ceil(amount / 100),
              message: "Initial deposit",
              type: "Credit",
            },
          ],
        });
        await newWallet.save();
        return res
          .status(200)
          .json({ success: true, message: "Wallet created successfully" });
      } else {
        wallet.balance += Math.ceil(amount / 100);
        wallet.transactions.push({
          date: new Date(),
          amount: Math.ceil(amount / 100),
          message: "Money added to wallet from Razorpay",
          type: "Credit",
        });

        await wallet.save();
        return res
          .status(200)
          .json({
            success: true,
            message: "Money added to wallet successfully",
          });
      }
    }
    } catch (error) {
      res
      .status(500)
      .json({ success: false, message: "Internal server error" })
    }

  },


  getRefferals: async(req, res) => {
    const locals = {
      title: "Shutter - User Refferals"
    }

    const user = await User.findOne({ _id: req.user.id });

    if(!user.referralCode){
      const refferalCode = generateRefferalCode(8);

      user.referralCode = refferalCode;
      await user.save();
    }

    // console.log(user);

    successfullRefferals = user.successfullRefferals.reverse();

    res.render("user/refferals", {
      locals,
      user,
      refferalCode: user.referralCode,
      successfullRefferals
    })
  },
};
