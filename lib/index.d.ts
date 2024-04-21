import type { AppLoadContext } from "@remix-run/server-runtime";

export type RemixElysiaOptions = Parameters<typeof remixBuild>[1] & {
  directory?: string;
  mode?: string;
  basename?: string;
  root?: string;
  getLoadContext?: <Context extends AppLoadContext | undefined = undefined>(
    request: Request
  ) => Promise<Context> | Context;
};
