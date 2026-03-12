
import { users } from "../../schema";
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

export async function deleteAllUsers() {
    await db.delete(users);
}

export async function getAllUsers() {
    const result = await db.select().from(users);
    return result;
}