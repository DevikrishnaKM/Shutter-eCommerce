const adminLayout = "./layouts/adminLayout.ejs";
const User = require("../model/userSchema");

module.exports = {
    getDashboard: async (req, res) => {
        const locals = {
          title: "Shutter - Dashboard",
        };
        const users = await User.find();

        const usersCount = await User.find().countDocuments();

        res.render("admin/dashboard",{
            locals,
            users,
            usersCount,
            admin: req.user,
            layout: adminLayout,
        })

    },    
    getUsersList: async (req, res) => {
        const locals = {
          title: "Shutter - Users",
        };
    
        let perPage = 9;
        let page = req.query.page || 1;
    
        const users = await User.aggregate([{ $sort: { createdAt: -1 } }])
          .skip(perPage * page - perPage)
          .limit(perPage)
          .exec();
    
        const count = await User.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
    
        res.render("admin/users/users", {
          locals,
          users,
          current: page,
          pages: Math.ceil(count / perPage),
          nextPage: hasNextPage ? nextPage : null,
          currentRoute: "/admin/users/",
          layout: adminLayout,
        });
      },
      toggleBlock: async (req, res) => {
        try {
          const user = await User.findById(req.params.id);
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          user.isBlocked = !user.isBlocked;
          await user.save();
          res.status(200).json({ message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully' });
        } catch (error) {
          res.status(500).json({ message: 'Server error' });
        }
      },
    
}