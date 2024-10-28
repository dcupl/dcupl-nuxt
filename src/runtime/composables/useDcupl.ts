import { useNuxtApp } from "#app";
import type { Dcupl } from "@dcupl/core";

export default function useDcupl(): Dcupl {
  const { $dcupl } = useNuxtApp();
  return $dcupl;
}
