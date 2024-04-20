import Elysia from "elysia";
import { watcher as _watcher } from "./dev";
import { createRequestHandlerWithStaticFiles } from "./http";
import type { ViteBuildOptions } from "@remix-run/dev/dist/vite/build";
import { resolve } from "node:path";

type RemixElysiaOptions = ViteBuildOptions &
  Parameters<typeof _watcher>[0] & {
    mode?: string;
    basename?: string;
    root?: string;
  };

export const remix = async (options: RemixElysiaOptions) => {
  const watcher = options.mode !== "production" ? await _watcher(options) : undefined;
  const handler = createRequestHandlerWithStaticFiles({
    build: async () => import(resolve(options.root ?? process.cwd(), options.directory ?? "", "build/server/index")),
    mode: options.mode,
    all: !!options.basename,
    staticFiles: {
      basename: options.basename,
      publicDir: resolve(options.root ?? process.cwd(), options.directory ?? "", "build/client"),
      assetsPath: resolve(options.basename ?? "/", "assets"),
    },
  });
  const run = (request: Request) => !options.basename || new URL(request.url).pathname.startsWith(options.basename);

  return new Elysia()
    .onRequest(async ({ request }) => {
      if (!watcher || !run(request)) return;
      await watcher();
    })
    .onRequest(({ request, set }) => {
      if (!run(request)) return;
      return handler(request);
    });
};
