const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;
const productSchema = mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },
    category: {
      type: ObjectId,
      ref: "category",
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
    },
    createdOn: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    images: {
      type: Array,
      required: true,
    },
    onOffer: {
      type: Boolean,
      default: false,
    },
    offerDiscountPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    offerDiscountRate: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
