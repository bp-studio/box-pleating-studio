
// Definition for Workbox 5.0 as global object

import * as backgroundSync from 'workbox-background-sync/index';
import * as broadcastUpdate from 'workbox-broadcast-update/index';
import * as cacheableResponse from 'workbox-cacheable-response/index';
import * as core from 'workbox-core/index';
import * as expiration from 'workbox-expiration/index';
import * as googleAnalytics from 'workbox-google-analytics/index';
import * as navigationPreload from 'workbox-navigation-preload/index';
import * as precaching from 'workbox-precaching/index';
import * as rangeRequests from 'workbox-range-requests/index';
import * as routing from 'workbox-routing/index';
import * as strategies from 'workbox-strategies/index';
import * as streams from 'workbox-streams/index';

export {
	backgroundSync, broadcastUpdate, cacheableResponse, core,
	expiration, googleAnalytics, navigationPreload, precaching,
	rangeRequests, routing, strategies, streams
};
export as namespace workbox;
