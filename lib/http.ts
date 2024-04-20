import mime from "mime";
import path from "node:path";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";
import type { AppLoadContext, ServerBuild } from "@remix-run/server-runtime";

function defaultCacheControl(url: URL, assetsPublicPath = "/build/") {
  if (url.pathname.startsWith(assetsPublicPath)) {
    return "public, max-age=31536000, immutable";
  } else {
    return "public, max-age=600";
  }
}

export function createRequestHandler<Context extends AppLoadContext | undefined = undefined>({
  build,
  mode,
  getLoadContext,
}: {
  build: string | ServerBuild | (() => Promise<any>);
  mode?: string;
  getLoadContext?: (request: Request) => Promise<Context> | Context;
}) {
  let handleRequest: ReturnType<typeof createRemixRequestHandler>;
  let server: ServerBuild;

  if (typeof build === "object") {
    server = build;
    handleRequest = createRemixRequestHandler(server, mode);
  }

  return async (request: Request) => {
    if (typeof build === "string" && !server) {
      server = await import(build);
      handleRequest = createRemixRequestHandler(server, mode);
    }
    if (typeof build === "function" && (!server || mode !== "production")) {
      server = await build();
      handleRequest = createRemixRequestHandler(server, mode);
    }
    try {
      const loadContext = await getLoadContext?.(request);

      return handleRequest(request, loadContext);
    } catch (error: unknown) {
      console.error(error);

      return new Response("Internal Error", { status: 500 });
    }
  };
}

class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`No such file or directory: ${filePath}`);
  }
}

export async function serveStaticFiles(
  request: Request,
  {
    cacheControl,
    publicDir = "./public",
    assetsPublicPath = "/build/",
  }: {
    cacheControl?: string | ((url: URL) => string);
    publicDir?: string;
    assetsPublicPath?: string;
  }
) {
  const url = new URL(request.url);

  const headers = new Headers();
  const contentType = mime.getType(url.pathname);
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (typeof cacheControl === "function") {
    headers.set("Cache-Control", cacheControl(url));
  } else if (cacheControl) {
    headers.set("Cache-Control", cacheControl);
  } else {
    headers.set("Cache-Control", defaultCacheControl(url, assetsPublicPath));
  }

  const filePath = path.join(process.cwd(), publicDir, url.pathname);
  try {
    const file = await Bun.file(filePath);
    if (!(await file.exists())) throw new FileNotFoundError(filePath);

    return new Response(file, { headers });
  } catch (error) {
    throw error;
  }
}

export function createRequestHandlerWithStaticFiles<Context extends AppLoadContext | undefined = undefined>({
  build,
  mode,
  all,
  getLoadContext,
  staticFiles = {
    publicDir: "./build/client",
    assetsPublicPath: "/build/",
  },
}: {
  build: string | ServerBuild | (() => Promise<any>);
  mode?: string;
  getLoadContext?: (request: Request) => Promise<Context> | Context;
  all?: boolean;
  staticFiles?: {
    cacheControl?: string | ((url: URL) => string);
    publicDir?: string;
    assetsPublicPath?: string;
  };
}) {
  const remixHandler = createRequestHandler({ build, mode, getLoadContext });

  return async (request: Request) => {
    try {
      return await serveStaticFiles(request, staticFiles);
    } catch (error: unknown) {
      if (!(error instanceof FileNotFoundError)) {
        throw error;
      }
    }

    const response = await remixHandler(request);
    if (response.status === 404 && !all) return;
    return response;
  };
}
