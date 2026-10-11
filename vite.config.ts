import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/userscript/index.ts",
      userscript: {
        name: "GeoGuessr – Brazil DDD Area Codes",
        namespace: "https://www.geoguessr.com/",
        version: "1.0.3",
        description: "Overlay Brazilian phone area-code (DDD) boundaries on GeoGuessr's guessing map.",
        match: ["https://www.geoguessr.com/*", "https://geoguessr.com/*"],
        "run-at": "document-idle",
        grant: ["GM_xmlhttpRequest", "unsafeWindow"],
        connect: ["gist.githubusercontent.com"],
      },
      build: {
        fileName: "brazil-ddd.user.js",
      },
    }),
  ],
});
