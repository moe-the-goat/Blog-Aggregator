import { setUser } from "./config.js";

type CommandHandler = (cmdName: string, ...args: string[]) => void;

type CommandsRegistry = {
  [key: string]: CommandHandler;
};

function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): void {
  const handler = registry[cmdName];
  if (!handler) {
    console.error(`Unknown command: ${cmdName}`);
    process.exit(1);
  }
  handler(cmdName, ...args);
}

function handlerLogin(cmdName: string, ...args: string[]): void {
  if (args.length === 0) {
    console.error("Error: username is required for login command");
    process.exit(1);
  }
  const username = args[0];
  setUser(username);
  console.log(`User has been set to ${username}`);
}

function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Error: no command provided");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    runCommand(registry, cmdName, ...cmdArgs);
  } catch (err: any) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
