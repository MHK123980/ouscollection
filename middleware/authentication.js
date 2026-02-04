const { sendOtp, getOtpForm } = require("./otp")

module.exports = {
    checkLoggedOut: (req, res, next) => {
        if (req.isAuthenticated() && req.user.isAdmin) {
            res.redirect("/admin")
        }
        else if (req.isAuthenticated()) {
            res.redirect("/")
        }
        else {
            next()
        }
    },

    checkLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next()
        }

        // Check if request expects JSON (like AJAX/API calls)
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ message: "Authentication required. Please Login." })
        }

        if (req.originalUrl && req.originalUrl.startsWith("/admin")) {
            res.redirect("/admin/login")
        } else {
            // For public/customer routes, send back to home (no customer login)
            res.redirect("/")
        }
    },

    checkAccountVerified: (req, res, next) => {
        if (req.user.isVerified) {
            next()
        }
        else {
            return getOtpForm(req, res)
        }
    },

    checkAccountVerifiedInIndex: (req, res, next) => {
        if (req.isAuthenticated()) {
            // If user is admin, skip verification check and let them access website as customer
            if (req.user.isAdmin) {
                return next()
            }
            if (req.user.isVerified) {
                next()
            }
            else {
                return getOtpForm(req, res)
            }
        } else {
            next()
        }
    },

    checkAdminPrivilege: (req, res, next) => {
        if (req.user.isAdmin) {
            next()
        }
        else {
            res.redirect("/error")
        }
    },

}