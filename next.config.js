/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Capacitor APK build, uncomment the line below:
  // output: 'export',
  images: {
    unoptimized: true,
  },
  // Server Actions are available by default now - removed experimental config
};

module.exports = nextConfig;
