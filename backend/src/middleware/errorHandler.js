const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Unable to connect to external services'
    });
  }

  if (err.response && err.response.status === 429) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'API rate limit exceeded, please try again later'
    });
  }

  if (err.response && err.response.status >= 400 && err.response.status < 500) {
    return res.status(err.response.status).json({
      error: 'Client error',
      message: err.response.data?.error || 'Bad request'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;