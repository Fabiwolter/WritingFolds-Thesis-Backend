const express = require('express')
const router = express.Router()

const { contactForm, contactUserForm }  = require('../controllers/formController')
const { runValidation } = require('../validators/indexValidator')
const { contactFormValidator } = require('../validators/formValidator')


router.post('/contact', contactFormValidator, runValidation, contactForm)
router.post('/contact-user', contactFormValidator, runValidation, contactUserForm)

module.exports = router