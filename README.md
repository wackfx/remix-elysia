> ☣️ disclaimer: experimental / hacky / weird / bad stuff ahead 🧟
>
> This is a really hacky way to have remix (with vite) in Elysia,
> nowhere near something you should use for respectable projects.
>
> I mostly needed to have this on github for my personal project use / deployment,
> I won't take bug requests, it's an experiment that fit my needs, for the rest, you're on your own.
>
> Make sure you understand the consequences before using anything you'll find hegre.

# remix-elysia

run Remix with Elysia

## install

In your bun remix project (use `bun create remix` to create one)

```sh
bun add elysia github:wackfx/remix-elysia
```

Create a file `index.ts`

```javascript
import { Elysia } from "elysia";
import { remix } from "remix-elysia";

const app = new Elysia()
  .use(await remix({ mode: process.env.NODE_ENV }))
  .get("/hello", () => "world !")
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
```

Remove those two lines from `vite.config.ts` and change your `package.json`

```diff
# in package.json
"scripts": {
  "build": "remix vite:build",
-  "dev": "remix vite:dev",
+  "dev": "bun run index.ts",
  "lint": "eslint --ignore-path .gitignore --cache --cache-location ./node_modules/.cache/eslint .",
-  "start": "remix-serve ./build/server/index.js",
+  "start": "NODE_ENV=production bun run index.ts",
  "typecheck": "tsc"
}

# in vite.config.ts
import { vitePlugin as remix } from "@remix-run/dev";
- import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

- installGlobals();

export default defineConfig({
  plugins: [remix(), tsconfigPaths()]
});

```

Run

```bash
bun run dev
```

## accessible on a url subpath // custom basename

1 - Add your basename to `vite.config.ts`

```diff
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
+  base: "/app",
-  plugins: [remix(), tsconfigPaths()]
+  plugins: [remix({ basename: '/app' }), tsconfigPaths()]
});
```

2 - Change your file `index.ts` and add a `basename` parameter

```diff
import { Elysia } from "elysia";
import { remix } from "remix-elysia";

const app = new Elysia()
-  .use(await remix({ mode: process.env.NODE_ENV }))
+  .use(await remix({ mode: process.env.NODE_ENV, basename: '/app' }))
  .get("/hello", () => "world !")
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
```

3 - Done. Run `npm run dev` and go to `http://localhost:3000/app`

## remix in a subfolder (monoliths, monorepos ...)

```javascript
// src/frontend/index.ts
const app = new Elysia().use(
  await remix({
    // > for monorepos; 'root' parameter should be set to where a package.json file is
    // root: '/'
    // > use basename as usual - basename is for app URL, not related to folder / code location
    // basename: '/my-app',
    mode: process.env.NODE_ENV,
    directory: import.meta.dir,
    // > 'directory' already set this for you, but you can override other params as well
    // config: resolve(import.meta.dir, './vite.config.ts'),
  })
);

// src/frontend/vite.config.ts
import { resolve } from "node:path";

export default defineConfig({
  // basename: '/my-app/',
  publicDir: resolve(import.meta.dir, `public`),
  plugins: [
    remix({
      // basename: '/my-app',
      buildDirectory: resolve(import.meta.dir, `build`),
      appDirectory: resolve(import.meta.dir, `app`),
    }),
    tsconfigPaths(),
  ],
});
```
