import http.server
import socketserver
import os
import socket

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

port = get_free_port()
try:
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"=== RGV Garden Map is live at http://localhost:{port} ===", flush=True)
        httpd.serve_forever()
except Exception as e:
    print(f"Error starting server: {e}", flush=True)
