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
      },
    },
    {
      name: "eticaret-frontend",
      cwd: "./apps/frontend",
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
