import { setUser, readConfig } from "./config.js";

function main() {
  setUser("Lane");
  const config = readConfig();
  console.log(`currentUserName: ${config.currentUserName}`);
  console.log(`dbUrl: ${config.dbUrl}`);
}

main();
