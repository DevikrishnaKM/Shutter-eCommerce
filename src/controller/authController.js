module.exports={
    getLogin: async (req,res)=>{
        res.render('auth/user/login')
    },
    getRegister: async (req,res)=>{
        res.render('auth/user/register')
    },
}