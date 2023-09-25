const mongoose = require("mongoose")
const connection= mongoose.connect('mongodb://127.0.0.1:27017/chatapp',{
})
.then(()=>{console.log("Database connected");})
.catch((error)=>{
    console.log(error);
})
module.exports = connection