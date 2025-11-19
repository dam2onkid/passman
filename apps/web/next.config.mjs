/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@passman/utils"],
  serverExternalPackages: ["@mysten/walrus", "@mysten/walrus-wasm"],
};

export default nextConfig;
