import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/userscript/index.ts",
      userscript: {
        name: "GeoGuessr – Brazil DDD & Street View Coverage",
        namespace: "https://www.geoguessr.com/",
        version: "1.1.0",
        description: "Show Brazilian DDD boundaries and dim countries without Google Street View coverage on GeoGuessr's guessing map.",
        match: ["https://www.geoguessr.com/*", "https://geoguessr.com/*"],
        "run-at": "document-idle",
        grant: ["GM_xmlhttpRequest", "unsafeWindow"],
        connect: ["gist.githubusercontent.com", "raw.githubusercontent.com"],
      },
      build: {
        fileName: "brazil-ddd.user.js",
      },
    }),
  ],
});
