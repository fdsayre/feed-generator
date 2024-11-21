import dotenv from "dotenv";
dotenv.config();
console.log("BLUESKY_HANDLE:", process.env.BLUESKY_HANDLE);
console.log("BLUESKY_PASSWORD:", process.env.BLUESKY_PASSWORD);

import { FeedGenerator } from "./server";


const main = async () => {
    const hostname = process.env.FEEDGEN_HOSTNAME || "example.com";
    const blueskyHandle = process.env.BLUESKY_HANDLE;
    const blueskyPassword = process.env.BLUESKY_PASSWORD;

    if (!blueskyHandle || !blueskyPassword) {
        console.error(
            "❌ Missing required environment variables: BLUESKY_HANDLE and BLUESKY_PASSWORD"
        );
        process.exit(1);
    }

    const server = FeedGenerator.create({
        port: parseInt(process.env.FEEDGEN_PORT || "3000", 10),
        listenhost: process.env.FEEDGEN_LISTENHOST || "localhost",
        hostname,
        sqliteLocation: process.env.FEEDGEN_SQLITE_LOCATION || ":memory:",
        subscriptionEndpoint:
            process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT || "wss://bsky.network",
        serviceDid: process.env.FEEDGEN_SERVICE_DID || `did:web:${hostname}`,
        publisherDid: process.env.FEEDGEN_PUBLISHER_DID || "did:example:alice",
        subscriptionReconnectDelay: parseInt(
            process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY || "3000",
            10
        ),
        blueskyHandle,
        blueskyPassword,
    });

    await server.start();
    console.log(
        `🤖 Running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`
    );
};

main().catch((err) => console.error("❌ Server failed to start:", err));