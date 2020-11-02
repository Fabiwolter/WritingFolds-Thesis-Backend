const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema

const partSchema = new mongoose.Schema({
	body: {
		type: {},
		min: 20,
		max: 2000000,
	},
	slug: {
		type: String,
		unique: true,
		index: true
	},
	excerpt: {
		type: String,
		max: 1000
	},
	postedBy: {
		type: ObjectId,
		ref: 'User'
	}
}, {timestamps: true})




module.exports = mongoose.model('Part', partSchema)