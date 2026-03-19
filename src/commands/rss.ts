import { XMLParser } from "fast-xml-parser";
import { create } from "node:domain";
import { readConfig } from "src/config";
import { createFeed, getFeeds, getUserById, getUserByName, createFeedFollowEntry, getFeedByUrl, getFeedFollowEntriesByUserId } from "src/lib/db/queries";
import { Feed, User } from "src/schema";

type RSSFeed = {
    channel: {
        title: string;
        link: string;
        description: string;
        item: RSSItem[];
    };
};

type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

const fetchFeed = async (url: string): Promise<string> => {
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "gator",
            },
        });

        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }

        const text = await res.text();

        return text;
    } catch (error) {
        console.error("Error fetching RSS feed:", error);
        throw error;
    }
}

const parseFeed = (xml: string): RSSFeed => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
    })

    const parsed = parser.parse(xml);


    // Handle the nested structure from fast-xml-parser
    const feed = (parsed as any).rss || parsed;


    if (!feed || !feed.channel || !feed.channel.item) {
        throw new Error("Invalid RSS feed format");
    }

    const channelItems = Array.isArray(feed.channel.item) ? feed.channel.item : [feed.channel.item];

    const rssItems: RSSItem[] = []

    channelItems.forEach((item: RSSItem) => {
        if (!item.title || !item.link || !item.description || !item.pubDate) {
            // Skip items with missing fields
        } else {
            rssItems.push(item);
        }
    });

    return {
        channel: {
            title: feed.channel.title,
            link: feed.channel.link,
            description: feed.channel.description,
            item: rssItems,
        },
    };
}

export const getRssFeed = async (_cmd: string): Promise<void> => {
    let url = "https://www.wagslane.dev/index.xml";

    try {
        const xml = await fetchFeed(url);
        const feed = parseFeed(xml);
    } catch (error) {
        console.error("Error processing RSS feed:", error);
    }
}

export const addFeed = async (_cmd: string, name: string, url: string): Promise<void> => {
    if (!name || !url) {
        throw new Error("URL argument required");
    }

    const userName = readConfig().currentUserName;
    const user = await getUserByName(userName);
    if (!user) {
        throw new Error(`User ${userName} not found`);
    }


    const feed = await createFeed(name, url, user.id)
    if (!feed) {
        throw new Error("Failed to create feed");
    }

    createFeedFollowEntry(user.id, feed.id);

    try {
        const xml = await fetchFeed(url);
        const feed = parseFeed(xml);
        console.log("Feed title:", feed.channel.title), 'username:', userName, 'feed name:', name, 'feed url:', url;
    } catch (error) {
        console.error("Error adding RSS feed:", error);
    }
}

export async function getAllFeeds(_: string) {
    const feeds = await getFeeds();

    if (feeds.length === 0) {
        console.log(`No feeds found.`);
        return;
    }

    console.log(`Found %d feeds:\n`, feeds.length);
    for (let feed of feeds) {
        const user = await getUserById(feed.userId);
        if (!user) {
            throw new Error(`Failed to find user for feed ${feed.id}`);
        }

        printFeed(feed, user);
        console.log(`=====================================`);
    }
}

function printFeed(feed: Feed, user: User) {
    console.log(`* ID:            ${feed.id}`);
    console.log(`* Created:       ${feed.createdAt}`);
    console.log(`* Updated:       ${feed.updatedAt}`);
    console.log(`* name:          ${feed.name}`);
    console.log(`* URL:           ${feed.url}`);
    console.log(`* User:          ${user.name}`);
}

export const createFollow = async (_cmd: string, url: string): Promise<void> => {
    if (!url) {
        throw new Error("URL argument required");
    }

    const userName = readConfig().currentUserName;
    const user = await getUserByName(userName);
    if (!user) {
        throw new Error(`User ${userName} not found`);
    }

    const feed = await getFeedByUrl(url);
    if (!feed) {
        throw new Error(`Feed with URL ${url} not found`);
    }

    const feedFollow = await createFeedFollowEntry(user.id, feed.id);
    if (!feedFollow) {
        throw new Error("Failed to create feed follow");
    }

    console.log(`User ${user.name} is now following feed ${feed.name}`);
}

export const fetchFollowingFeeds = async () => {
    const userName = readConfig().currentUserName;
    const user = await getUserByName(userName);
    if (!user) {
        throw new Error(`User ${userName} not found`);
    }

    const feedFollowEntries = await getFeedFollowEntriesByUserId(user.id);
    const feedIds = feedFollowEntries.map(entry => entry.feedId);

    const feeds = await getFeeds();
    const followingFeeds = feeds.filter(feed => feedIds.includes(feed.id));

    console.log(`User ${user.name} is following ${followingFeeds.length} feeds:`);
    followingFeeds.forEach(feed => {
        console.log(`* ${feed.name} (${feed.url})`);
    });
}