const mongoose = require('mongoose');

const connectDB = async ()=>{
    try {
        mongoose.set('strictQuery',false);
        const connect = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database connected:${connect.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports=connectDB;