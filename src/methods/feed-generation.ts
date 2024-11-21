// // import { AppContext } from '../config';
// // import { createCustomFeed } from '../feeds'; // Import custom feed logic
// // import { Server } from '../lexicon';
// // import AtpAgent from '@atproto/api';

// // export default function feedGeneration(server: Server, ctx: AppContext) {
// //     server.xrpc.method('app.bsky.feed.getFeedSkeleton', async ({ params }) => {
// //         // Initialize ATP Agent
// //         const client = new AtpAgent({ service: 'https://bsky.social' });
// //         await client.login({
// //             identifier: ctx.cfg.blueskyHandle!,
// //             password: ctx.cfg.blueskyPassword!,
// //         });

// //         // Generate the custom feed
// //         const posts = await createCustomFeed(client);

// //         // Return the feed skeleton in the correct format
// //         return {
// //             encoding: 'application/json',
// //             body: {
// //                 feed: posts.map((post) => ({
// //                     post: post.uri,
// //                 })),
// //             },
// //         };
// //     });
// // }

// import { AppContext } from '../config';
// import { createCustomFeed } from '../feeds'; // Import custom feed logic
// import { Server } from '../lexicon';
// import AtpAgent from '@atproto/api';

// export default function feedGeneration(server: Server, ctx: AppContext) {
//     server.xrpc.method('app.bsky.feed.getFeedSkeleton', async ({ params }) => {
//         // Validate the `feed` parameter
//         const expectedFeedId = 'feed:example:custom'; // Replace with your actual feed ID
//         if (params.feed !== expectedFeedId) {
//             throw new Error(`Unsupported feed identifier: ${params.feed}`);
//         }

//         // Initialize ATP Agent
//         const client = new AtpAgent({ service: 'https://bsky.social' });
//         await client.login({
//             identifier: ctx.cfg.blueskyHandle!,
//             password: ctx.cfg.blueskyPassword!,
//         });

//         // Generate the custom feed
//         const posts = await createCustomFeed(client);

//         // Return the feed skeleton in the correct format
//         return {
//             encoding: 'application/json',
//             body: {
//                 feed: posts.map((post) => ({
//                     post: post.uri,
//                 })),
//             },
//         };
//     });
// }

import { AppContext } from '../config';
import { createCustomFeed } from '../feeds'; // Import custom feed logic
import { Server } from '../lexicon';
import AtpAgent from '@atproto/api';

export default function feedGeneration(server: Server, ctx: AppContext) {
    server.xrpc.method('app.bsky.feed.getFeedSkeleton', async ({ params }) => {
        // Define the expected feed identifier as a valid AT URI
        const expectedFeedId = `at://${ctx.cfg.serviceDid}/app.bsky.feed.generator/custom`;

        // Validate the `feed` parameter
        if (params.feed !== expectedFeedId) {
            throw new Error(`feed must be a valid at-uri: expected ${expectedFeedId}`);
        }

        // Initialize ATP Agent
        const client = new AtpAgent({ service: 'https://bsky.social' });
        await client.login({
            identifier: ctx.cfg.blueskyHandle!,
            password: ctx.cfg.blueskyPassword!,
        });

        // Generate the custom feed
        const posts = await createCustomFeed(client);

        // Return the feed skeleton in the correct format
        return {
            encoding: 'application/json',
            body: {
                feed: posts.map((post) => ({
                    post: post.uri,
                })),
            },
        };
    });
}