/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Registry-core reads foundation manifests/contract from disk at import
  // time via require.resolve + readFileSync — keep it external so the Node
  // resolution behavior survives bundling.
  serverExternalPackages: ["@arche/registry-core", "@arche/foundation"],
};

export default nextConfig;
