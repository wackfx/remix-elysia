import type Elysia from "elysia";
import { createRequestHandler } from "@remix-run/server-runtime";
import type { RemixElysiaOptions } from "..";
import { getServerFile, publicFile, run } from "../utils";
import { resolve } from "node:path";

export const handler = async (options: RemixElysiaOptions) => {
  const build = await import(getServerFile(options));
  const handleRequest = createRequestHandler(build, options.mode);
  const assets = [
    publicFile(options, resolve(options.basename ?? "/", "assets"), "build/client/assets", true),
    publicFile(options, `${(options.basename ?? "/") + "assets"}`, "build/client/assets", true),
    publicFile(options, resolve(options.basename ?? "/"), "build/client", false),
  ];

  return async (request: Request) => {
    try {
      const _anyPublic = await Promise.all(assets.map((asset) => asset(request)));
      if (_anyPublic.some((asset) => asset)) return _anyPublic.find((asset) => asset);
      const loadContext = await options.getLoadContext?.({ request, context: { env: process.env } });

      const response = await handleRequest(request, loadContext);
      if (
        response.status < 400 ||
        Object.keys(response.headers.toJSON()).find((key) => key.startsWith("x-remix")) ||
        options.basename
      )
        return response;
    } catch (error: unknown) {
      console.error(error);
    }
  };
};

export const use = async (elysia: Elysia, options: RemixElysiaOptions) => {
  const execute = await handler(options);
  const shouldRun = run(options);

  return elysia.onRequest(({ request }) => {
    if (shouldRun(request)) return execute(request);
  });
};
