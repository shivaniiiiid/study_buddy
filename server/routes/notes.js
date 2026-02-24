const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const upload = require('../middleware/fileUpload');

// GET /courses/:courseId/notes
router.get('/courses/:courseId/notes', noteController.getNotesByCourse);

// POST /courses/:courseId/notes (with PDF upload support)
router.post('/courses/:courseId/notes', upload.single('pdf'), noteController.createNote);

// GET /notes/:id
router.get('/notes/:id', noteController.getNoteById);

// PUT /notes/:id
router.put('/notes/:id', noteController.updateNote);

// DELETE /notes/:id
router.delete('/notes/:id', noteController.deleteNote);

// POST /notes/:id/summarize
router.post('/notes/:id/summarize', noteController.summarizeNote);

// GET /pdf/:filename - Serve PDF files
router.get('/pdf/:filename', noteController.servePDF);

module.exports = router;
