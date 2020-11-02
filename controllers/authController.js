const User           = require('../models/user')
const Story          = require('../models/story')
const shortId        = require('shortid')
const jwt            = require('jsonwebtoken')
const expressJwt     = require('express-jwt')
const {errorHandler} = require('../helpers/dbErrorHandler')
const _ 			 = require('lodash')
// sendgrid
const sendGridMail = require('@sendgrid/mail')
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY)


exports.signup = (req, res) => {
	User.findOne({email: req.body.email}).exec((err, user) => {
		if (user) {
			return res.status(400).json({
				error: 'Email is taken'
			})
		}

		const {name, email, password} = req.body
		let username = shortId.generate()
		let profile = `${process.env.CLIENT_URL}/profile/${username}`

		let newUser = new User({name, email, password, profile, username})
		newUser.save((err, success) => {
			if (err) {
				return res.status(400).json({
					error: err
				})
			}
			res.json({
				message: 'Signup success! Signin now!'
			})
		})
	})
}

exports.signin = (req, res) => {
	const {email, password} = req.body
	User.findOne({email}).exec((err, user) => {
		if (err || !user) {
			return res.status(400).json({
				error: "User with that email does not exist!"
			})
		}
		if (!user.authenticate(password)) {
			return res.status(400).json({
				error: "Email and password do not match"
			})
		}
		const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '3d'})
		res.cookie('token', token, {expiresIn: '3d'})
		const {_id, username, name, email, role} = user

		return res.json({
			token,
			user: {_id, username, name, email, role}
		})
	})
}

exports.signout = (req, res) => {
	res.clearCookie("token")
	res.json({
		message: 'Signout success!'
	})
}

exports.requireSignin = expressJwt({
	secret: process.env.JWT_SECRET
})



exports.authMiddleware = (req, res, next) => {
	const authUserId = req.user._id
	User.findById({_id: authUserId})
		.populate('friends', '_id name username profile')
		.exec((err, user) => {
		if(err || !user) {
			return res.status(400).json({
				error: 'User not found'
			})
		}
		req.profile = user
		next()
	})
}

exports.adminMiddleware = (req, res, next) => {
	const adminUserId = req.user._id
	User.findById({_id: adminUserId}).exec((err, user) => {
		if(err || !user) {
			return res.status(400).json({
				error: 'User not found'
			})
		}
		if(user.role !== 1) {
			return res.status(400).json({
				error: 'Admin resource. Access denied'
			})
		}
		req.profile = user
		next()
	})
}

exports.canUpdateDeleteStory = (req, res, next) => {
	const slug = req.params.slug.toLowerCase()
	Story.findOne({slug}).exec((err, data) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString()
		if (!authorizedUser) {
			return res.status(400).json({
				error: 'You are not authorized to update or delete this Story!'
			})
		}
		next()
	})
}

exports.forgotPassword = (req, res) => {
	const {email} = req.body

	User.findOne({email}, (err, user) => {
		if (err || !user) {
			return res.status(401).json({
				error: 'User with this email does not exist!'
			})
		}

		const token = jwt.sign({_id: user._id}, process.env.JWT_RESET_PASSWORD_SECRET, {expiresIn: '10m'})

		const emailData = {
			to: email,
			from: process.env.EMAIL_TO,
			subject: `Password reset link from ${process.env.APP_NAME}`,
			html: `
			<p>Use this link to reset your password:</p>
			<p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
			<hr />
			<p>This email may contain sensitive information</p>
			<p>https://writingfolds.com</p>
		`
		}
		return user.updateOne({resetPasswordLink: token}, (err, success) => {
			if (err) {
				return res.json({
					error: errorHandler(err)
				})
			} else {
				sendGridMail.send(emailData).then(sent => {
					return res.json({
						message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10 minutes.`
					})
				}).catch((error) => {
					console.log(error.response.body)
				})
			}
		})
	})
}

exports.resetPassword = (req, res) => {
	const { resetPasswordLink, newPassword } = req.body

	if (resetPasswordLink) {
		jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD_SECRET, function(err, decoded) {
			if (err) {
				return res.status(401).json({
					error: 'Link expired. Sry.'
				})
			}
			User.findOne({resetPasswordLink}, (err, user) => {
				if (err || !user) {
					return res.status(401).json({
						error: 'Something went wrong while finding User based on reset-password-link.'
					})
				}
				const updatedFields = {
					password: newPassword,
					resetPasswordLink: ''
				}

				user = _.extend(user, updatedFields)

				user.save((err, result) => {
					if (err) {
						return res.status(400).json({
							error: errorHandler(err)
						})
					}
					res.json({
						message: 'You can now login with your new password!'
					})
				})
			})
		})
	}
}

