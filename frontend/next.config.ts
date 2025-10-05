/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // allowed external domains
    domains: ['res.cloudinary.com', 'cdn-icons-png.flaticon.com'],
    // optional more-flexible matcher
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com', port: '', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;