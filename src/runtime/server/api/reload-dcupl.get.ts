import { createError, defineEventHandler, getHeader, getQuery } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import { useDcuplServerStore } from "../utils/store-instance";

export default defineEventHandler(async (event) => {
  const authorizationHeader = getHeader(event, "Authorization");
  const { token: authorizationToken } = getQuery(event);

  const authorization = authorizationHeader || authorizationToken;

  const { dcupl } = useRuntimeConfig();

  if (!dcupl.reloadHook?.secret || authorization !== dcupl.reloadHook.secret) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }
  try {
    // builds the new instance completely, then SSR and API routes switch to it
    await useDcuplServerStore().reload();
  }
  catch (error) {
    console.error("[dcupl] reload failed", error);
    throw createError({ status: 500, statusMessage: "dcupl reload failed" });
  }
  console.info("[dcupl] reloaded the server instance");
  return {
    status: 200,
    statusMessage: "OK",
  };
});
