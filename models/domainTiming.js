const mongoose = require("mongoose")

const domainTimingSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model("DomainTiming", domainTimingSchema)
