const express = require('express');

const app = express();

// Simple health check route
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Ultra minimal server test - no MongoDB'
  });
});

const PORT = 5002; // Use different port to avoid conflicts
const HOST = '127.0.0.1'; // Use localhost instead of 0.0.0.0

console.log(`Starting ultra minimal server on ${HOST}:${PORT}...`);

const server = app.listen(PORT, HOST, () => {
  console.log(`Ultra minimal server running on ${HOST}:${PORT}`);
  console.log('Server listening on:', server.address());
});

server.on('error', (err) => {
  console.error('Server error:', err);
});