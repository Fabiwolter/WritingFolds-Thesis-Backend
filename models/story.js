const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema

const storySchema = new mongoose.Schema({
	title: {
		type: String,
		trim: true,
		min: 3,
		max: 160,
		required: true
	},
	slug: {
		type: String,
		unique: true,
		index: true
	},
	body: {
		type: {},
		min: 20,
		max: 2000000,
	},
	excerpt: {
		type: String,
		max: 1000
	},
	game_mode:{				// 1 = Folded Story   0 = StoryWriting   2 = Writing Prompts
		type: Number,
		default: 0
	},
	is_finished: {
		type: Boolean,
		default: false
	},
	view_privacy: {			// who can view Story?  public=1 or private=0
		type: Number,
		default: 0
	},
	collab_privacy: {		// who can collab?  Everyone=1 Friends=0
		type: Number,
		default: 1
	},
	photo: {
		data: Buffer,
		contentType: String
	},
	tags: [{type: ObjectId, ref: 'Tag'}],
	postedBy: {
		type: ObjectId,
		ref: 'User'
	},
	parts: [{type: ObjectId, ref: 'Part'}],
	collaborators: [{type: ObjectId, ref: 'User'}],
	subscribers: [{type: ObjectId, ref: 'User'}]
}, {timestamps: true})




module.exports = mongoose.model('Story', storySchema)