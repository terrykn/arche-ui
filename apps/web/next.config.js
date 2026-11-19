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
  // Registry-core reads foundation manifests/blocks/templates and its own
  // keyword table + corpus from disk at runtime. Those reads use computed
  // paths the file tracer cannot see, so ship the data explicitly — without
  // this the deployed serverless functions load without the registry data
  // and every server path that uses it fails.
  outputFileTracingIncludes: {
    "/**": [
      "../../packages/registry-core/dist/**/*.json",
      "../../packages/foundation/src/manifests/*.json",
      "../../packages/foundation/src/blocks/*.json",
      "../../packages/foundation/src/templates/**/*",
      "../../packages/foundation/src/contract/*.json",
    ],
  },
};

export default nextConfig;
