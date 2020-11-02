const express = require('express')
const {signup, signin, signout, requireSignin, forgotPassword, resetPassword}  = require('../controllers/authController')
const router  = express.Router()

const {runValidation} = require('../validators/indexValidator')
const {userSignupValidator, userSigninValidator, forgotPasswordValidator, resetPasswordValidator} = require('../validators/authValidator')

router.post('/signup', userSignupValidator, runValidation, signup)
router.post('/signin', userSigninValidator, runValidation, signin)
router.get('/signout', signout)
router.put('/forgot-password', forgotPasswordValidator, runValidation, forgotPassword)
router.put('/reset-password', resetPasswordValidator, runValidation, resetPassword)

router.get('/secret', requireSignin, (req, res) => {
	res.json({
		message: 'secret access'
	})
})

module.exports = router