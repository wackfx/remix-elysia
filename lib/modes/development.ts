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

  const runOnViteOnly = [
    (request: Request, _: URL) => request.url.includes("virtual:remix/") || request.url.includes("@vite/"),
    (_: Request, url: URL) => url.pathname.match(/(.js|.jsx|.ts|.tsx)$/),
  ];

  return async (request: Request) => {
    let initialResponse: Response | undefined = undefined;
    try {
      const _publicFile = await getPublicFile(request);
      if (_publicFile) return _publicFile;

      const build = (await vite.ssrLoadModule("virtual:remix/server-build")) as ServerBuild;
      const loadContext = await options.getLoadContext?.({ request, context: { env: process.env } });
      const handleRequest = createRequestHandler(build, options.mode);

      const _url = new URL(request.url);
      if (runOnViteOnly.some((fn) => fn(request, _url)) === false) {
        const local = await handleRequest(request, loadContext);
        if (local.status < 400 || Object.keys(local.headers.toJSON()).find((key) => key.startsWith("x-remix")))
          return local;
      }
      const fromVite = await fetch(new Request({ ...request, url: `http://localhost:5959${_url.pathname}` }));
      if (fromVite.status === 404 && !options.basename) return;
      return fromVite;
    } catch (error: unknown) {
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
