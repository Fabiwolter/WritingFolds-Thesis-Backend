const mongoose = require('mongoose')
const crypto = require('crypto')
const {ObjectId} = mongoose.Schema

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		trim: true,
		required: true,
		max: 32,
		unique: true,
		index: true,
		lowercase: true
	},
	name: {
		type: String,
		trim: true,
		required: true,
		maxLength: 32
	},
	email: {
		type: String,
		trim: true,
		required: true,
		unique: true,
		lowercase: true
	},
	profile: {
		type: String,
		required: true,
	},
	hashed_password: {
		type: String,
		required: true,
	},
	salt: {
		type: String
	},
	about: {
		type: String
	},
	role: {
		type: Number,
		default: 0
	},
	photo: {
		data: Buffer,
		contentType: String
	},
	resetPasswordLink: {
		data: String,
		default: ''
	},
	friends: [{type: ObjectId, ref: 'User'}]
}, {timestamps: true})


userSchema.virtual('password')
	.set(function(password) {
		this._password = password
		this.salt = this.makeSalt()
		this.hashed_password = this.encryptPassword(password)
	})
	.get(function() {
		return this._password
	})


userSchema.methods = {
	authenticate: function(plainPassword) {
		return this.encryptPassword(plainPassword) === this.hashed_password
	},

	encryptPassword: function(password) {
		if (!password) return ''
		try {
			return crypto.createHmac('sha1', this.salt)
			.update(password)
			.digest('hex')
		} catch(e) {
			return ''
		}
	},

	makeSalt: function() {
		return Math.round(new Date().valueOf() * Math.random()) + ''
	}
}


module.exports = mongoose.model('User', userSchema)