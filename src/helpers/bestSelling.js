const Order = require('../model/orderSchema');

module.exports = {

    // function to get best selling products
    getBestSellingProducts: async () => {
        const products = await Order.aggregate([
            {
                $unwind: "$items",
            },
            {
                $match: {
                    "items.status": "Delivered",
                }
            },
            {
                $group: {
                    _id: "$items.product_id",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $unwind: "$product",
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    product: 1,
                    product_name: "$product.productName",
                },
            },
            {
                $limit: 10,
            }
        ])

        console.log(products);
        return products
    },
    
   
    // function to get best selling categories
    getBestSellingCategories: async () => {
        const categories = await Order.aggregate([
            {
                $unwind: "$items",
            },
            {
                $match: {
                    "items.status": "Delivered",
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product_id",
                    foreignField: "_id",
                    as: "items",
                },
            },
            {
                $unwind: "$items",
            },
            {
                $group: {
                    _id: "$items.category",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $unwind: "$category",
            },
            {
                $sort: { count: -1 },
            },
            { $limit: 10 },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    category: 1,
                    category_name: "$category.name",
                }
            }
        ])  

        console.log(categories);
        return categories
    },
};
