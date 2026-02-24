const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'File size too large. Maximum size is 10MB.'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Too many files uploaded.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Unexpected file field.'
    });
  }
  
  // Handle file type errors
  if (err.message && err.message.includes('Only PDF files are allowed')) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Only PDF files are allowed.'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    data: null,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
