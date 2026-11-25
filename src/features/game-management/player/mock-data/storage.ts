import { MB } from "../../lib/format";

/**
 * Mock browser-storage figures. A real build would call `navigator.storage.estimate()`; browsers decide the
 * quota and can evict cached data at any time, so these numbers are illustrative only.
 */
export const MOCK_STORAGE = {
  quotaBytes: 1536 * MB,
  /** cached data from the rest of the site (images, audio, fonts) that is not a game package */
  otherSiteBytes: 214 * MB,
};
