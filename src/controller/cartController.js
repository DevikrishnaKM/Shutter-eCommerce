const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Cart = require("../model/cartSchema");
const User = require("../model/userSchema");
const Order = require("../model/orderSchema");

module.exports = {
  getCart: async (req, res) => {
    let errors = [];
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Please log in to view cart." });
    }

    try {
      const userId = req.user.id;
      let cart = await Cart.findOne({ userId }).populate("items.product_id");

      console.log(cart);

      if (!cart) {
        cart = {
          items: [],
          totalPrice: 0,
        };
      } else {
        let totalPrice = 0;
        for (const prod of cart.items) {
          prod.price = prod.product_id.onOffer
            ? prod.product_id.offerDiscountPrice
            : prod.product_id.regularPrice;

          const itemTotal = prod.price * prod.quantity;
          prod.itemTotal = itemTotal;
          totalPrice += itemTotal;
        }

        cart.totalPrice = totalPrice;
        cart.payable = totalPrice;

        for (const item of cart.items) {
          const product = await Product.findOne({
            _id: item.product_id,
          });

          if (!product) {
            console.log(`The Product ${item.product_id} is not found!!`);
            errors.push(`The Product ${item.product_id} is not found!!`);
            continue;
          }

          if (!product.isBlocked) {
            console.log(
              `The Product ${product.productName} is not available!!`
            );
            errors.push(
              `The Product ${product.productName} is not available!!`
            );
            continue;
          }
          //check stock
        }
        await cart.save();
      }

      res.render("shop/cart", {
        cart,
        errorMsg: errors,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the cart." });
    }
  },

  addToCart: async (req, res) => {
    try {
      const productId = req.body.productId;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: error.message });
      }

      let cart = await Cart.findOne({ userId: req.user.id });
      if (!cart) {
        cart = new Cart({
          userId: req.user.id,
          items: [
            {
              product_id: product._id,
              quantity: 1,
              price: product.regularPrice,
              itemTotal: product.regularPrice,
            },
          ],
          totalPrice: product.regularPrice,
        });
        await cart.save();

        return res
          .status(200)
          .json({ success: true, message: "product added to cart" });
      } else {
        let productExist = cart.items.find(
          (item) => item.product_id.toString() === productId
        );
        if (productExist) {
          return res
            .status(400)
            .json({ success: false, message: "product already in cart" });
        }

        cart.items.push({
          product_id: product._id,
          quantity: 1,
          price: product.regularPrice,
          itemTotal: product.regularPrice,
        });

        let totalPrice = 0;
        for (prod of cart.items) {
          prod.itemTotal = prod.quantity * prod.price;
          totalPrice += prod.itemTotal;
        }

        cart.totalPrice = totalPrice;
        await cart.save();

        return res
          .status(200)
          .json({ success: true, message: "product added successfully" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateQuantity: async (req,res)=>{
    try {
      const productId = req.params.id;
      const qty = parseInt(req.query.qty);
      
      const product = await Product.findById(productId)
      if(!product){
        console.log("product not found");
        return res.status(404).json({success:false,message:"product not found"})
      }
      if(product.isBlocked){
        console.log("product not available");
        return res.status(404).json({success:false,message:"product not available"})
      }

      const cart = await Cart.findOne({userId:req.user.id}).populate("items.product_id")

      let itemExist = cart.items.find(
        (item)=>item.product_id._id.toString()===productId
      )

      if(!itemExist){
        console.log("item does not exist in cart");
        return res.status(404).json({success:false,message:"item does not exist in cart"})
      }

      let currentQuantity = itemExist.quantity
      console.log(currentQuantity,itemExist,product)
      if(qty>0){
        currentQuantity +=qty;
        if(currentQuantity >= product.quantity){
          return res.status(404).json({success:false,message:"product have limited stock"})
        }
      }else{
        currentQuantity +=qty;
        if(currentQuantity<=0){
          return res.status(404).json({success:false,message:"cannot  decrease quantity below 1"})
        }
      }
      const updateCart = await Cart.updateOne({userId:req.user.id,"items.product_id":productId},{
        $inc:{
          "items.$.quantity":qty
        }
      })

      if(updateCart){
        let updatedCart = await Cart.findOne({userId:req.user.id}).populate("items.product_id")

        let totalPrice = 0;
        for(prod of updatedCart.items){
          prod.itemTotal = prod.price*prod.quantity
          totalPrice += prod.itemTotal
        }
        let currentItem = updatedCart.items.find(
          (item)=>item.product_id._id.toString()===productId
        )
        
        await updatedCart.save();
        return res.status(200).json({success:true,currentItem,totalPrice})
      }

    } catch (error) {
      console.log(error);
      res.status(400).json({success:false,message:error.message});
    }
  },
  removeCartItem: async (req, res) => {
    try {
      console.log(req.params);
      const productId = req.params.id;
      const userId = req.user.id;

      console.log(
        `Removing product with ID: ${productId} from user with ID: ${userId}`
      );

      const result = await Cart.updateOne(
        { userId: req.user.id },
        {
          $pull: {
            items: { product_id: new mongoose.Types.ObjectId(productId) },
          },
        }
      );

      

      res.json({ success: true, message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing item", error);
      res
        .status(500)
        .json({ success: false, message: "Error removing item from cart" });
    }
  },
  getOrderSuccess: async (req, res) => {
    let user = await User.findById(req.user.id);
    let order = await Order.aggregate([
      {
        $match: {
          customer_id: user._id,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);
    let order_id = order[0]._id;

    res.render("shop/orderConfirm", {
      order: order_id,
    });
  },
};
