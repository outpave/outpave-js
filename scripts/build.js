import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
for (const project of ["tsconfig.esm.json", "tsconfig.cjs.json"]) {
  execFileSync("tsc", ["-p", project], { stdio: "inherit" });
}
writeFileSync("dist/cjs/package.json", `${JSON.stringify({ type: "commonjs" })}\n`);
