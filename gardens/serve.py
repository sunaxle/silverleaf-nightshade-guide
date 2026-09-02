import http.server
import socketserver
import os

PORT = 5050
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

try:
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Serving RGV Garden Map at http://localhost:{PORT}")
        httpd.serve_forever()
except Exception as e:
    print(f"Error starting server on {PORT}: {e}")
