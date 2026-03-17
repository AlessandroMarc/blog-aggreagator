import { XMLParser } from "fast-xml-parser";
import { readConfig } from "src/config";

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

    try {
        const xml = await fetchFeed(url);
        const feed = parseFeed(xml);
        console.log("Feed title:", feed.channel.title), 'username:', userName, 'feed name:', name, 'feed url:', url;
    } catch (error) {
        console.error("Error adding RSS feed:", error);
    }
}