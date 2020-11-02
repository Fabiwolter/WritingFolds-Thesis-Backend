const express = require('express')
const {requireSignin, authMiddleware} = require('../controllers/authController')
const {read, publicProfile, update, photo, addFriend, removeFriend} = require('../controllers/userController')
const router = express.Router()

router.get('/user/profile', requireSignin, authMiddleware, read)
router.get('/user/:username', publicProfile)
router.put('/user/update', requireSignin, authMiddleware, update)
router.get('/user/photo/:username', photo)
router.put('/user/friend', requireSignin, authMiddleware, addFriend)
router.delete('/user/friend', requireSignin, authMiddleware, removeFriend)


module.exports = router