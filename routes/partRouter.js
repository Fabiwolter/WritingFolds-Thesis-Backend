const express = require('express')
const router = express.Router()

const {requireSignin, authMiddleware, adminMiddleware}   = require('../controllers/authController')
const {create, list, remove}  = require('../controllers/partController')

const {runValidation} = require('../validators/indexValidator')


router.post('/part', runValidation, requireSignin, authMiddleware, create)
router.delete('/part/:slug', requireSignin, adminMiddleware, remove)
router.get('/parts', list)


module.exports = router