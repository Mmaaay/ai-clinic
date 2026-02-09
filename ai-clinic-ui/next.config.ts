import type { NextConfig } from "next";
import "./src/env.mjs"; // Validation happens here!

/** @type {import('next').NextConfig} */
const nextConfig = { output: "standalone" };
export default nextConfig;
