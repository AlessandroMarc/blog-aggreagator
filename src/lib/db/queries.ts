
import { users, feeds, feedFollows, posts } from "../../schema";
import { db } from "./index";
import { eq, and, sql } from "drizzle-orm";

export async function createUser(name: string) {
    const existingUser = await getUserByName(name);
    if (existingUser) {
        throw new Error("User already exists");
    }
    const [result] = await db.insert(users).values({ name: name }).returning();
    return result;
}

export async function getUserByName(searchName: string) {
    const result = await db.select().from(users).where(eq(users.name, searchName));
    return result[0] ?? null;
}

export async function getUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] ?? null;
}

export async function deleteAllUsers() {
    await db.delete(users);
}

export async function getAllUsers() {
    const result = await db.select().from(users);
    return result;
}

export async function getFeeds() {
    const result = await db.select().from(feeds);
    return result;
}

export async function getFeedByUrl(url: string) {
    const result = await db.select().from(feeds).where(eq(feeds.url, url));
    return result[0] ?? null;
}

export async function createFeed(name: string, url: string, userId: string) {
    const [result] = await db.insert(feeds).values({ name, url, userId }).returning();
    return result;
}

export async function createFeedFollowEntry(userId: string, feedId: string) {
    const result = await db.insert(feedFollows).values({ userId, feedId }).returning();
    return result;
}

export async function getFeedFollowEntriesByUserId(userId: string) {
    const result = await db.select().from(feedFollows).where(eq(feedFollows.userId, userId));
    return result;
}

export async function deleteFeedFollowEntry(userId: string, feedId: string) {
    const feedToUnfollow = await db.select().from(feedFollows).where(and(
        eq(feedFollows.userId, userId),
        eq(feedFollows.feedId, feedId)),
    ).limit(1);

    if (feedToUnfollow.length === 0) {
        throw new Error("Feed follow entry not found");
    }

    await db.delete(feedFollows).where(eq(feedFollows.id, feedToUnfollow[0].id));
}

export async function markFeedFetched(feedId: string) {
    await db.update(feeds).set({ last_fetched_at: new Date() }).where(eq(feeds.id, feedId));
    await db.update(feeds).set({ updatedAt: new Date() }).where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
    const result = await db.select()
        .from(feeds)
        .orderBy(sql`${feeds.last_fetched_at} NULLS FIRST`)
        .limit(1);
    return result[0] ?? null;
}

export async function createPost(title: string, url: string, feedId: string, publishedAt: Date, description?: string) {
    const [result] = await db.insert(posts).values({ title, url, feed_id: feedId, description, publishedAt }).returning();
    return result;
}

export async function getPostsForUser(userId: string, limit: number = 2) {
    const result = await db.select()
        .from(posts)
        .innerJoin(feedFollows, eq(feedFollows.feedId, posts.feed_id))
        .where(eq(feedFollows.userId, userId))
        .orderBy(sql`${posts.publishedAt} DESC`)
        .limit(limit);
    return result.map(row => row.posts);
}