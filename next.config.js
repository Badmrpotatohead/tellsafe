/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  // Server components need firebase-admin — mark as external
  serverExternalPackages: ["firebase-admin"],
};

module.exports = nextConfig;
