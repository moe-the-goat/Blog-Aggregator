import { eq, desc, inArray } from "drizzle-orm";
import { db } from "../index.js";
import { posts, feedFollows } from "../../schema.js";

export async function createPost(
  title: string,
  url: string,
  description: string | undefined,
  publishedAt: Date,
  feedId: string
) {
  const [result] = await db
    .insert(posts)
    .values({
      title,
      url,
      description,
      publishedAt,
      feedId,
    })
    .onConflictDoNothing({ target: posts.url })
    .returning();
  return result;
}

export async function getPostsForUser(userId: string, limit: number = 2) {
  const userFollows = await db
    .select({ feedId: feedFollows.feedId })
    .from(feedFollows)
    .where(eq(feedFollows.userId, userId));

  const feedIds = userFollows.map((f) => f.feedId);
  if (feedIds.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(posts)
    .where(inArray(posts.feedId, feedIds))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}
