console.log('Simple test running...');

// Start a basic HTTP server
import http from 'http';
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello, world!\n');
});

server.listen(5002, '0.0.0.0', () => {
  console.log('Server running on port 5002');
});