import { XMLParser } from "fast-xml-parser";
import { parse } from "path";
import { createFeed, getFeeds, getUserById, createFeedFollowEntry, getFeedByUrl, getFeedFollowEntriesByUserId, deleteFeedFollowEntry, markFeedFetched, getNextFeedToFetch, createPost, getPostsForUser } from "src/lib/db/queries";
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

const parseDuration = (durationStr: string): number => {
    console.log(`Parsing duration string: ${durationStr}`);
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if (!match) {
        throw new Error(`Invalid duration format: ${durationStr}`);
    }
    const [, value, unit] = match;
    const num = parseInt(value, 10);
    switch (unit) {
        case "ms":
            return num;
        case "s":
            return num * 1000;
        case "m":
            return num * 60 * 1000;
        case "h":
            return num * 60 * 60 * 1000;
        default:
            throw new Error(`Unknown duration unit: ${unit}`);
    }
};

const handleError = (error: any) => {
    console.error("Error in RSS feed scraper:", error);
}

export const getRssFeed = async (_cmd: string, _user: User, time_between_reqs: string): Promise<void> => {

    let timeBetweenRequests = parseDuration(time_between_reqs.toString());

    console.log(`Starting RSS feed scraper with interval ${timeBetweenRequests} ms...`);

    scrapeFeeds().catch(handleError);

    const interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
    }, timeBetweenRequests);
}

async function scrapeFeeds() {
    let feed = await getNextFeedToFetch();
    let url = feed?.url;
    if (!url) {
        console.log("No feeds to fetch");
        return;
    }

    markFeedFetched(feed.id);

    const xml = await fetchFeed(url);
    const parsedFeed = parseFeed(xml);

    // store posts in db
    for (let item of parsedFeed.channel.item) {
        await createPost(item.title, item.link, feed.id, new Date(item.pubDate), item.description);
    }

    console.log("Feed title:", parsedFeed.channel.title, 'feed url:', url);
}

export const addFeed = async (_cmd: string, user: User, name: string, url: string): Promise<void> => {
    if (!name || !url) {
        throw new Error("URL argument required");
    }

    const feed = await createFeed(name, url, user.id)
    if (!feed) {
        throw new Error("Failed to create feed");
    }

    createFeedFollowEntry(user.id, feed.id);

    try {
        const xml = await fetchFeed(url);
        const feed = parseFeed(xml);
        console.log("Feed title:", feed.channel.title), 'username:', user.name, 'feed name:', name, 'feed url:', url;
    } catch (error) {
        console.error("Error adding RSS feed:", error);
    }
}

export async function getAllFeeds(_: string, user: User) {
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

export const createFollow = async (_cmd: string, user: User, url: string): Promise<void> => {
    if (!url) {
        throw new Error("URL argument required");
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

export const fetchFollowingFeeds = async (_cmd: string, user: User): Promise<void> => {
    const feedFollowEntries = await getFeedFollowEntriesByUserId(user.id);
    const feedIds = feedFollowEntries.map(entry => entry.feedId);

    const feeds = await getFeeds();
    const followingFeeds = feeds.filter(feed => feedIds.includes(feed.id));

    console.log(`User ${user.name} is following ${followingFeeds.length} feeds:`);
    followingFeeds.forEach(feed => {
        console.log(`* ${feed.name} (${feed.url})`);
    });
}

export const unfollowFeed = async (_cmd: string, user: User, url: string): Promise<void> => {
    if (!url) {
        throw new Error("URL argument required");
    }

    const feed = await getFeedByUrl(url);
    if (!feed) {
        throw new Error(`Feed with URL ${url} not found`);
    }

    await deleteFeedFollowEntry(user.id, feed.id);

    console.log(`User ${user.name} has unfollowed feed ${feed.name}`);
}

export const markFeedAsFetched = async (_cmd: string, _user: User, url: string): Promise<void> => {
    if (!url) {
        throw new Error("URL argument required");
    }

    const feed = await getFeedByUrl(url);
    if (!feed) {
        throw new Error(`Feed with URL ${url} not found`);
    }

    await markFeedFetched(feed.id);

    console.log(`Marked feed ${feed.name} as fetched`);
}


export async function handleBrowse(_cmd: string, user: User) {
    const posts = await getPostsForUser(user.id);

    if (posts.length === 0) {
        console.log("No posts found for followed feeds");
        return;
    }

    console.log(`Found ${posts.length} posts from followed feeds:\n`);
    posts.forEach(post => {
        console.log(`* ${post.title} (${post.url}) - published at ${post.publishedAt}`);
        console.log(`  Description: ${post.description}`);
        console.log(`  Feed ID: ${post.feed_id}`);
        console.log(`  Post ID: ${post.id}`);
        console.log(`  Created at: ${post.createdAt}`);
        console.log(`  Updated at: ${post.updatedAt}`);
        console.log(`-------------------------------------`);
    });
}