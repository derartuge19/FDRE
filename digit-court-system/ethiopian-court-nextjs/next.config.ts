import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['ws']
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5173',
    NEXT_PUBLIC_USER_SERVICE_URL: process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3001',
    NEXT_PUBLIC_CASE_SERVICE_URL: process.env.NEXT_PUBLIC_CASE_SERVICE_URL || 'http://localhost:3002',
    NEXT_PUBLIC_HEARING_SERVICE_URL: process.env.NEXT_PUBLIC_HEARING_SERVICE_URL || 'http://localhost:3005',
    NEXT_PUBLIC_DOCUMENT_SERVICE_URL: process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || 'http://localhost:3003',
    NEXT_PUBLIC_NOTIFICATION_SERVICE_URL: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5173'
  }
};

export default nextConfig;
