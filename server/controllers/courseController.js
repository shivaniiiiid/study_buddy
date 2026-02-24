const { db } = require('../models/database');

const courseController = {
  // GET /courses
  getAllCourses: async (req, res) => {
    try {
      const sql = 'SELECT * FROM courses ORDER BY created_at DESC';
      db.all(sql, [], (err, rows) => {
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

  // POST /courses
  createCourse: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'Course name is required'
        });
      }

      const sql = 'INSERT INTO courses (name, description) VALUES (?, ?)';
      db.run(sql, [name, description], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            data: null,
            error: err.message
          });
        }
        
        // Get the created course
        db.get('SELECT * FROM courses WHERE id = ?', [this.lastID], (err, row) => {
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
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message
      });
    }
  },

  // GET /courses/:id
  getCourseById: async (req, res) => {
    try {
      const { id } = req.params;
      const sql = 'SELECT * FROM courses WHERE id = ?';
      
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
            error: 'Course not found'
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

  // PUT /courses/:id
  updateCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'Course name is required'
        });
      }

      const sql = 'UPDATE courses SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.run(sql, [name, description, id], function(err) {
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
            error: 'Course not found'
          });
        }
        
        // Get updated course
        db.get('SELECT * FROM courses WHERE id = ?', [id], (err, row) => {
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

  // DELETE /courses/:id
  deleteCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const sql = 'DELETE FROM courses WHERE id = ?';
      
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
            error: 'Course not found'
          });
        }
        
        res.json({
          success: true,
          data: { message: 'Course deleted successfully' },
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
  }
};

module.exports = courseController;
