import { Database } from './db'
import { DidResolver } from '@atproto/identity'

export type AppContext = {
  db: Database
  didResolver: DidResolver
  cfg: Config
}

export type Config = {
  port: number
  listenhost: string
  hostname: string
  sqliteLocation: string
  subscriptionEndpoint: string
  serviceDid: string
  publisherDid: string
  subscriptionReconnectDelay: number
  blueskyHandle: string; // Add this
  blueskyPassword: string; // Add this
}

// export interface Config {
//   port: number;
//   hostname: string;
//   sqliteLocation: string;
//   subscriptionEndpoint: string;
//   blueskyHandle: string; // Add this
//   blueskyPassword: string; // Add this
// }