/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy /api/* hacia el backend NestJS.
    // En docker-compose el backend es http://backend:3001,
    // en local sin Docker es http://localhost:3001.
    // Usar BACKEND_URL permite cambiar el destino sin rebuild
    // (Coolify inyecta la variable en runtime).
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
