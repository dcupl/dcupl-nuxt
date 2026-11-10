import type { Dcupl } from "@dcupl/core";

/** Stands in for DcuplAppLoader: 100 articles plus a random id per instance. */
export class DcuplAppLoader {
  core!: Dcupl;
  config = { fetch: async (): Promise<void> => undefined };
  defaultVariables = new Map<string, unknown>();

  async process(): Promise<void> {
    this.core.models.set({
      key: "Article",
      properties: [{ key: "name", type: "string", filter: true }],
    });
    this.core.data.set(
      Array.from({ length: 100 }, (_, i) => ({ key: `${i + 1}`, name: `Article ${i + 1}` })),
      { model: "Article" },
    );
    this.core.models.set({
      key: "Instance",
      properties: [{ key: "id", type: "string" }],
    });
    this.core.data.set([{ key: "current", id: crypto.randomUUID() }], {
      model: "Instance",
    });
  }

  destroy(): void {}
}
