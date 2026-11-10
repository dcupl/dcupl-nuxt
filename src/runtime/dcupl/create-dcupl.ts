import { Dcupl } from "@dcupl/core";
import { DcuplAppLoader } from "@dcupl/loader";
import type { DcuplModuleOptions } from "../../module";

export interface CreatedDcupl {
  dcupl: Dcupl;
  loader: DcuplAppLoader;
}

/**
 * Builds a dcupl instance: fetches the app loader configuration of the console
 * project, processes it and resolves once `dcupl.init()` has finished.
 */
export async function createDcupl(
  options: DcuplModuleOptions,
): Promise<CreatedDcupl> {
  const dcupl = new Dcupl(options);
  const loader = new DcuplAppLoader();
  dcupl.loaders.add(loader);
  await loader.config.fetch();
  await loader.process(options.loader ?? { applicationKey: "default" });
  await dcupl.init();
  return { dcupl, loader };
}

/**
 * Returns a check that asks the dcupl API whether the console project changed
 * since the last call. The first successful call only records the timestamp.
 * Only files served from the dcupl CDN are covered; without a projectId the
 * check always answers false.
 */
export function createStatusCheck(
  projectId: string | undefined,
  fetchStatus: (url: string) => Promise<{ changedAt?: number } | undefined>,
): () => Promise<boolean> {
  let changedAt = 0;
  return async () => {
    if (!projectId) return false;
    const status = await fetchStatus(
      `https://api.dcupl.com/projects/${projectId}/files/versions/draft/status`,
    );
    const next = status?.changedAt ?? 0;
    if (next <= changedAt) return false;
    const isFirst = changedAt === 0;
    changedAt = next;
    return !isFirst;
  };
}
