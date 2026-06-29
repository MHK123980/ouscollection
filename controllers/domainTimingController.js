const DomainTiming = require("../models/domainTiming")

module.exports = {

    getTiming: async (req, res) => {
        try {
            const timing = await DomainTiming.findOne()
            res.render("admin/domainTiming", {
                timing: timing,
                layout: "layouts/adminLayout",
            })
        } catch (err) {
            console.log(err)
            res.redirect("/admin")
        }
    },

    addTiming: async (req, res) => {
        try {
            const existing = await DomainTiming.findOne()
            if (existing) {
                return res.status(400).json({ message: "Only 1 domain timing allowed. Delete the existing one first." })
            }
            const { startDate, expiryDate } = req.body
            if (!startDate || !expiryDate) {
                return res.status(400).json({ message: "Both start and expiry dates are required." })
            }
            const newTiming = new DomainTiming({ startDate, expiryDate })
            await newTiming.save()
            res.redirect("/admin/domain-timing")
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: err.message || "Something went wrong" })
        }
    },

    deleteTiming: async (req, res) => {
        try {
            await DomainTiming.findByIdAndDelete(req.params.id)
            res.status(200).json({ message: "Deleted" })
        } catch (err) {
            console.log(err)
            res.status(500).json({ err })
        }
    }
}
