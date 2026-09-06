#!/usr/bin/env python3
"""Serve the prebuilt app locally without npm or external network access."""
import argparse
import functools
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import threading
import webbrowser

parser = argparse.ArgumentParser(description="Start Waterdrop Lab locally")
parser.add_argument("--port", type=int, default=5174)
parser.add_argument("--no-open", action="store_true")
args = parser.parse_args()
root = Path(__file__).resolve().parent / "dist"
if not (root / "index.html").is_file():
    raise SystemExit("Missing dist/. Run npm ci && npm run build first.")
for key in ("NO_PROXY", "no_proxy"):
    entries = set(filter(None, os.environ.get(key, "").split(",")))
    os.environ[key] = ",".join(sorted(entries | {"127.0.0.1", "localhost", "::1"}))
handler = functools.partial(SimpleHTTPRequestHandler, directory=str(root))
ports = [0] if args.port == 0 else range(args.port, min(args.port + 20, 65536))
for port in ports:
    try:
        server = ThreadingHTTPServer(("127.0.0.1", port), handler)
        break
    except OSError:
        continue
else:
    raise SystemExit("No available local port; use --port to select another.")
url = f"http://127.0.0.1:{server.server_port}/"
print(f"\nWaterdrop Lab: {url}\nPress Ctrl+C to stop.\n", flush=True)
if not args.no_open:
    threading.Timer(.25, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
