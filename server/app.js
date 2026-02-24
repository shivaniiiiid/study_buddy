require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./models/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const courseRoutes = require('./routes/courses');
const noteRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/courses', courseRoutes);
app.use('/', noteRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { message: 'StudyBuddy API is running' },
    error: null
  });
});

// Test AI API endpoint
app.get('/test-api', async (req, res) => {
  try {
    console.log('Testing AI Service...');
    console.log('AI Provider:', process.env.AI_PROVIDER || 'openai');
    
    const aiService = require('./services/aiService');
    const result = await aiService.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        data: { 
          message: 'AI service test successful',
          provider: result.provider,
          response: result.result
        },
        error: null
      });
    } else {
      res.status(500).json({
        success: false,
        data: null,
        error: `AI service test failed: ${result.error}`
      });
    }
  } catch (error) {
    console.error('AI service test failed:', error.message);
    res.status(500).json({
      success: false,
      data: null,
      error: `AI service test failed: ${error.message}`
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`StudyBuddy server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
