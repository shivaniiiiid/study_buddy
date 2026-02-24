const { db } = require('../models/database');
const aiService = require('../services/aiService');
const fs = require('fs');
const path = require('path');

const noteController = {
  // GET /courses/:courseId/notes
  getNotesByCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const sql = 'SELECT * FROM notes WHERE course_id = ? ORDER BY created_at DESC';
      
      db.all(sql, [courseId], (err, rows) => {
        if (err) {
          return res.status(500).json({
            success: false,
            data: null,
            error: err.message
          });
        }
        res.json({
          success: true,
          data: rows,
          error: null
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message
      });
    }
  },

  // POST /courses/:courseId/notes
  createNote: async (req, res) => {
    try {
      const { courseId } = req.params;
      let title, body;
      
      // Extract data from FormData (multer converts form data to this format)
      if (req.body) {
        title = req.body.title;
        body = req.body.body || '';
      }
      
      if (!title) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'Note title is required'
        });
      }
      
      let pdfPath = null;
      
      // Handle file upload if present
      if (req.file) {
        // Validate file type
        if (req.file.mimetype !== 'application/pdf') {
          return res.status(400).json({
            success: false,
            data: null,
            error: 'Only PDF files are allowed'
          });
        }
        pdfPath = req.file.filename;
      }
      
      // Verify course exists
      db.get('SELECT id FROM courses WHERE id = ?', [courseId], (err, course) => {
        if (err) {
          return res.status(500).json({
            success: false,
            data: null,
            error: err.message
          });
        }
        
        if (!course) {
          return res.status(404).json({
            success: false,
            data: null,
            error: 'Course not found'
          });
        }

        const sql = 'INSERT INTO notes (course_id, title, body, pdf_path) VALUES (?, ?, ?, ?)';
        db.run(sql, [courseId, title, body, pdfPath], function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              data: null,
              error: err.message
            });
          }
          
          // Get the created note
          db.get('SELECT * FROM notes WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              return res.status(500).json({
                success: false,
                data: null,
                error: err.message
              });
            }
            res.status(201).json({
              success: true,
              data: row,
              error: null
            });
          });
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message
      });
    }
  },

  // GET /notes/:id
  getNoteById: async (req, res) => {
    try {
      const { id } = req.params;
      const sql = 'SELECT * FROM notes WHERE id = ?';
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          return res.status(500).json({
            success: false,
            data: null,
            error: err.message
          });
        }
        
        if (!row) {
          return res.status(404).json({
            success: false,
            data: null,
            error: 'Note not found'
          });
        }
        
        res.json({
          success: true,
          data: row,
          error: null
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message
      });
    }
  },

  // PUT /notes/:id
  updateNote: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, body } = req.body;
      
      if (!title) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'Note title is required'
        });
      }

      const sql = 'UPDATE notes SET title = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.run(sql, [title, body, id], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            data: null,
            error: err.message
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            data: null,
            error: 'Note not found'
          });
        }
        
        // Get updated note
        db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
          if (err) {
            return res.status(500).json({
              success: false,
              data: null,
              error: err.message
            });
          }
          res.json({
            success: true,
            data: row,
            error: null
          });
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message
      });
    }
  },

  // DELETE /notes/:id
  deleteNote: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get note info to delete associated PDF file
      db.get('SELECT pdf_path FROM notes WHERE id = ?', [id], (err, note) => {
        if (err) {
          return res.status(500).json({
            success: false,
            data: null,
            error: err.message
          });
        }
        
        // Delete the note from database
        const sql = 'DELETE FROM notes WHERE id = ?';
        db.run(sql, [id], function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              data: null,
              error: err.message
            });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              data: null,
              error: 'Note not found'
            });
          }
          
          // Delete PDF file if it exists
          if (note && note.pdf_path) {
            const filePath = path.join(__dirname, '..', 'uploads', note.pdf_path);
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Error deleting PDF file:', unlinkErr);
              }
            });
          }
          
          res.json({
            success: true,
            data: { message: 'Note deleted successfully' },
            error: null
          });
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message
      });
    }
  },

  // POST /notes/:id/summarize
  summarizeNote: async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      
      // Get the note
      db.get('SELECT * FROM notes WHERE id = ?', [id], async (err, note) => {
        if (err) {
          console.error('Database error getting note:', err);
          return res.status(500).json({
            success: false,
            data: null,
            error: err.message
          });
        }
        
        if (!note) {
          return res.status(404).json({
            success: false,
            data: null,
            error: 'Note not found'
          });
        }
        
        if (!note.body || note.body.trim() === '') {
          return res.status(400).json({
            success: false,
            data: null,
            error: 'Note body is empty'
          });
        }
        
        try {
          console.log('Calling AI service for note ID:', id);
          console.log('AI Provider:', process.env.AI_PROVIDER || 'openai');
          
          // Use AI service to generate summary
          const summary = await aiService.summarize(note.body);
          
          console.log('Generated summary:', summary);
          
          // Update note with summary
          db.run(
            'UPDATE notes SET summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [summary, id],
            function(err) {
              if (err) {
                console.error('Database error updating summary:', err);
                return res.status(500).json({
                  success: false,
                  data: null,
                  error: err.message
                });
              }
              
              // Get updated note
              db.get('SELECT * FROM notes WHERE id = ?', [id], (err, updatedNote) => {
                if (err) {
                  console.error('Database error getting updated note:', err);
                  return res.status(500).json({
                    success: false,
                    data: null,
                    error: err.message
                  });
                }
                
                const latency = Date.now() - startTime;
                console.log('Summary generated successfully in', latency, 'ms');
                
                res.json({
                  success: true,
                  data: { note: updatedNote },
                  latency_ms: latency,
                  error: null
                });
              });
            }
          );
        } catch (apiError) {
          console.error('AI Service Error:', apiError.message);
          
          let errorMessage = 'Failed to generate summary';
          
          if (apiError.message.includes('OpenAI')) {
            errorMessage = 'OpenAI API error. You may want to try a different AI provider.';
          } else if (apiError.message.includes('Hugging Face')) {
            errorMessage = 'Hugging Face API error. Check your API key.';
          } else if (apiError.message.includes('Gemini')) {
            errorMessage = 'Gemini API error. Check your API key.';
          } else if (apiError.message.includes('Ollama')) {
            errorMessage = 'Ollama error. Make sure Ollama is running locally.';
          } else {
            errorMessage = `AI Service Error: ${apiError.message}`;
          }
          
          res.status(500).json({
            success: false,
            data: null,
            error: errorMessage
          });
        }
      });
    } catch (error) {
      console.error('Server error in summarizeNote:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: error.message
      });
    }
  },

  // GET /pdf/:filename
  servePDF: (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({
          success: false,
          data: null,
          error: 'PDF file not found'
        });
      }
      
      // Serve the PDF file
      res.sendFile(filePath, (err) => {
        if (err) {
          res.status(500).json({
            success: false,
            data: null,
            error: 'Error serving PDF file'
          });
        }
      });
    });
  }
};

module.exports = {
  getNotesByCourse: noteController.getNotesByCourse,
  getNoteById: noteController.getNoteById,
  createNote: noteController.createNote,
  updateNote: noteController.updateNote,
  deleteNote: noteController.deleteNote,
  summarizeNote: noteController.summarizeNote,
  servePDF: noteController.servePDF
};
