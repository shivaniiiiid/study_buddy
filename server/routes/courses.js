const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// GET /courses
router.get('/', courseController.getAllCourses);

// POST /courses
router.post('/', courseController.createCourse);

// GET /courses/:id
router.get('/:id', courseController.getCourseById);

// PUT /courses/:id
router.put('/:id', courseController.updateCourse);

// DELETE /courses/:id
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
