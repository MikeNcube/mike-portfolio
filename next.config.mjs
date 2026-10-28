/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // Old Zororo "digital applications" slug → Digi App Form (the shipped intake app)
      {
        source: "/projects/zororo-digital-applications",
        destination: "/projects/digi-app-form",
        permanent: true,
      },
      // Old AWS RDS lab consolidates into the resilient web tier page
      {
        source: "/projects/rds-connectivity-lab",
        destination: "/projects/aws-resilient-web-tier",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
