const Tag = require('../models/tag')
const Story = require('../models/story')
const slugify = require('slugify')
const {errorHandler} = require('../helpers/dbErrorHandler')

exports.create = (req, res) => {
	const {name} = req.body
	let slug = slugify(name).toLowerCase()

	let tag = new Tag({name, slug})

	tag.save((err, data) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		res.json(data)
	})
}

exports.list = (req, res) => {
	Tag.find({}).exec((err, data) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		res.json(data)
	})
}

exports.read = (req, res) => {
	const slug = req.params.slug.toLowerCase()

	Tag.findOne({slug}).exec((err, tag) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		Story.find({tags: tag})
		.where('view_privacy').equals(1)
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username profile')
		.select('_id title slug excerpt postedBy tags createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err)
				})
			}
			res.json({tag: tag, stories: data})
		})
	})
}

exports.remove = (req, res) => {
	const slug = req.params.slug.toLowerCase()

	Tag.findOneAndRemove({slug}).exec((err, tag) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		res.json({
			message: 'Tag removed successfully'
		})
	})
}