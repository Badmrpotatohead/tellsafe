/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  experimental: {
    // firebase-admin uses native Node modules (gRPC, crypto) that break
    // when bundled by webpack — must be loaded as external packages
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

module.exports = nextConfig;
