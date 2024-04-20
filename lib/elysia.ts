import Elysia from "elysia";
import { watcher as _watcher } from "./dev";
import { createRequestHandlerWithStaticFiles } from "./http";
import type { ViteBuildOptions } from "@remix-run/dev/dist/vite/build";

export const remix = async (options: ViteBuildOptions & { mode?: string; basename?: string; root?: string }) => {
  const watcher = options.mode !== "production" ? await _watcher(options) : undefined;
  const handler = createRequestHandlerWithStaticFiles({
    build: async () => import(`${options.root ?? process.cwd()}/build/server/index`),
    mode: options.mode,
    all: !!options.basename,
  });
  const run = (request: Request) => !options.basename || new URL(request.url).pathname.startsWith(options.basename);

  return new Elysia()
    .onRequest(({ request }) => {
      if (!watcher || !run(request)) return;
      return watcher();
    })
    .onRequest(({ request, set }) => {
      if (!run(request)) return;
      return handler(request);
    });
};
