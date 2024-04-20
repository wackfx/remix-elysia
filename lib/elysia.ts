import Elysia from "elysia";
import { watcher as _watcher } from "./dev";
import { createRequestHandlerWithStaticFiles } from "./http";
import type { ViteBuildOptions } from "@remix-run/dev/dist/vite/build";
import { resolve } from "node:path";

export const remix = async (
  options: ViteBuildOptions & { mode?: string; basename?: string; root?: string } & Parameters<typeof _watcher>[0]
) => {
  const watcher = options.mode !== "production" ? await _watcher(options) : undefined;
  const handler = createRequestHandlerWithStaticFiles({
    build: async () => import(resolve(options.root ?? process.cwd(), options.directory ?? "", "build/server/index")),
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
