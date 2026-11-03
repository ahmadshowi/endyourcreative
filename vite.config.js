import { defineConfig, loadEnv } from "vite";

// Public URL of the deployed site, used for canonical, Open Graph and JSON-LD tags.
// Set SITE_URL in your hosting environment (or .env) once the final domain is known.
const DEFAULT_SITE_URL = "https://end-yourcreative.vercel.app";

/**
 * Serves api/*.js handlers during `npm run dev`, so the inquiry form talks to the
 * same code locally that Vercel runs in production.
 */
function localApi(env) {
  return {
    name: "local-api",
    apply: "serve",
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use("/api/inquiry", async (req, res) => {
        let raw = "";
        for await (const chunk of req) raw += chunk;
        req.body = raw;
        res.status = (code) => ((res.statusCode = code), res);
        res.json = (obj) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        };
        const { default: handler } = await server.ssrLoadModule("/api/inquiry.js");
        await handler(req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");

  return {
    plugins: [
      {
        name: "site-url",
        transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl),
      },
      localApi(env),
    ],
    build: {
      target: "es2020",
    },
  };
});
