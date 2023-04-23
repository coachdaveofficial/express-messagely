const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
const {SECRET_KEY} = require("../config");



/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
    try {
        const {username, password} = req.body;
        const validLogin = await User.authenticate(username, password);
        if (!validLogin) {
            throw new ExpressError("Invalid username or password.", 400)
        }
        let token = jwt.sign({username}, SECRET_KEY);
        await User.updateLoginTimestamp(username);
        return res.json({token})

    } catch (e) {
        return next(e)
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
    try {
        const {username, password, first_name, last_name, phone} = req.body;
        const user = await User.register(username, password, first_name, last_name, phone);
        if (!user) {
            throw new ExpressError('Username already in use.', 400)
        }
        let token = jwt.sign({username}, SECRET_KEY);
        await User.updateLoginTimestamp(username)
        return res.json({token})
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
