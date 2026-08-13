import { db } from "../index.js";
import { feeds } from "../../schema.js";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();
  return result;
}

import { eq } from "drizzle-orm";
import { users } from "../../schema.js";

export async function getFeeds() {
  return await db
    .select({
      id: feeds.id,
      name: feeds.name,
      url: feeds.url,
      userName: users.name,
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
}
