const bcrypt = require("bcrypt");

const User = require("../model/userSchema");

module.exports = {
    getLogin: async (req, res) => {

        const locals = {
            title: "Shutter - Login",
        };

        res.render('auth/user/login', {
            locals,
            success: req.flash("success"),
            error: req.flash("error"),
        })
    },
    getRegister: async (req, res) => {
        res.render('auth/user/register')
    },
    userRegister:async (req,res)=>{
        //  console.log(req.body);
         const errors = validationResult(req);
         console.log(errors);
         if (!errors.isEmpty()) {
           req.flash(
             "error",
             errors.array().map((err) => err.msg)
           );
           // return res.status(422).json({ errors: errors.array() });
           return res.redirect("/register");
         }
        const {username,firstName,lastName,email,password,confirmPassword}=req.body;
        
        const existingUser=await User.findOne({email});

        if(existingUser){
            req.flash("error","Email already in use");
            return res.redirect("/register")
        }

        if(password !== confirmPassword){
            req.flash("error","Password do not match");
            return res.redirect("/register");
        }

        const user=new User({
            username,
            firstName,
            lastName,
            email,
            password,
        })

        let savedUser = await user.save();

        if (!savedUser){
            req.flash("error","User Registration Unsuccessfull");
            return res.redirect("/register");
        }else{
            req.session.verifyToken = savedUser._id;
        }
    },
    getVerifyOtp: async (req, res) => {
        res.render('auth/user/verifyOtp')
    },
    getForgotPass: async (req, res) => {
        res.render('auth/user/forgotPassword')
    }
}