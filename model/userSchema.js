const mongoose = require("mongoose")
const usersSchema = new mongoose.Schema({
    username: String,
    email:String,
    password: String,  
    contactnumber:Number, 
    Gender: String, 
    Profile:String, 
    createdAt: { type: Date,
        default: Date.now }  
})
const User = mongoose.model('users',usersSchema)
module.exports = User




