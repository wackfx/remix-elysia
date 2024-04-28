import type { AppLoadContext } from "@remix-run/server-runtime";
import type { ViteBuildOptions } from "@remix-run/dev/dist/vite/build";

export type RemixElysiaOptions = ViteBuildOptions & {
  directory?: string;
  mode?: string;
  basename?: string;
  root?: string;
  getLoadContext?: <Context extends AppLoadContext | undefined = undefined>({
    request,
    context,
  }: {
    request: Request;
    context: AppLoadContext;
  }) => Promise<Context> | Context;
};
