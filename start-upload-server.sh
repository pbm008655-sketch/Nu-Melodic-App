#!/bin/bash

# Kill any existing simple server process
pkill -f "node.*simple-server" || true

# Start the simple server with enhanced upload capabilities
echo "Starting enhanced upload server..."
npx tsx server/simple-server.js &

# Check if server started correctly
sleep 2
if pgrep -f "node.*simple-server" > /dev/null; then
  echo "✅ Upload server started successfully"
  echo "You can now test file uploads at: http://<your-domain>/upload-test"
  echo "Server diagnostics available at: /api/diagnostics"
else
  echo "❌ Upload server failed to start"
fi