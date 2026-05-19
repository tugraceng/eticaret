module.exports = {
  apps: [
    {
      name: "eticaret-backend",
      cwd: "./apps/backend",
      script: "dist/main.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
        /** PM2 cwd: apps/backend — görseller repo kökünde uploads/ */
        UPLOAD_DIR: "../../uploads",
      },
    },
    {
      name: "eticaret-frontend",
      /** Monorepo: next kök node_modules’da; npm run start package.json’a bağlı kalmasın */
      cwd: "./apps/frontend",
      script: "../../node_modules/next/dist/bin/next",
      args: "start",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
