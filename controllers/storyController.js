const Story = require('../models/story')
const Tag = require('../models/tag')
const Part = require('../models/part')
const User = require('../models/user')
const formidable = require('formidable')
const slugify = require('slugify')
const _ = require('lodash')
const {errorHandler} = require('../helpers/dbErrorHandler')
const stripHtml = require('string-strip-html')
const fs = require('fs')
const {smartTrim} = require('../helpers/excerptHelper')

exports.create = (req, res) => {
	let form = new formidable.IncomingForm()

	form.parse(req, (err, fields) => {
		if(err) {
			return res.status(400).json({
				error: 'Form could not be parsed'
			})
		}

		const {title, body, parts, game_mode, view_privacy, collab_privacy, tags, collaborators} = fields

		if(!title || !title.length) {
			return res.status(400).json({
				error: 'Title is required'
			})
		}
		if(!body || !body.length) {
			return res.status(400).json({
				error: 'Prompt is required'
			})
		}
		if (!tags || tags.length === 0) {
			return res.status(400).json({
				error: 'at least 1 tag is required'
			})
		}

		let story                = new Story()
		story.title              = title
		story.body               = body
		story.parts				 = parts
		story.game_mode 	     = game_mode
		story.view_privacy 	     = view_privacy
		story.collab_privacy     = collab_privacy
		story.excerpt            = smartTrim(body, 250, ' ', ' ...')
		story.slug               = slugify(title).toLowerCase()
		story.meta_title         = `${title} | ${process.env.APP_NAME}`
		story.meta_description   = body.substring(0, 160)
		story.postedBy           = req.user._id
		let arrayOfTags          = tags && tags.split(',')
		let arrayOfCollaborators = collaborators && collaborators.split(',')

		story.save((err, result) => {
			if (err) {
				return res.status(400).json({
					error: err

				})
			}

			if (arrayOfCollaborators) {
				Story.findByIdAndUpdate(result._id,
					{$push: {collaborators: arrayOfCollaborators}},
					{new: true})
					.exec((err, result) => {
						if (err) {
							return res.status(400).json({
								error: errorHandler(err)
							})
						} else {
							Story.findByIdAndUpdate(result._id,
								{$push: {tags: arrayOfTags}},
								{new: true})
								.exec((err, result) => {
									if (err) {
										return res.status(400).json({
											error: errorHandler(err)
										})
									} else {
										res.json(result)
									}
								})
						}
					})
			} else {
				Story.findByIdAndUpdate(result._id,
					{$push: {tags: arrayOfTags}},
					{new: true})
					.exec((err, result) => {
						if (err) {
							return res.status(400).json({
								error: errorHandler(err)
							})
						} else {
							res.json(result)
						}
					})
			}
		})
	})

}

exports.list = (req, res) => {
	Story.find({})
		.populate('tags', '_id name slug')
		.populate('parts')
		.populate('collaborators')
		.populate('subscribers')
		.populate('postedBy', '_id name username')
		.sort({createdAt: -1})
		.select('_id title slug excerpt body game_mode is_finished view_privacy collab_privacy tags postedBy createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.json({
					error: errorHandler(err)
				})
			}
			res.json(data)
		})
}

exports.listByUser = (req, res) => {
	User.findOne({username: req.params.username})
	.exec((err, user) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		let userId = user._id
		Story.find({postedBy: userId})
		.populate('tags', '_id name slug')
		.populate('parts')
		.populate('collaborators')
		.populate('subscribers')
		.populate('postedBy', '_id name username')
		.sort({createdAt: -1})
		.select('_id title slug excerpt body game_mode is_finished view_privacy collab_privacy tags postedBy createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err)
				})
			}
			res.json(data)
		})
	})


}

exports.listAllStoriesWithTags = (req, res) => {
	let limit = req.body.limit ? parseInt(req.body.limit) : 10
	let skip = req.body.skip ? parseInt(req.body.skip) : 0

	let stories
	let tags

	Story.find({})
	.where('view_privacy').equals(1)
	.populate('tags', '_id name slug')
	.populate('postedBy', '_id name username profile')
	.sort({createdAt: -1})
	.skip(skip)
	.limit(limit)
	.select('_id title slug excerpt body game_mode is_finished view_privacy collab_privacy tags postedBy createdAt updatedAt')
	.exec((err, data) => {
		if (err) {
			return res.json({
				error: errorHandler(err)
			})
		}
		stories = data

		Tag.find({}).exec((err, t) => {
			if (err) {
				return res.json({
					error: errorHandler(err)
				})
			}
			tags = t
			res.json({stories: stories, tags, size: stories.length})
		})
	})
}

exports.read = (req, res) => {
	let friends
	let story

	const slug = req.params.slug.toLowerCase()
	Story.findOne({slug})
	.populate('tags', '_id name slug')
	.populate({
		path: 'parts',
		populate: {
			path: 'postedBy',
			model: User,
			select: '_id name username profile'
		}
	})
	.populate('collaborators', '_id name username profile')
	.populate('subscribers', '_id name username profile')
	.populate('postedBy', '_id name username profile')
	.select('_id title slug body game_mode is_finished view_privacy collab_privacy tags parts meta_title meta_description postedBy createdAt updatedAt')
	.exec((err, data) => {
		if (err) {
			return res.json({
				error: errorHandler(err)
			})
		}
		story = data
		let username = data.postedBy.username

		if (data.collab_privacy === 0 ) {
			User.findOne({username: username})
				.populate('friends', '_id name username profile')
				.select('_id, username, friends')
				.exec((err, user) => {
					if (err) {
						return res.json({
							error: errorHandler(err)
						})
					}
					friends = user.friends

					res.json({
						story,
						friends
					})
			})
		} else{
			res.json({story})
		}
	})
}

exports.remove = (req, res) => {
	const slug = req.params.slug.toLowerCase()
	Story.findOneAndRemove({slug}).exec((err, data) => {
		if (err) {
			return res.json({
				error: errorHandler(err)
			})
		}
		res.json({
			message: 'Story deleted successfully!'
		})
	})
}

exports.update = (req, res) => {
	const slug = req.params.slug.toLowerCase()

	Story.findOne({slug}).exec((err, oldStory) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}

		let form = new formidable.IncomingForm()
		form.keepExtensions = true

		form.parse(req, (err, fields) => {
			if (err) {
				return res.status(400).json({
					error: 'Form could not be parsed'
				})
			}

			let slugBeforeMerge = oldStory.slug
			oldStory = _.merge(oldStory, fields)
			oldStory.slug = slugBeforeMerge

			const {title, body, is_finished, parts, tags, collaborators, subscribers, view_privacy, collab_privacy} = fields

			if (body) {
				oldStory.excerpt = smartTrim(body, 250, ' ', ' ...')
			}
			if (parts) {
				oldStory.parts = parts.split(',')
			}
			if (tags) {
				oldStory.tags = tags.split(',')
			}
			if (collaborators) {
				oldStory.collaborators = collaborators.split(',')
			}
			if (subscribers) {
				oldStory.subscribers = subscribers.split(',')
			}

			oldStory.save((err, result) => {
				if (err) {
					return res.status(400).json({
						error: errorHandler(err)
					})
				}

				res.json(result)
			})
		})
	})
}

exports.updateStoryParts = (req, res) => {
	const slug = req.params.slug.toLowerCase()
	const {part} = req.body
	const postedBy = req.user._id

	Story.findOne({slug})
	.populate('parts', '_id name body slug')
	.populate('collaborators')
	.exec((err, oldStory) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}

		let oldPartsArray = oldStory.parts
		oldPartsArray.push(part)

		let oldCollabArray = oldStory.collaborators
		oldStory.parts = oldPartsArray
		oldStory.collaborators = null


		oldStory.save((err, result) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err)
				})
			}
			res.json(result)
		})
	})
}

exports.updatePartAndStoryCollaborator = (req, res) => {
	const slug = req.params.slug.toLowerCase()
	const part = req.body.part
	const postedBy = req.user._id

	Story.findOneAndUpdate({slug},
		{$push: {
				parts: part
			},
			$addToSet: {
				collaborators: postedBy
			}},
		{new: true, useFindAndModify: false})
		.populate('collaborators', '_id name username profile')
		.exec((err, story) => {
			if (err) {
				return res.status(400).json({
					error: err
				})
			} else {
				res.json(story)
			}
		})

}

exports.listRelated = (req, res) => {
	let limit = req.body.limit ? parseInt(req.body.limit) : 3
	const {_id, tags} = req.body.story

	Story.find({_id: {$ne: _id}, tags: {$in: tags} })
		.where('view_privacy').equals(1)
		.populate('postedBy', '_id name username profile')
		.limit(limit)
		.select('_id title slug excerpt postedBy createdAt updatedAt')
		.exec((err, stories) => {
			if(err) {
				return res.json({
					error: 'Stories not found!'
				})
			}
			res.json(stories)
		})
}

exports.listSearch = (req, res) => {
	const {search} = req.query

	if (search) {
		Story.find({
			$or: [{title: {$regex: search, $options: 'i'} }, {body: {$regex: search, $options: 'i'} }]
		}, (err, stories) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err)
				})
			}
			res.json(stories)
		})
		.where('view_privacy').equals(1)
		.populate('postedBy', '_id name username profile')
		.select('-body')
	}
}

exports.listStoriesForUserFeed = (req, res) => {
	let limit = req.body.limit ? parseInt(req.body.limit) : 10
	let skip = req.body.skip ? parseInt(req.body.skip) : 0

	let stories

	let userId = req.profile._id.toString()

	Story.find({})
		.or([{ postedBy: userId}, {collaborators: {$in: userId}}])
		.populate('postedBy', '_id name username profile')
		.populate('tags', '_id name slug')
		.populate('parts')
		.sort({createdAt: -1})
		.skip(skip)
		.limit(limit)
		.select('_id title slug excerpt body game_mode is_finished view_privacy collab_privacy tags postedBy createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.json({
					error: errorHandler(err)
				})
			}
			stories = data
			res.json({stories: stories, size: stories.length})
		})
}



