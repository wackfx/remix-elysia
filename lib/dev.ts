import { build } from "@remix-run/dev/dist/vite/build";
import { watch } from "fs";
import { resolve } from "path";

export const watcher = async (
  options: {
    root?: string;
    watch?: string | string[];
    mode?: string;
    directory?: string;
  } & Parameters<typeof build>[1]
) => {
  options.mode = options.mode ?? "development";
  options.root = options.root ?? process.cwd();
  options.watch = options.watch ?? [
    resolve(options.root, options.directory ?? "", "app"),
    resolve(options.root, options.directory ?? "", "public"),
  ];
  options.config = options.config ?? resolve(options.root, options.directory ?? "", "vite.config.ts");
  const { root, watch: pathToWatch } = options;
  const paths = !pathToWatch ? [root] : Array.isArray(pathToWatch) ? pathToWatch : [pathToWatch];

  let building: Promise<void> | undefined = undefined;
  const rebuild = () => {
    if (building) return;
    building = new Promise(async (ok) => {
      try {
        await build(root, options);
      } catch (e) {
        console.error(e);
      }
      ok();
      building = undefined;
    });
    return building;
  };

  await rebuild();
  if (options.mode === "production") return null; // noop
  paths.map((p) => watch(p, { recursive: true }, rebuild));

  return async () => {
    await building;
  };
};
