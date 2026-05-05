const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const nextDir = path.join(process.cwd(), ".next");
if (!fs.existsSync(nextDir)) {
  // eslint-disable-next-line no-console
  console.error("Production build not found. Run `npm run build -w @platform/frontend` first.");
  process.exit(1);
}

const child = spawn("next", ["start"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
