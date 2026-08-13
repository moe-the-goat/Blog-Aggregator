import { setUser, readConfig } from "./config.js";
import { createUser, getUserByName, deleteUsers, getUsers } from "./db/queries/users.js";
import { createFeed, getFeeds, getFeedByUrl } from "./db/queries/feeds.js";
import { createFeedFollow, getFeedFollowsForUser, deleteFeedFollow } from "./db/queries/feed_follows.js";
import { conn } from "./db/index.js";
import { fetchFeed } from "./rss.js";
import { Feed, User } from "./schema.js";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

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

async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) {
    console.error(`Unknown command: ${cmdName}`);
    process.exit(1);
  }
  await handler(cmdName, ...args);
}

function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const config = readConfig();
    if (!config.currentUserName) {
      console.error("Error: no user is currently logged in");
      process.exit(1);
    }

    const currentUser = await getUserByName(config.currentUserName);
    if (!currentUser) {
      console.error(`Error: logged in user ${config.currentUserName} does not exist`);
      process.exit(1);
    }

    await handler(cmdName, currentUser, ...args);
  };
}

function printFeed(feed: Feed, user: User): void {
  console.log(`* ID:           ${feed.id}`);
  console.log(`* Created At:   ${feed.createdAt}`);
  console.log(`* Updated At:   ${feed.updatedAt}`);
  console.log(`* Name:         ${feed.name}`);
  console.log(`* URL:          ${feed.url}`);
  console.log(`* User:         ${user.name}`);
}

async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error("Error: username is required for login command");
    process.exit(1);
  }
  const username = args[0];
  const user = await getUserByName(username);
  if (!user) {
    console.error(`User ${username} does not exist`);
    process.exit(1);
  }
  setUser(username);
  console.log(`User has been set to ${username}`);
}

async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error("Error: name is required for register command");
    process.exit(1);
  }
  const name = args[0];
  const existingUser = await getUserByName(name);
  if (existingUser) {
    console.error(`User ${name} already exists`);
    process.exit(1);
  }

  const user = await createUser(name);
  setUser(user.name);
  console.log(`User ${user.name} created successfully`);
}

async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
  try {
    await deleteUsers();
    console.log("Database reset successfully");
  } catch (err: any) {
    console.error("Failed to reset database");
    process.exit(1);
  }
}

async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
  const allUsers = await getUsers();
  const config = readConfig();
  const currentUser = config.currentUserName;

  for (const user of allUsers) {
    if (user.name === currentUser) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}

async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
  const url = "https://www.wagslane.dev/index.xml";
  const feed = await fetchFeed(url);
  console.log(JSON.stringify(feed, null, 2));
}

async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    console.error("Error: both feed name and url are required");
    process.exit(1);
  }

  const [name, url] = args;
  const feed = await createFeed(name, url, user.id);
  const follow = await createFeedFollow(user.id, feed.id);

  console.log(`Feed: ${follow.feedName}`);
  console.log(`User: ${follow.userName}`);
}

async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
  const allFeeds = await getFeeds();

  for (const feed of allFeeds) {
    console.log(`* Name: ${feed.name}`);
    console.log(`* URL:  ${feed.url}`);
    console.log(`* User: ${feed.userName}`);
  }
}

async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    console.error("Error: feed url is required");
    process.exit(1);
  }

  const url = args[0];
  const feed = await getFeedByUrl(url);
  if (!feed) {
    console.error(`Error: feed with url ${url} not found`);
    process.exit(1);
  }

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`Feed: ${follow.feedName}`);
  console.log(`User: ${follow.userName}`);
}

async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);
  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
}

async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    console.error("Error: feed url is required");
    process.exit(1);
  }

  const url = args[0];
  await deleteFeedFollow(user.id, url);
  console.log(`Unfollowed feed: ${url}`);
}

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Error: no command provided");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
    await conn.end();
    process.exit(0);
  } catch (err: any) {
    console.error(err.message || err);
    await conn.end();
    process.exit(1);
  }
}

main();
