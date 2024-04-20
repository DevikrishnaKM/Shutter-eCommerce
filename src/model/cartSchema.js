const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Product = require("../model/productSchema");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  items: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, `Quantity can't be less than 1`],
      },
      price: {
        type: Number,
      },
      itemTotal:{
        type: Number,
        min:0,
      },
    },
  ],
  totalPrice:{
    type: Number,
  },
  payable: {
    type: Number,
  },
},
{ timestamps: true }
);
cartSchema.statics.clearCart = async function (userId) {
    return await this.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          items: [],
          totalPrice: 0,
          payable: 0,
        },
      },
      { new: true }
    );
  };
  
  module.exports = mongoose.model("Cart", cartSchema);