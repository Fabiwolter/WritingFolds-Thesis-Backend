const express = require('express')
const router = express.Router()

const {read}  = require('../controllers/gameModeController')


router.get('/gamemode/:slug', read)


module.exports = router