import events from "events";
import express from "express";
import { DidResolver, MemoryCache } from "@atproto/identity";
import { createServer } from "./lexicon";
import feedGeneration from "./methods/feed-generation";
import describeGenerator from "./methods/describe-generator";
import { createDb, Database, migrateToLatest } from "./db";
import { FirehoseSubscription } from "./subscription";
import wellKnown from "./well-known";

// Updated Config interface
export interface Config {
    port: number;
    listenhost: string;
    hostname: string; // Added hostname
    sqliteLocation: string;
    subscriptionEndpoint: string;
    serviceDid: string;
    publisherDid: string;
    subscriptionReconnectDelay: number;
    blueskyHandle: string; // Now required
    blueskyPassword: string; // Now required
}

// Updated AppContext interface
export interface AppContext {
    db: Database;
    didResolver: DidResolver;
    cfg: Config;
}

export class FeedGenerator {
    public app: express.Application;
    public db: Database;
    public firehose: FirehoseSubscription;
    public cfg: Config; // Config is public for access
    private server?: ReturnType<express.Application["listen"]>;

    constructor(app: express.Application, db: Database, firehose: FirehoseSubscription, cfg: Config) {
        this.app = app;
        this.db = db;
        this.firehose = firehose;
        this.cfg = cfg;
    }

    static create(cfg: Config): FeedGenerator {
        const app = express();
        const db = createDb(cfg.sqliteLocation);
        const firehose = new FirehoseSubscription(db, cfg.subscriptionEndpoint);

        const didCache = new MemoryCache();
        const didResolver = new DidResolver({
            plcUrl: "https://plc.directory",
            didCache,
        });

        // Ensure blueskyHandle and blueskyPassword are defined
        if (!cfg.blueskyHandle || !cfg.blueskyPassword) {
            throw new Error(
                "Missing required configuration: blueskyHandle and blueskyPassword must be provided."
            );
        }

        const server = createServer({
            validateResponse: true,
            payload: {
                jsonLimit: 100 * 1024, // 100 KB
                textLimit: 100 * 1024, // 100 KB
                blobLimit: 5 * 1024 * 1024, // 5 MB
            },
        });

        const ctx: AppContext = {
            db,
            didResolver,
            cfg, // Now guaranteed to have valid values
        };

        feedGeneration(server, ctx);
        describeGenerator(server, ctx);

        app.use(server.xrpc.router);
        app.use(wellKnown(ctx));

        return new FeedGenerator(app, db, firehose, cfg);
    }

    async start(): Promise<ReturnType<express.Application["listen"]>> {
        await migrateToLatest(this.db);
        this.firehose.run(this.cfg.subscriptionReconnectDelay);
        this.server = this.app.listen(this.cfg.port, this.cfg.listenhost);
        await events.once(this.server, "listening");
        return this.server;
    }
}