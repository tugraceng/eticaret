const path = require("path");

/** PM2 ecosystem dosyasının bulunduğu klasör = repo kökü */
const repoRoot = __dirname;

module.exports = {
  apps: [
    {
      name: "eticaret-backend",
      cwd: path.join(repoRoot, "apps/backend"),
      script: "dist/main.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
        /** İsteğe bağlı override; yoksa backend dist konumundan ../../../uploads kullanır */
      },
    },
    {
      name: "eticaret-frontend",
      cwd: path.join(repoRoot, "apps/frontend"),
      script: path.join(repoRoot, "node_modules/next/dist/bin/next"),
      args: "start",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
