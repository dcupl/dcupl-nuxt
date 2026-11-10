import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string; scripts: Record<string, string> };

describe("package", () => {
  it("release publishes the version in package.json as it is", () => {
    // changelogen --release bumped 0.1.0 to 0.1.1 and wrote a second changelog section
    expect(pkg.scripts.release).toContain("npm publish");
    expect(pkg.scripts.release).not.toMatch(/changelogen|npm version|--bump/);
  });
});
