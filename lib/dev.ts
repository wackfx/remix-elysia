import { build } from "@remix-run/dev/dist/vite/build";
import { watch } from "fs";

export const watcher = async (options: {
  root?: string;
  watch?: string | string[];
  build?: Parameters<typeof build>[1];
  mode?: string;
}) => {
  options.mode = options.mode ?? "development";
  options.root = options.root ?? process.cwd();
  options.watch = options.watch ?? ["./app", "./public"];
  options.build = options.build ?? { mode: options.mode };
  const { root, watch: pathToWatch, build: buildOptions } = options;
  const paths = !pathToWatch ? [root] : Array.isArray(pathToWatch) ? pathToWatch : [pathToWatch];

  let building: Promise<void> | undefined = undefined;
  const rebuild = () => {
    if (building) return;
    building = new Promise(async (ok, ko) => {
      await build(root, buildOptions).catch(ko);
      ok();
      building = undefined;
    });
    return building;
  };

  await rebuild();
  if (options.mode === "production") return async () => {}; // noop
  paths.map((p) => watch(p, { recursive: true }, rebuild));

  return async () => {
    await building;
  };
};
