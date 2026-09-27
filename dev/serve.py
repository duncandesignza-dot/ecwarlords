#!/usr/bin/env python3
"""Local preview server that behaves like GitHub Pages.

- Extensionless URLs resolve to .html (href="gallery" -> gallery.html),
  which is how every internal link on the site is written.
- Missing paths return 404.html with a 404 status, like GitHub Pages.

Usage (from the repo root):  python3 dev/serve.py [port]    # default 8765
Then open http://127.0.0.1:8765/
"""
import http.server, io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p) and os.path.exists(p + '.html'):
            return p + '.html'
        return p

    def send_head(self):
        p = self.translate_path(self.path)
        if not os.path.exists(p):
            body = open(os.path.join(ROOT, '404.html'), 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            return io.BytesIO(body)
        return super().send_head()

    def log_message(self, *a):
        pass


print(f'Serving {ROOT} at http://127.0.0.1:{PORT}/')
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
