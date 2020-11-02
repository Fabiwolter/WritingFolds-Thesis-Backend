const express = require('express')
const router = express.Router()

const {requireSignin, authMiddleware}   = require('../controllers/authController')
const {create, list, read, remove}  = require('../controllers/tagController')

const {runValidation} = require('../validators/indexValidator')
const {tagCreateValidator} = require('../validators/tagValidator')


router.post('/tag', tagCreateValidator, runValidation, requireSignin, authMiddleware, create)
router.get('/tags', list)
router.get('/tag/:slug', read)
router.delete('/tag/:slug', requireSignin, authMiddleware, remove)


module.exports = router