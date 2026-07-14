/** @type {import('next').NextConfig} */
const CopyPlugin = require("copy-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");
const nextConfig = {
  experimental: {
    esmExternals: "loose",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    // In dev mode, API calls go through Next.js rewrites (no CORS issues)
    // In production (static export), API_BASE_URL is baked in at build time
    API_BASE_URL: process.env.NODE_ENV === 'development' ? '' : process.env.API_BASE_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GET_USER_URL: process.env.GET_USER_URL,
    LOGIN_URL: process.env.LOGIN_URL,
    LOGOUT_URL: process.env.LOGOUT_URL,
  },
  trailingSlash: true,
  images: { unoptimized: true },
  skipTrailingSlashRedirect: true,
  // Dev mode: proxy /api requests to backend to avoid CORS
  async rewrites() {
    const backendUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5670';
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: `${backendUrl}/api/:path*`,
          },
        ]
      : [];
  },
  // Dev-only: keep fewer pages in memory to reduce heap usage on low-RAM machines
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve.fallback = { fs: false };
    // Skip heavy plugins in dev mode to reduce memory on 8GB machines.
    // Set DEV_FULL=1 to force full plugin loading (Monaco editor, ob-workers).
    const devLite = dev && process.env.DEV_FULL !== '1';
    if (!isServer && !devLite) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.join(
                __dirname,
                "node_modules/@oceanbase-odc/monaco-plugin-ob/worker-dist/"
              ),
              to: "static/ob-workers",
            },
          ],
        })
      );
      // 添加 monaco-editor-webpack-plugin 插件
      config.plugins.push(
        new MonacoWebpackPlugin({
          // 你可以在这里配置插件的选项，例如：
          languages: ["sql"],
          filename: "static/[name].worker.js",
        })
      );
    }
    return config;
  },
};

const withTM = require("next-transpile-modules")([
  "@berryv/g2-react",
  "@antv/g2",
  "react-syntax-highlighter",
  "@antv/g6",
  "@antv/graphin",
  "@antv/gpt-vis",
]);

module.exports = withTM({
  ...nextConfig,
});
