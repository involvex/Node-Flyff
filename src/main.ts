import loginServer from "./servers/loginServer";
import clusterServer from "./servers/clusterServer/";
import worldServer from "./servers/worldServer/index.ts";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Parse command-line arguments
const args = process.argv.slice(2); // Remove "node" and script filename from args
const serverType = args[0];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

global.projectPath = __dirname as string;
global.TimeStarted = 0 as number;

switch (serverType) {
  case "login":
    loginServer();
    break;
  case "cluster":
    clusterServer();
    break;
  case "world":
    worldServer();
    break;
  default:
    console.error("Invalid server type:", serverType);
    process.exit(1);
}
