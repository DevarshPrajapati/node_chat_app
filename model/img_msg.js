const mongoose = require("mongoose")
const message_imgSchema = new mongoose.Schema({
    sender: { type: String,
            required: true },
    receiver: { type: String,
            required: true },
    image: { type:String,
        required: true },
    timestamp: { type: Date,
             default: Date.now },
    dataURL:{type:String,
             required:true}
})
const msg_img = mongoose.model('message_image',message_imgSchema)
module.exports = msg_img