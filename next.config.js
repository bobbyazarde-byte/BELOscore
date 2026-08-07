/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint n'est volontairement pas inclus dans les dépendances pour
    // garder le projet léger ; on désactive donc le lint automatique au
    // build pour que `next build` ne s'arrête pas dessus.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
