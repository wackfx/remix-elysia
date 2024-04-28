import type { RemixElysiaOptions } from ".";
import mime from "mime";
import { resolve, join } from "node:path";

export const _import = (_module: string) => {
  try {
    return import(_module);
  } catch (e) {
    return undefined;
  }
};

export const run = (options: RemixElysiaOptions) => (request: Request) =>
  !options.basename || new URL(request.url).pathname.startsWith(options.basename);

export const getServerFile = (options: RemixElysiaOptions) =>
  resolve(options.root ?? process.cwd(), options.directory ?? "", "build/server/index");

export const hasBuild = async (options: RemixElysiaOptions) => Bun.file(getServerFile(options)).exists();

export const publicFile = (
  options: RemixElysiaOptions,
  prefix: string = options.basename ?? "/",
  folder: string = "public",
  immutable = false
) => {
  const shouldRun = run({ basename: prefix });
  return async (request: Request) => {
    if (!shouldRun(request)) return undefined;
    const url = new URL(request.url);

    const headers = new Headers();
    const contentType = mime.getType(url.pathname);
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    headers.set("Cache-Control", `public, max-age=${immutable ? "31536000, immutable" : "600"}`);

    const filePath = join(resolve(process.cwd(), options.directory ?? ""), folder, url.pathname.replace(prefix, ""));

    try {
      const file = await Bun.file(filePath);
      if (!(await file.exists())) return undefined;
      return new Response(file, { headers });
    } catch (error) {
      console.log(error);
    }
  };
};
