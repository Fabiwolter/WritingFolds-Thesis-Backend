const express = require('express')
const {
    create,
    list,
    listAllStoriesWithTags,
    read,
    remove,
    update,
    listRelated,
    listSearch,
    updateStoryParts,
    listByUser,
    listStoriesForUserFeed,
    updatePartAndStoryCollaborator
}  = require('../controllers/storyController')
const router  = express.Router()
const {
    requireSignin,
    authMiddleware,
    adminMiddleware,
    canUpdateDeleteStory
} = require('../controllers/authController')

router.post('/story', requireSignin, authMiddleware, create)
router.delete('/user/story/:slug', requireSignin, authMiddleware, canUpdateDeleteStory, remove)
router.put('/user/story/:slug', requireSignin, authMiddleware, canUpdateDeleteStory, update)
router.put('/story-part/:slug', requireSignin, authMiddleware, updatePartAndStoryCollaborator)
router.get('/:username/stories', requireSignin, authMiddleware, listByUser)

router.post('/stories-with-tags', listAllStoriesWithTags)
router.get('/story/:slug', read)
router.post('/stories/related', listRelated)
router.get('/stories/search', listSearch)

router.post('/stories-for-feed/:username', requireSignin, authMiddleware, listStoriesForUserFeed)

router.post('/admin/story', requireSignin, adminMiddleware, create)
router.delete('/admin/story/:slug', requireSignin, adminMiddleware, remove)
router.put('/admin/story/:slug', requireSignin, adminMiddleware, update)
router.get('/stories', requireSignin, adminMiddleware, list)

module.exports = router