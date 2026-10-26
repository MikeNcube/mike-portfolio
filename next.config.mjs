/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // Old Zororo "digital applications" slug (clientProjects) → new CRM case study
      {
        source: "/projects/zororo-digital-applications",
        destination: "/projects/zororo-crm",
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
