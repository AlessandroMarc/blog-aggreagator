
import { users, feeds, feedFollows } from "../../schema";
import { db } from "./index";
import { eq } from "drizzle-orm";

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