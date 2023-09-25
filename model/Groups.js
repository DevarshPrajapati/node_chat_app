const mongoose = require("mongoose")
const groupnameSchema = new mongoose.Schema({
    roomname: { type: String,
            required: true },
     admin:{ type: String,
                required: true },
    timestamp: { type: Date,
             default: Date.now }        
})
const groups = mongoose.model('group_name',groupnameSchema)
module.exports = groups