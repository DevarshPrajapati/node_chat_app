const mongoose = require("mongoose")
const messageSchema = new mongoose.Schema({
    sender: { type: String,
            required: true },
    receiver: { type: String,
            required: true },
    message: { type: String, 
            default: null },
//     image: { type:String,
//              default: null },
//    dataURL:{type:String,
//                 required:true},
    timestamp: { type: Date,
             default: Date.now }        
})
const msg = mongoose.model('message',messageSchema)
module.exports = msg
//