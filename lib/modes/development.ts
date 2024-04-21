import type Elysia from "elysia";
import { createRequestHandler } from "@remix-run/server-runtime";
import type { RemixElysiaOptions } from "..";
import type { ServerBuild } from "@remix-run/server-runtime";
import { publicFile, run } from "../utils";
import { resolve } from "node:path";

export const handler = async (options: RemixElysiaOptions) => {
  const vite = await import("vite").then((vite) =>
    vite.createServer({
      configFile: options.config ?? resolve(options.root ?? process.cwd(), options.directory ?? "", "vite.config.ts"),
      server: { port: 5959 },
    })
  );
  const getPublicFile = publicFile(options, options.basename, "public");
  vite.listen();

  return async (_request: Request) => {
    let initialResponse: Response | undefined = undefined;
    try {
      const _publicFile = await getPublicFile(_request);
      if (_publicFile) return _publicFile;

      const build = (await vite.ssrLoadModule("virtual:remix/server-build")) as ServerBuild;
      const loadContext = await options.getLoadContext?.(_request);
      const handleRequest = createRequestHandler(build, options.mode);

      if (_request.headers.get("sec-fetch-dest") !== "script")
        initialResponse = await handleRequest(_request, loadContext);
      if (!initialResponse || initialResponse.status === 404) {
        const _url = new URL(_request.url);
        const url = new Request({ ..._request, url: `http://localhost:5959${_url.pathname}` });
        return await fetch(url);
      }
      return initialResponse;
    } catch (error: unknown) {
      console.log(error);
      return initialResponse ?? new Response("Internal Error", { status: 500 });
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
