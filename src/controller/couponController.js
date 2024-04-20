const Coupon = require("../model/couponSchema");
const Cart = require("../model/cartSchema");
const layout = "./layouts/adminLayout";

module.exports = {
  getCoupons: async (req, res) => {
    let perPage = 9;
    let page = req.query.page || 1;

    const coupons = await Coupon.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const count = await Coupon.find().countDocuments();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render("admin/coupons/coupons", {
      coupons,
      layout,
      current: page,
      pages: Math.ceil(count / perPage),
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: "/admin/coupons/",
    });
  },
};
