#!/bin/bash
# Move to the directory where this script is located
cd "$(dirname "$0")"

echo "==================================================="
echo "🌿 Starting Silverleaf Nightshade Field Journal... "
echo "==================================================="
echo "Leave this window open while using the app."
echo "Press Control+C to stop the server."

# Wait 1 second and then open the browser
(sleep 1 && open "http://localhost:8000/index.html") &

# Start the python HTTP server
python3 -m http.server 8000
