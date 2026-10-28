const express = require('express');
const controller = require('../controllers/movieController');
const router = express.Router();

// Keep these named routes before /:id so Express does not treat them as movie IDs.
router.get('/watch-next', controller.watchNext);
router.get('/stats', controller.getStats);
router.get('/', controller.getMovies);
router.post('/', controller.createMovie);
router.get('/:id', controller.getMovie);
router.put('/:id', controller.updateMovie);
router.patch('/:id/status', controller.changeStatus);
router.patch('/:id/rating', controller.updateRating);
router.delete('/:id', controller.deleteMovie);
module.exports = router;
