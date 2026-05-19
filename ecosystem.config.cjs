const path = require("path");

/** Repo kökü — PM2 bu dosyayı nereden başlatırsa başlatsın uploads buraya bağlanır */
const repoRoot = __dirname;
const uploadDir = path.join(repoRoot, "uploads");

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
        UPLOAD_DIR: uploadDir,
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
