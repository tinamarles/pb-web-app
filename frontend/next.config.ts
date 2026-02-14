import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.freepik.com",
        pathname: "/**",
      },
    ],
  },

   turbopack: {
    // ...
   },

   // Suppress performance warning during development
   webpack: (config, { dev }) => {
    if (dev) {
      config.ignoreWarnings = [ 
        /Failed to execute 'measure' on 'Performance'/,
      ];
    }
   },
};

export default nextConfig;
