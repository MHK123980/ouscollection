const passport = require("passport")
const User = require("../models/users")

module.exports = () => {
    // Use passport-local-mongoose provided strategy
    passport.use(User.createStrategy());

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
}



