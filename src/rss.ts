import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  const xmlData = await response.text();

  const parser = new XMLParser({
    processEntities: false,
  });

  const parsed = parser.parse(xmlData);

  if (!parsed || !parsed.rss || !parsed.rss.channel) {
    throw new Error("Invalid RSS feed structure");
  }

  const channelData = parsed.rss.channel;

  if (!channelData.title || !channelData.link || !channelData.description) {
    throw new Error("Missing required channel metadata");
  }

  const rawItems = channelData.item;
  let itemsArray: any[] = [];

  if (Array.isArray(rawItems)) {
    itemsArray = rawItems;
  } else if (rawItems && typeof rawItems === "object") {
    itemsArray = [rawItems];
  }

  const items: RSSItem[] = [];

  for (const item of itemsArray) {
    if (item.title && item.link && item.description && item.pubDate) {
      items.push({
        title: String(item.title),
        link: String(item.link),
        description: String(item.description),
        pubDate: String(item.pubDate),
      });
    }
  }

  return {
    channel: {
      title: String(channelData.title),
      link: String(channelData.link),
      description: String(channelData.description),
      item: items,
    },
  };
}
