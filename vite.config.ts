// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function apiDevPlugin(): Plugin {
  return {
    name: "api-dev-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/forms")) {
          return next();
        }

        try {
          const { handleApiRequest } = await import("./src/server/api-handler");
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const host = req.headers.host || "localhost:3000";
          const fullUrl = `${protocol}://${host}${req.url}`;

          let bodyBuffer = Buffer.alloc(0);
          if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            bodyBuffer = Buffer.concat(chunks);
          }

          const webRequest = new Request(fullUrl, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
          });

          const response = await handleApiRequest(webRequest);
          if (!response) {
            return next();
          }

          res.statusCode = response.status;
          response.headers.forEach((val, key) => {
            res.setHeader(key, val);
          });
          const resBody = await response.text();
          res.end(resBody);
        } catch (err: any) {
          console.error("API Dev Plugin error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message || "Internal server error" }));
        }
      });
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [apiDevPlugin()],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
