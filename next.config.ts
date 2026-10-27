import type { NextConfig } from "next";
const nextConfig: NextConfig = {
 poweredByHeader:false,
 outputFileTracingIncludes:{
  "/api/chess/bot":["./vendor/stockfish/stockfish-19-lite-single.js","./vendor/stockfish/stockfish-19-lite-single.wasm","./vendor/stockfish/COPYING.txt","./vendor/stockfish/README.md"]
 }
};
export default nextConfig;
