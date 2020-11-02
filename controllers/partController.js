const Part = require('../models/part')
const slugify = require('slugify')
const _ = require('lodash')
const formidable = require('formidable')
const {errorHandler} = require('../helpers/dbErrorHandler')

exports.create = (req, res) => {
	let form = new formidable.IncomingForm()

	form.parse(req, (err, fields) => {
		if(err) {
			return res.status(400).json({
				error: err
			})
		}

		const {body} = fields

		if(!body || !body.length) {
			return res.status(400).json({
				error: 'Body is required'
			})
		}

		let part      = new Part()
		part.body     = body
		part.slug     = slugify(body.substring(0, 32)).toLowerCase()
		part.postedBy = req.user._id

		part.save((err, data) => {
			if(err) {
				return res.status(400).json({
					error: errorHandler(err)
				})
			}
			res.json(data)
		})
	})
}

exports.list = (req, res) => {
	Part.find({}).exec((err, data) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		res.json(data)
	})
}

exports.remove = (req, res) => {
	const slug = req.params.slug.toLowerCase()

	Part.findOneAndRemove({slug}).exec((err, part) => {
		if (err) {
			return res.status(400).json({
				error: errorHandler(err)
			})
		}
		res.json({
			message: 'Part removed successfully'
		})
	})
}