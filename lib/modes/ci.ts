import type { RemixElysiaOptions } from "..";
import { resolve } from "node:path";
import { _import, hasBuild } from "../utils";

export const build = async (options: RemixElysiaOptions) => {
  options.mode = options.mode ?? "development";
  options.root = options.root ?? process.cwd();
  options.config = options.config ?? resolve(options.root, options.directory ?? "", "vite.config.ts");

  const remixImported = await _import("@remix-run/dev/dist/vite/build");
  if (!remixImported && !hasBuild(options))
    throw new Error("You need to run `remix build` before starting the server.");

  try {
    await remixImported.build(options.root, options);
  } catch (e) {
    console.error(e);
  }
};
