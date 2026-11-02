"""Static file server for previewing the demo, with caching turned off."""
import functools
import http.server
import sys

root = sys.argv[1]
port = int(sys.argv[2])


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


handler = functools.partial(NoCache, directory=root)
http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
