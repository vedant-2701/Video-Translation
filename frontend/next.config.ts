import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // This configuration allows us to use external images if needed in the future,
    // for example, for user profile pictures or thumbnails.
    images: {
        domains: ["placehold.co"],
    },
};

export default nextConfig;
