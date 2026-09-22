import type { NextConfig } from "next";

// Proxies API/auth calls through this app's own origin so Sanctum's session
// and XSRF-TOKEN cookies get set for THIS domain. The backend and frontend
// are deployed on separate hostnames with no shared parent domain, so
// without this, the browser can never read the XSRF-TOKEN cookie via
// document.cookie (cookies aren't visible across different hostnames) and
// every state-changing request fails CSRF verification.
const BACKEND_ORIGIN = (process.env.API_URL ?? "http://localhost:8000/api").replace(
  /\/api\/?$/,
  "",
);

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${BACKEND_ORIGIN}/sanctum/:path*` },
    ];
  },
};

export default nextConfig;
