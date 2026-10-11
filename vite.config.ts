import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import packageJson from "./package.json";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/userscript/index.ts",
      userscript: {
        name: "Geoguessr Learner Map",
        namespace: "https://www.geoguessr.com/",
        version: packageJson.version,
        description: "Study Brazilian DDD areas, Google Street View coverage, and traffic side on GeoGuessr's guessing map.",
        match: ["https://www.geoguessr.com/*", "https://geoguessr.com/*"],
        "run-at": "document-idle",
        grant: ["GM_xmlhttpRequest", "unsafeWindow"],
        connect: ["gist.githubusercontent.com", "raw.githubusercontent.com"],
      },
      build: {
        fileName: "geoguessr-learner-map.user.js",
      },
    }),
  ],
});
