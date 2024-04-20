const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Cart = require("../model/cartSchema");
const User = require("../model/userSchema");
const Address = require("../model/addressSchema");
const Order = require("../model/orderSchema");

const checkProductExistence = async (item) => {
  const product = await Product.findById(item.product_id._id);
  console.log(product)
  if (!product || product.isBlocked) {
    throw new Error(`${product ? product.productName : "not available"}`);
  }
  
  return product;
};

const checkStockAvailability = async (item) => {
  const product = await Product.findById(item.product_id._id);

  if (product.quantity < item.quantity) {
    throw new Error(`${product.productName}`);
  }

  return product;
};

module.exports = {
  getCheckout: async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }
    const cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product_id"
    );
    if (!cart) {
      console.log("cart not found");
      return res
        .status(404)
        .json({ success: false, message: "cart not found" });
    }

    if (!cart.items.length > 0) {
      return res.redirect("/user/cart");
    }

    const productExistingPromises = cart.items.map((item) =>
      checkProductExistence(item)
    );

    const productExistenceResults = await Promise.allSettled(
      productExistingPromises
    );

    // Filter out the rejected promises to identify which items are not valid
    const invalidCartItems = productExistenceResults
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    if (invalidCartItems.length > 0) {
      console.log(invalidCartItems);
      req.flash(
        "error",
        `The following items are not available: ${invalidCartItems
          .join(", ")
          .replaceAll("Error:", "")}`
      );

      return res.redirect("/user/cart");
    }

    // Correctly use map with async functions
    const stockAvailabilityPromises = cart.items.map((item) =>
      checkStockAvailability(item)
    );
    const stockAvailabilityResults = await Promise.allSettled(
      stockAvailabilityPromises
    );

    // Filter out the rejected promises to identify which items have insufficient stock
    const insufficientStockItems = stockAvailabilityResults
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    if (insufficientStockItems.length > 0) {
      console.log(insufficientStockItems);
      req.flash(
        "error",
        `Insufficient stock for the following items: ${insufficientStockItems
          .join(", ")
          .replaceAll("Error: ", "")}`
      );

      return res.redirect("/user/cart");
    }

    const productId = req.params.productId;
    const address = await Address.find({
      customer_id: req.user.id,
    });

    let totalPrice = 0;
    // Correctly declare the variable before the loop
    for (let prod of cart.items) {
      prod.itemTotal = prod.Price * prod.quantity;
      totalPrice += prod.itemTotal;
    }

    const locals = {
      title: "shutter - Checkout",
    };

    res.render("shop/checkOut", {
      locals,
      cart,
      address,
      totalPrice,
    });
  },
  /**
   * add address
   */
  addAddress: async (req, res) => {
    console.log(req.body);
    await Address.create(req.body);
    req.flash("success", "Address Addedd");
    res.redirect("/checkout");
  },
  /**
   * edit address
   */
  editAddress: async (req, res) => {
    try {
      const addressId = req.params.id;
      const updatedAddress = req.body;
      console.log(addressId);
      console.log(updatedAddress);

      const address = await Address.findByIdAndUpdate(
        addressId,
        updatedAddress,
        { new: true }
      );

      if (!address) {
        console.log("address not found");
        res.status(404).json({ success: false, message: "address not found" });
      }
      req.flash("success", "editedd successfully");
      res.redirect("/checkout");
    } catch (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        message: "please try again! error in editing address",
      });
    }
  },
  deleteAddress: async (req, res) => {
    console.log(req.params);
    let id = req.params.id;
    try {
      const result = await Address.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        // If the document was successfully deleted, send a success response
        res.status(200).json({ message: "Address deleted successfully" });
      } else {
        // If no document was found to delete, send an appropriate response
        res.status(404).json({ message: "Address not found" });
      }
    } catch (error) {
      // Handle any errors that occurred during the database operation
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  placeOrder: async (req, res) => {
    try {
      const { paymentMethod, address } = req.body;

      console.log(req.body);

      if (!req.body.address) {
        return res
          .status(400)
          .json({ status: false, message: "Please add the address" });
      }

      const user = await User.findById(req.user.id).catch((error) => {
        console.error(error);
        return res.status(500).json({ error: "Failed to find user" });
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let cart = await Cart.findOne({ userId: user._id }).catch((error) => {
        console.error(error);
        return res.status(500).json({ error: "Failed to find user's cart" });
      });

      if (!cart) {
        return res.status(404).json({ error: "User's cart not found" });
      }
      const status =
        paymentMethod == "COD" || paymentMethod == "Wallet"
          ? "Confirmed"
          : "Pending";

      console.log(cart.items);

      let order = new Order({
        customer_id: user._id,
        items: cart.items,
        totalPrice: cart.totalPrice,
        payable: cart.payable,
        paymentMethod,
        status,
        shippingAddress: address,
      });

      order.items.forEach((item) => {
        item.status = status;
      });
      // order.status = paymentMethod == "COD" ? "Confirmed" : "Pending";

      switch (paymentMethod) {
        case "COD":
          if (!order) {
            return res.status(500).json({ error: "Failed to create order" });
          }

          // Save the order
          const orderPlaced = await order.save();

          for (const item of cart.items) {
            const product = await Product.findById(item.product_id);
            if (product) {
              product.quantity -= item.quantity;
              await product.save();
            }
          }

          if (orderPlaced) {
            // reduce stock of the variant
            for (const item of cart.items) {
              const product = await Product.findById(item.product_id).catch(
                (error) => {
                  console.error(error);
                  return res
                    .status(500)
                    .json({ error: "Failed to find product" });
                }
              );

              if (!product) {
                return res.status(404).json({ error: "Product not found" });
              }

              await product.save().catch((error) => {
                console.error(error);
                return res
                  .status(500)
                  .json({ error: "Failed to update product stock" });
              });
            }

            await Cart.clearCart(req.user.id).catch((error) => {
              console.error(error);
              return res
                .status(500)
                .json({ error: "Failed to clear user's cart" });
            });

            return res.status(200).json({
              success: true,
              message: "Order has been placed successfully.",
            });
          }

          break;
        default:
          return res.status(400).json({ error: "Invalid payment method" });
      }

      // console.log(order);

      // return res
      //   .status(200)
      //   .json({ status: true, message: "Order placed successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while placing the order" });
    }
  },
};
