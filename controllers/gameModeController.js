const Story = require('../models/story')
const {errorHandler} = require('../helpers/dbErrorHandler')


exports.read = (req, res) => {
	const slug = req.params.slug

	Story.find({game_mode: slug})
		.where('view_privacy').equals(1)
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username profile')
		.sort({createdAt: -1})
		.select('_id title slug excerpt game_mode is_finished view_privacy collab_privacy postedBy tags createdAt updatedAt')
		.exec((err, data) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err)
				})
			}
			res.json({stories: data})
	})

}

