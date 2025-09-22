// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // どこかに 'resend' の import が残っていてもバンドルしない
    config.resolve.alias = { ...config.resolve.alias, resend: false };
    return config;
  },
};
export default nextConfig;
