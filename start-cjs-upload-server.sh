#!/bin/bash

# Kill any existing upload server processes
pkill -f "node.*upload-server" || true

# Start the enhanced upload server with authentication support
echo "Starting enhanced upload server with authentication support..."
node server/enhanced-cjs-server.cjs &

# Check if server started correctly
sleep 2
if pgrep -f "node.*upload-server" > /dev/null; then
  echo "✅ Enhanced upload server started successfully"
  echo "You can now test file uploads at: http://<your-domain>/upload-test"
  echo "Server diagnostics available at: /api/diagnostics"
  echo ""
  echo "This server includes:"
  echo "- Authentication support"
  echo "- Increased file size limits (400MB for audio, 5MB for images)"
  echo "- Album creation with multiple tracks"
  echo "- Integration with the application database"
else
  echo "❌ Enhanced upload server failed to start"
fi