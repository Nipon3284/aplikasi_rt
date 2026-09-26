/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_IS_PUBLIC_WEB:
      process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true'
        ? 'true'
        : 'false',
  },
};

export default nextConfig;
