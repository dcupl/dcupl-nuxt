import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("ssr", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  });

  it("renders the index page from the server instance", async () => {
    const html = await $fetch<string>("/");
    expect(html).toContain("<div>basic</div>");
    expect(html).toContain("count=100");
  });

  it("bug 1: concurrent requests keep their lists while others finish rendering", async () => {
    const pages = Array.from({ length: 30 }, (_, i) =>
      $fetch<string>(`/?delay=${(i % 5) * 20}&q=${i}`),
    );
    const apis = Array.from({ length: 10 }, () =>
      $fetch<{ count: number }>("/api/instance"),
    );
    const [html, json] = await Promise.all([Promise.all(pages), Promise.all(apis)]);
    for (const page of html) expect(page).toContain("count=100");
    for (const body of json) expect(body.count).toBe(100);
  });
});
