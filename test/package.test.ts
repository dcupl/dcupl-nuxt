import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, it, expect } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string; scripts: Record<string, string>; engines?: { node?: string } };

describe("package", () => {
  it("release publishes the version in package.json as it is", () => {
    // changelogen --release bumped 0.1.0 to 0.1.1 and wrote a second changelog section
    expect(pkg.scripts.release).toContain("npm publish");
    expect(pkg.scripts.release).not.toMatch(/changelogen|npm version|--bump/);
  });

  it("asks for the Node.js versions Nuxt itself requires", () => {
    const nuxt = JSON.parse(
      readFileSync(join(root, "node_modules/nuxt/package.json"), "utf8"),
    ) as { engines: { node: string } };
    expect(pkg.engines?.node).toBe(nuxt.engines.node);
  });
});

describe("built package", () => {
  let out: string;

  beforeAll(() => {
    out = mkdtempSync(join(tmpdir(), "dcupl-nuxt-build-"));
    execFileSync(
      join(root, "node_modules/.bin/nuxt-module-build"),
      ["build", "--outDir", join(out, "dist")],
      { cwd: root, stdio: "ignore" },
    );
  }, 120_000);

  afterAll(() => {
    if (out) rmSync(out, { recursive: true, force: true });
  });

  it("types $dcupl as Dcupl for consumers", () => {
    const types = readFileSync(join(out, "dist/runtime/plugin.d.ts"), "utf8");
    expect(types).toMatch(/dcupl: Dcupl\b/);
    expect(types).not.toMatch(/dcupl: any/);
  });

  it("leaves the server tsconfig.json out of the tarball", () => {
    copyFileSync(join(root, "package.json"), join(out, "package.json"));
    const [packed] = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
        cwd: out,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    ) as [{ files: { path: string }[] }];
    const files = packed.files.map(file => file.path);
    expect(files).toContain("dist/runtime/plugin.d.ts");
    expect(files.filter(file => file.endsWith("tsconfig.json"))).toEqual([]);
  });
});
