const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const {ensureCorrectUser, ensureLoggedIn} = require("../middleware/auth");
const ExpressError = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureCorrectUser, async (req, res, next) => {
    try {
        const message = await Message.get(req.param.id);
        return res.json({message});
    } catch (e) {
        return next(e);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const {to_username, body} = req.body;
        const message = await Message.create(req.user.username, to_username, body);
        return res.json({message});
    } catch (e) {
        return next(e);
    }
    

})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const m = await Message.get(req.param.id);
        if (req.user.username !== m.to_username) {
            throw new ExpressError("You do not have access to this message", 403)
        }
        const message = await Message.markRead(req.param.id);
        return res.json({message});
    } catch (e) {
        return next(e);
    }
})
