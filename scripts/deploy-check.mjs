import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateDeployment } from "./deployment-config.mjs";

const environment = process.argv[2];
try {
  const config = JSON.parse(
    readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  );
  validateDeployment(config, environment);
  if (process.argv.includes("--check"))
    console.log(`PASS: ${environment} deployment configuration.`);
  else {
    const wrangler = fileURLToPath(
      new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url),
    );
    execFileSync(
      process.execPath,
      [
        wrangler,
        "d1",
        "migrations",
        "apply",
        config.env[environment].d1_databases[0].database_name,
        "--remote",
        "--env",
        environment,
      ],
      { stdio: "inherit" },
    );
    execFileSync(
      process.execPath,
      [wrangler, "deploy", "--env", environment, "--minify"],
      { stdio: "inherit" },
    );
  }
} catch (error) {
  console.error(`Deployment stopped: ${error.message}`);
  process.exitCode = 1;
}
