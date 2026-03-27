import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['@takumi-rs/image-response'],
  reactStrictMode: true,
  output: 'export',
  // On GitHub Pages, it usually sits at /clientshell path.
  // Locally or on a custom domain, basePath shouldn't be touched.
  basePath: process.env.GITHUB_ACTIONS ? '/clientshell' : '',
  // Needs to be false to output to out/ instead of relying on Image Optimization Server
  images: { unoptimized: true }
};

export default withMDX(config);
