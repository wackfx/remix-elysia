import Elysia from "elysia";
import type { RemixElysiaOptions } from ".";

export const remix = async (options: RemixElysiaOptions) => {
  const instance = new Elysia();
  if (process.env["CI"] || options.mode === "production") await (await import("./modes/ci")).build(options);

  if (options.mode === "production") return await (await import("./modes/production")).use(instance, options);
  else return await (await import("./modes/development")).use(instance, options);
};
