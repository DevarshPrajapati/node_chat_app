const mongoose = require("mongoose")
const messageSchema = new mongoose.Schema({
    sender: { type: String,
            required: true },
    receiver: { type: String,
            required: true },
    message: { type: String, 
            default: null },
    image: { type:String,
             default: null },
    timestamp: { type: Date,
             default: Date.now }        
})
const msg = mongoose.model('message',messageSchema)
module.exports = msg
//