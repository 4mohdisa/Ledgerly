/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['pages', 'utils'], // Only run ESLint on the 'pages' and 'utils' directories during production builds (next build)
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Add Content Security Policy headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://gaphbnspyqosmklayzvj.supabase.co;",
              "style-src 'self' 'unsafe-inline';",
              "img-src 'self' data: blob: https://*.supabase.co;",
              "font-src 'self' data:;",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com;",
              "frame-src 'self';",
              "object-src 'none';"
            ].join(' ')
          }
        ]
      }
    ];
  },
}

module.exports = nextConfig
