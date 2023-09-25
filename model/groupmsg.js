const mongoose = require("mongoose")
const groupmsgSchema = new mongoose.Schema({
    targetroom: { type: String,
            required: true },
    sender: { type: String,
            required: true },
    roommessage: { type: String, 
            required: true },
    timestamp: { type: Date,
             default: Date.now }        
})
const roommsg = mongoose.model('group_messages',groupmsgSchema)
module.exports = roommsg