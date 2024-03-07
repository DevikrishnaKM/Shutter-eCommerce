const adminLayout = "./layouts/adminLayout.ejs";


module.exports = {
    getDashboard: async (req, res) => {
        const locals = {
          title: "Shutter - Dashboard",
        };
        res.render("admin/dashboard",{
            locals,
            layout: adminLayout,
        })
    },    
}