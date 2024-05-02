const Order = require("../model/orderSchema");
const User = require("../model/userSchema");
const Product = require("../model/productSchema");
const Address = require("../model/addressSchema");
const Wallet = require("../model/walletSchema");
const Return = require("../model/returnSchema");
const mongoose = require("mongoose");

const layout = "./layouts/adminLayout.ejs";

module.exports = {
  /**
   * User Side
   */

  // Order view
  getUserOrders: async (req, res) => {
    const user = await User.findById(req.user.id);

    let perPage = 4;
    let page = req.query.page || 1;

    let orderDetails = await Order.find({ customer_id: user._id })
      .populate("customer_id items.product_id shippingAddress")
      .sort({ createdAt: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    for (const order of orderDetails) {
      const allCancelled = order.items.every(
        (item) => item.status === "Cancelled"
      );
      const allReturned = order.items.every(
        (item) => item.status === "Returned"
      );
      const allDelivered = order.items.every(
        (item) => item.status === "Delivered"
      );
      const allShipped = order.items.every((item) => item.status === "Shipped");
      const allPending = order.items.every((item) => item.status === "Pending");

      let status;

      if (allCancelled) {
        status = "Cancelled";
      } else if (allReturned) {
        status = "Returned";
      } else if (allDelivered) {
        status = "Delivered";
      } else if (allShipped) {
        status = "Shipped";
      } else if (allPending) {
        status = "Failed";
      }

      if (status) {
        await Order.updateOne({ _id: order._id }, { $set: { status: status } });
      }
    }
    // orderDetails = orderDetails.reverse();
    console.log(orderDetails[0]);

    const count = await Order.countDocuments({ customer_id: user._id });

    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render("user/orders", {
      user,
      orderDetails,
      current: page,
      pages: Math.ceil(count / perPage),
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: "/user/orders/",
    });
  },
  getSingleOrder: async (req, res) => {
    const user = await User.findById(req.user.id);

    const { orderId } = req.params;

    try {
      let order_id = new mongoose.Types.ObjectId(orderId);

      let orderDetails = await Order.aggregate([
        {
          $match: {
            _id: order_id,
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "products",
            localField: "items.product_id",
            foreignField: "_id",
            as: "products",
          },
        },
        {
          $unwind: "$products",
        },
      ]);

      // Loop through the array and format the dates
      for (const order of orderDetails) {
        switch (order.items.status) {
          case "Confirmed":
            order.items.track = 15;
            order.items.ordered = true;
            order.items.delivered = false;
            order.items.cancelled = false;
            order.items.shipped = false;
            order.items.outdelivery = false;
            order.items.return = false;
            order.items.inReturn = false;
            order.items.needHelp = true;
            break;
          case "Shipped":
            order.items.track = 38;
            order.items.ordered = true;
            order.items.delivered = false;
            order.items.cancelled = false;
            order.items.shipped = true;
            order.items.outdelivery = false;
            order.items.return = false;
            order.items.inReturn = false;
            order.items.needHelp = true;
            break;
          case "Out for Delivery":
            order.items.track = 65;
            order.items.ordered = true;
            order.items.delivered = false;
            order.items.cancelled = false;
            order.items.shipped = true;
            order.items.outdelivery = true;
            order.items.return = false;
            order.items.inReturn = false;
            order.items.needHelp = true;
            break;
          case "Delivered":
            order.items.track = 100;
            order.items.ordered = false;
            order.items.cancelled = false;
            order.items.shipped = true;
            order.items.delivered = true;
            order.items.outdelivery = true;
            order.items.return = true;
            order.items.inReturn = false;
            order.items.needHelp = false;
            break;
          case "Cancelled":
            order.items.track = 0;
            order.items.ordered = false;
            order.items.cancelled = true;
            order.items.delivered = false;
            order.items.shipped = false;
            order.items.outdelivery = false;
            order.items.return = false;
            order.items.inReturn = false;
            order.items.needHelp = true;
            break;
          case "In-Return":
            order.items.track = 0;
            order.items.ordered = false;
            order.items.cancelled = true;
            order.items.delivered = false;
            order.items.shipped = false;
            order.items.outdelivery = false;
            order.items.return = false;
            order.items.inReturn = false;
            order.items.needHelp = true;
            break;
          case "Returned":
            order.items.track = 0;
            order.items.ordered = false;
            order.items.cancelled = true;
            order.items.delivered = false;
            order.items.shipped = false;
            order.items.outdelivery = false;
            order.items.return = false;
            order.items.inReturn = false;
            order.items.needHelp = true;
            break;
          default:
            order.items.track = 0;
            order.items.pending = true;
            order.items.inReturn = false;
        }
      }

      console.log(orderDetails);

      const isInReturn = await Return.findOne({ order_id: order_id });
      console.log(isInReturn);
      if (isInReturn) {
        for (const order of orderDetails) {
          const orderProductId = (await order.items.product_id).toString();
          const orderItemId = (await order.items.orderID).toString();
          const returnProductId = isInReturn.product_id.toString();
          const returnItemId = isInReturn.item_id.toString();

          if (
            orderProductId === returnProductId &&
            orderItemId === returnItemId
          ) {
            order.items.inReturn = false;
            order.items.return = false;
            order.items.needHelp = false;
            // order.items.status = 'Return Requested';
            order.items.track = 10;
          }

          if (
            orderProductId === returnProductId &&
            orderItemId === returnItemId &&
            isInReturn.status === "approved"
          ) {
            order.items.inReturn = true;
            order.items.return = false;
            order.items.needHelp = false;
            // order.items.status = isInReturn.status;
            order.items.track = 60;
          }

          if (
            orderProductId === returnProductId &&
            orderItemId === returnItemId &&
            order.items.status === "Returned"
          ) {
            order.items.track = 100;
            order.items.inReturn = true;
            order.items.return = false;
            order.items.needHelp = false;
            order.items.status = "Returned";
          }
        }
      }

      // console.log(orderDetails);
      res.render("user/order", {
        user,
        orderDetails,
      });
    } catch (error) {
      console.log(error);
    }
  },
  // Cancel and Return
  cancelOrder: async (req, res) => {
   console.log(req.params)

   const {id,itemId} = req.params;
   try {
    const order = await Order.findOne({_id: id,"items.product_id":itemId});
    if(!order){
      return res.status(400).json({success:false,message:"order is not found"})
    }
    console.log(order)

    const updateOrder = await Order.updateOne(
      {
        _id : id,
        "items.product_id": itemId,
      },
      {
        $set : {
          "items.$.status" : "Cancelled",
          "items.$.cancelled_on" : new Date()
        },
      },
      {new : true}
    )
    
    
    return res.status(200).json({success:true,message:"order cancelled",order})
    
   } catch (error) {
    console.error(error);
    return res.status(500).json({success:false,message:"internal server error",error})
   }
  },
  returnOrder: async (req, res) => {
    console.log(req.body);
    let retrn = new Return({
      user_id: req.user.id,
      order_id: req.body.order_id,
      product_id: req.body.product_id,
      item_id: req.body.item_id,
      reason: req.body.reason,
      status: "pending",
      comment: req.body.comment,
    });
    retrn.save().then((retrn) => {
      console.log("Return request saved:", retrn);
    });
    res.json({
      success: true,
    });
  },
  /**
   * Admin Side
   */

  getOrders: async (req, res) => {
    // Product Wise Orders
    const locals = {
      title: "Order Management",
    };

    let perPage = 10;
    let page = req.query.page || 1;

    let orderDetails = await Order.aggregate([
      {
        $project: {
          _id: 1,
          customer_id: 1,
          items: 1,
          shippingAddress: 1,
          paymentMethod: 1,
          totalPrice: 1,
          payable: 1,
          categoryDiscount: 1,
          paymentStatus: 1,
          orderStatus: 1,
          clientOrderProcessingCompleted: 1,
          createdAt: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "customer_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$items" } },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "product_detail",
        },
      },
      {
        $addFields: {
          productDetails: {
            $mergeObjects: [
              {
                $arrayElemAt: ["$product_detail", 0],
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          user: 1,
          items: 1,
          paymentMethod: 1,
          totalPrice: 1,
          payable: 1,
          paymentStatus: 1,
          orderStatus: 1,
          createdAt: 1,
          productDetails: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    // console.log(orderDetails, orderDetails.length);

    // console.log(orders);
    const count = await Order.countDocuments();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render("admin/orders/orders", {
      locals,
      orders: orderDetails,
      current: page,
      pages: Math.ceil(count / perPage),
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: "/admin/orders/",
      layout,
    });
  },
  getOrderDetails: async (req, res) => {
    const orderId = req.params.id;
    const { productId } = req.query;

    try {
      const orderDetails = await Order.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(orderId) } }, // Filter by order ID
        { $unwind: "$items" }, // Unwind items array to process each item individually
        {
          $match: {
            "items.product_id": new mongoose.Types.ObjectId(productId), // Filter items by product ID
          },
        },
        {
          $lookup: {
            from: "products", // Assuming 'products' is the collection name for products
            localField: "items.product_id",
            foreignField: "_id",
            as: "items.productDetails",
          },
        },
        {
          $lookup: {
            from: "users", // Assuming 'sizes' is the collection name for sizes
            localField: "customer_id",
            foreignField: "_id",
            as: "userDetail",
          },
        },
        {
          $lookup: {
            from: "addresses", // Assuming 'sizes' is the collection name for sizes
            localField: "shippingAddress",
            foreignField: "_id",
            as: "addressDetails",
          },
        },
        {
          $addFields: {
            productDetails: {
              $mergeObjects: [{ $arrayElemAt: ["$items.productDetails", 0] }],
            },
            user: { $arrayElemAt: ["$userDetail", 0] },
            address: { $arrayElemAt: ["$addressDetails", 0] },
          },
        },
        {
          $project: {
            userDetail: 0,
            addressDetails: 0,
            "items.productDetails": 0,
          },
        },
      ]);

      // console.log(orderDetails);

      // console.log(orderDetails.customer_id);
      res.render("admin/orders/viewOrder", {
        layout,
        orderDetails: orderDetails[0],
      });
    } catch (error) {
      console.log(error);
    }
  },
  changeOrderStatus: async (req, res) => {
    const order_id = req.params.id;

    const { productId, status } = req.body;

    console.log(req.body);
    try {
      // Check if the order exists
      const order = await Order.findById(order_id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found." });
      }

      // Find the item in the order
      const currentItem = order.items.find(
        (item) => item.product_id.toString() === productId
      );

      console.log("currentItem: " + currentItem);

      // Check if the new status is valid
      if (
        ![
          "Cancelled",
          "Pending",
          "Confirmed",
          "Shipped",
          "Out for Delivery",
          "Delivered",
          "In-Return",
          "Returned",
        ].includes(status)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status." });
      }

      // Prepare the update object based on the new status
      let update = { "items.$.status": status };
      if (status === "Shipped") {
        update.shipped_on = new Date();
      } else if (status === "Out for Delivery") {
        update.out_for_delivery = new Date();
      } else if (status === "Delivered") {
        update.delivered_on = new Date();
      } else if (status === "Returned") {
        update.returned_on = new Date();

        // Update the current product variant stock
        const product = await Product.findById(currentItem.product_id);
      }

      // Update the order status
      const updateOrder = await Order.updateOne(
        {
          _id: order_id,
          "items.product_id": productId,
        },
        { $set: update }
      );

      console.log(updateOrder);
      // Check if the order was successfully updated
      if (updateOrder.modifiedCount > 0) {
        req.flash("success", "Product Order Status Updated Successfully");
        res.redirect("/admin/orders");
      } else {
        req.flash("error", "No changes were made.");
        res.redirect("/admin/orders");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error." });
    }
  },
};
