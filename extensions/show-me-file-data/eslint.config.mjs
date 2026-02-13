import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const raycastConfig = require("@raycast/eslint-config");

export default raycastConfig.flat();
