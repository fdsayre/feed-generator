import { AtpAgent, AppBskyFeedGetAuthorFeed } from '@atproto/api';

// Define the structure of FeedPost based on FeedViewPost
interface FeedPost {
    uri: string;
    cid: string;
    record: {
        text: string;
    };
    author: {
        handle: string;
    };
}

// Extend AppBskyFeedGetAuthorFeed.Post for the record type
interface PostRecord {
    text: string;
}

export const createCustomFeed = async (client: AtpAgent): Promise<FeedPost[]> => {
    const session = client.session;
    if (!session) {
        throw new Error("Session is not initialized. Please log in first.");
    }

    const actor = session.did;

    // Fetch the current user's follows
    const followsResponse = await client.api.app.bsky.graph.getFollows({ actor });
    const follows = followsResponse.data.follows || [];

    // Collect follower stats
    const stats = await Promise.all(
        follows.map(async (followee) => {
            const followersResponse = await client.api.app.bsky.graph.getFollowers({
                actor: followee.did,
            });
            const followers = followersResponse.data.followers || [];
            const mutualFollowers = followers.filter((f) =>
                follows.some((f2) => f2.did === f.did)
            );
            return {
                handle: followee.handle,
                mutuals: mutualFollowers.length,
                totalFollowers: followers.length,
            };
        })
    );

    // Filter for bottom quartile of total followers
    const sortedByFollowers = stats.sort((a, b) => a.totalFollowers - b.totalFollowers);
    const followerThreshold = Math.ceil(sortedByFollowers.length * 0.25);
    const bottomQuartile = sortedByFollowers.slice(0, followerThreshold);

    // Filter for top quartile of mutual followers
    const sortedByMutuals = bottomQuartile.sort((a, b) => b.mutuals - a.mutuals);
    const mutualsThreshold = Math.ceil(sortedByMutuals.length * 0.25);
    const topMutuals = sortedByMutuals.slice(0, mutualsThreshold);

    // Fetch posts by these users
    const posts: FeedPost[] = [];
    for (const user of topMutuals) {
        const timelineResponse: AppBskyFeedGetAuthorFeed.Response =
            await client.api.app.bsky.feed.getAuthorFeed({
                actor: user.handle,
            });

        // Transform FeedViewPost to FeedPost
        const feed = timelineResponse.data.feed || [];
        for (const item of feed) {
            if ("post" in item) {
                const record = item.post.record as PostRecord; // Explicitly assert the type
                posts.push({
                    uri: item.post.uri,
                    cid: item.post.cid,
                    record: {
                        text: record.text,
                    },
                    author: {
                        handle: item.post.author.handle,
                    },
                });
            }
        }
    }

    return posts;
};