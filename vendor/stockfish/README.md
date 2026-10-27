# Stockfish 19 Lite single-threaded WASM

Unmodified Stockfish.js release v19.0.1, running in an isolated Node child process.
The AUNORA page never downloads or executes this WASM on its rendering thread.

Upstream engine and complete corresponding source:
https://github.com/nmrugg/stockfish.js/tree/v19.0.1
Source archive: https://github.com/nmrugg/stockfish.js/archive/refs/tags/v19.0.1.tar.gz
Build instructions: upstream README and build.js; lite single-threaded flavor.
Engine authors: https://github.com/nmrugg/stockfish.js/blob/v19.0.1/AUTHORS
License: GPL-3.0, see COPYING.txt (unmodified).
Release binaries: https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1

npm install runs scripts/install-stockfish.cjs to download the two release files,
checks pinned SHA-256 hashes, and reuses verified files on subsequent installs.
The JS and WASM are ignored by Git and explicitly included in the bot function's
Next.js output tracing. No remote scripts are loaded by the browser.

Search limits: easy 80 ms/depth 1; medium 120 ms/depth 3;
hard 220 ms/1320 engine Elo; expert 400 ms/1600 engine Elo.
These strength settings are not calibrated against human AUNORA ratings.
Every returned move is checked against the existing authoritative rules.
