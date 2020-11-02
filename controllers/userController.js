const User           = require('../models/user')
const Story          = require('../models/story')
const _ 			 = require('lodash')
const formidable	 = require('formidable')
const {errorHandler} = require('../helpers/dbErrorHandler')
const fs			 = require('fs')

exports.read = (req, res) => {
	req.profile.hashedpassword = undefined
	return res.json(req.profile)
}

exports.publicProfile = (req, res) => {
	let username = req.params.username
	let user
	let stories

	User.findOne({username})
		.populate('friends', '_id name username profile')
		.exec((err, userFromDB) => {
		if (err || !userFromDB) {
			return res.status(400).json({
				error: 'User not found!'
			})
		}
		user = userFromDB
		let userId = user._id
		Story.find({postedBy: userId})
			.where('view_privacy').equals(1)
			.populate('tags', '_id name slug')
			.populate('postedBy', '_id name username profile')
			.sort({createdAt: -1})
			.select('_id title slug excerpt tags postedBy createdAt updatedAt game_mode is_finished view_privacy collab_privacy')
			.exec((err, data) => {
				if (err) {
					return res.json({
						error: errorHandler(err)
					})
				}
				user.hashed_password = undefined
				res.json({
					user,
					stories: data
				})
			})
	})
}

exports.update = (req, res) => {
	let form = new formidable.IncomingForm()
	form.keepExtensions = true
	form.parse(req, (err, fields, files) => {
		if (err) {
			return res.status(400).json({
				error: 'error while updating user'
			})
		}
		let user = req.profile
		let oldRole = user.role;
		let oldEmail = user.email;

		user = _.extend(user, fields)
		user.role = oldRole;
		user.email = oldEmail;

		if (fields.password && fields.password.length < 6) {
			return res.status(400).json({
				error: 'Password should be at least 6 characters long'
			})
		}

		if (files.photo) {
			if (files.photo.size > 2000000) {
				return res.status(400).json({
					error: 'Image size should be less than 2 MB'
				})
			}
			user.photo.data = fs.readFileSync(files.photo.path)
			user.photo.contentType = files.photo.type
		}

		user.save((err, result) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err)
				})
			}
			user.hashed_password = undefined
			user.salt = undefined
			user.photo = undefined
			res.json(user)
		})
	})
}

exports.photo = (req, res) => {
	const username = req.params.username
	User.findOne({username}).exec((err, user) => {
		if (err || !user) {
			return res.status(400).json({
				error: 'User not found'
			})
		}
		if (user.photo.data) {
			res.set('Content-Type', user.photo.contentType)
			return res.send(user.photo.data)
		} else {
			return res.status(400).json({
				error: 'User has no Image Data'
			})
		}
	})
}

exports.addFriend = (req, res) => {
	const {friendUsername} = req.body
	const {username} = req.profile

	User.findOne({username: friendUsername}).exec((err, friendFromDB) => {
		if (err || !friendFromDB) {
			return res.status(400).json({
				error: 'UserId to be added as Friend not found!'
			})
		}
		let friendId = friendFromDB._id
		User.findOneAndUpdate({username},
			{$addToSet: {
					friends: friendId
				}},
			{new: true, useFindAndModify: false})
			.populate('friends', '_id name username profile')
			.exec((err, result) => {
				if (err) {
					return res.status(400).json({
						error: 'User to Update not found'
					})
				} else {
					result.hashed_password = undefined
					result.salt = undefined
					res.json(result)
				}
			})
	})
}

exports.removeFriend = (req, res) => {
	const {friendUsername} = req.body
	const {username} = req.profile

	User.findOne({username: friendUsername}).exec((err, friendFromDB) => {
		if (err || !friendFromDB) {
			return res.status(400).json({
				error: 'UserId to be added as Friend not found!'
			})
		}
		let friendId = friendFromDB._id
		User.findOneAndUpdate({username},
			{
				$pull: {
					friends: friendId
				}
			},
			{new: true, useFindAndModify: false})
			.populate('friends', '_id name username profile')
			.exec((err, result) => {
				if (err) {
					return res.status(400).json({
						error: 'User to Update not found'
					})
				} else {
					result.hashed_password = undefined
					result.salt = undefined
					res.json(result)
				}
			})
	})
}
