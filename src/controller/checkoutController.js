const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Cart = require("../model/cartSchema");
const User = require("../model/userSchema");
const Address = require("../model/addressSchema");
const Order = require("../model/orderSchema");
const Coupon = require("../model/couponSchema");
const Wallet = require("../model/walletSchema");
const Payment = require("../model/paymentSchema");

const Razorpay = require("razorpay");
const crypto = require("crypto");

var instance = new Razorpay({
  key_id: process.env.RAZ_KEY_ID,
  key_secret: process.env.RAZ_KEY_SECRET,
});

const checkProductExistence = async (item) => {
  const product = await Product.findById(item.product_id._id);
  console.log(product);
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
const createRazorpayOrder = async (order_id, total) => {
  let options = {
    amount: total * 100, // amount in the smallest currency unit
    currency: "INR",
    receipt: order_id.toString(),
  };
  const order = await instance.orders.create(options);

  return order;
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

    // Apply coupon discount if applicable
    let couponDiscount = 0;
    if (cart.coupon) {
      const coupon = await Coupon.findById(cart.coupon);
      if (
        coupon &&
        coupon.isActive &&
        new Date() <= coupon.expirationDate &&
        totalPrice >= coupon.minPurchaseAmount
      ) {
        couponDiscount = totalPrice * (coupon.rateOfDiscount / 100);
        totalPrice -= couponDiscount;
      } else {
        // If the total is less than the minimum purchase amount, remove the coupon
        cart.coupon = undefined;
        cart.couponDiscount = 0;
        await cart.save();
      }
    }

    const coupons = await Coupon.find({
      isActive: true,

      expirationDate: { $gte: Date.now() },
      // usedBy: [{ $: req.user.id }],
    });
    console.log(coupons);

    const locals = {
      title: "shutter - Checkout",
    };

    res.render("shop/checkOut", {
      locals,
      cart,
      coupons,
      address,
      couponDiscount,
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
      if (!req.body.paymentMethod) {
        return res
          .status(400)
          .json({ status: false, message: "Please select a payment method" });
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

      let order;

      if (cart.coupon) {
        order = new Order({
          customer_id: user._id,
          items: cart.items,
          totalPrice: cart.totalPrice,
          coupon: cart.coupon,
          couponDiscount: cart.couponDiscount,
          payable: cart.payable,
          paymentMethod,
          status,
          shippingAddress: address,
        });
        order.items.forEach((item) => {
          item.status = status;
        });
      } else {
        order = new Order({
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
      }
      // order.status = paymentMethod == "COD" ? "Confirmed" : "Pending";

      switch (paymentMethod) {
        case "COD":
          if (!order) {
            return res.status(500).json({ error: "Failed to create order" });
          }
          const orderPlaced = await order.save();

          if (orderPlaced) {
            // if coupon is used
            if (order.coupon) {
              await Coupon.findOneAndUpdate(
                { _id: cart.coupon },
                { $push: { usedBy: { userId: req.user.id } } }
              );
            }
          }

          for (const item of cart.items) {
            const product = await Product.findById(item.product_id);
            if (product) {
              product.quantity -= item.quantity;
              await product.save();
            }
          }

          if (orderPlaced) {
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

        case "Online":
          const createOrder = await Order.create(order);

          let total = parseInt(cart.payable);
          let order_id = createOrder._id;

          const RazorpayOrder = await createRazorpayOrder(order_id, total).then(
            (order) => order
          );

          const timestamp = RazorpayOrder.created_at;
          const date = new Date(timestamp * 1000); // Convert the Unix timestamp to milliseconds

          // Format the date and time
          const formattedDate = date.toISOString();

          //creating a instance for payment details
          let payment = new Payment({
            payment_id: RazorpayOrder.id,
            amount: parseInt(RazorpayOrder.amount) / 100,
            currency: RazorpayOrder.currency,
            order_id: order_id,
            status: RazorpayOrder.status,
            created_at: formattedDate,
          });

          //saving in to db
          await payment.save();

          return res.json({
            status: true,
            order: RazorpayOrder,
            user,
          });

          break;

        case "Wallet":
          const orderCreate = await Order.create(order);

          if (orderCreate) {
            let wallet = await Wallet.findOne({ userId: req.user.id });

            wallet.balance =
              parseInt(wallet.balance) - parseInt(orderCreate.payable);

            wallet.transactions.push({
              date: new Date(),
              amount: parseInt(orderCreate.payable),
              message: "Order placed successfully",
              type: "Debit",
            });

            await wallet.save();

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

              product.quantity -= item.quantity;

              await product.save().catch((error) => {
                console.error(error);
                return res
                  .status(500)
                  .json({ error: "Failed to update product stock" });
              });
            }

            await Cart.clearCart(req.user.id);

            orderCreate.status = "Confirmed";
            orderCreate.items.forEach((item) => {
              item.status = "Confirmed";
            });

            await orderCreate.save();

            // coupon is used
            if (order.coupon) {
              await Coupon.findOneAndUpdate(
                { _id: userCart.coupon },
                { $push: { usedBy: { userId: req.user.id } } }
              );
            }

            return res.status(200).json({
              success: true,
              message: "Order has been placed successfully.",
            });
          }

          break;

        default:
          return res.status(400).json({ error: "Invalid payment method" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while placing the order" });
    }
  },
  verifyPayment: async (req, res) => {
    console.log(req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body.response;
    const secret = process.env.RAZ_KEY_SECRET;

    try {
      const hmac = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isSignatureValid = hmac === razorpay_signature;
      console.log(hmac, razorpay_signature, isSignatureValid);

      if (isSignatureValid) {
        let customer_id = req.user.id;

        let cart = await Cart.findOne({ userId: customer_id }).catch(
          (error) => {
            console.error(error);
            return res
              .status(500)
              .json({ error: "Failed to find user's cart" });
          }
        );

        for (const item of cart.items) {
          const product = await Product.findById(item.product_id).catch(
            (error) => {
              console.error(error);
              return res.status(500).json({ error: "Failed to find product" });
            }
          );

          if (!product) {
            return res.status(404).json({ error: "Product not found" });
          }

          product.quantity -= item.quantity;

          await product.save().catch((error) => {
            console.error(error);
            return res
              .status(500)
              .json({ error: "Failed to update product stock" });
          });
        }

        //empty the cart
        await Cart.clearCart(req.user.id).catch((error) => {
          console.error(error);
          return res.status(500).json({ error: "Failed to clear user's cart" });
        });

        let paymentId = razorpay_order_id;

        const orderID = await Payment.findOne(
          { payment_id: paymentId },
          { _id: 0, order_id: 1 }
        );

        const order_id = orderID.order_id;

        const updateOrder = await Order.updateOne(
          { _id: order_id },
          {
            $set: {
              "items.$[].status": "Confirmed",
              "items.$[].paymentStatus": "Paid",
              status: "Confirmed",
              paymentStatus: "Paid",
            },
          }
        );

        let couponId = await Order.findOne({ _id: order_id }).populate(
          "coupon"
        );

        console.log(couponId);
        if (couponId.coupon) {
          couponId = couponId.coupon._id;
          if (couponId) {
            let updateCoupon = await Coupon.findByIdAndUpdate(
              { _id: couponId },
              {
                $push: { usedBy: customer_id },
              },
              {
                new: true,
              }
            );
          }
        }
        console.log(updateCoupon);
        req.session.order = {
          status: true,
        };
        res.json({
          success: true,
        });
      } else {
      }
    } catch (error) {
      console.log(error);
    }
  },
};
