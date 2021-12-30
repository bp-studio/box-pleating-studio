
// Definition for Workbox 5.0 as global object

import * as backgroundSync from 'workbox-background-sync';
import * as broadcastUpdate from 'workbox-broadcast-update';
import * as cacheableResponse from 'workbox-cacheable-response';
import * as core from 'workbox-core';
import * as expiration from 'workbox-expiration';
import * as googleAnalytics from 'workbox-google-analytics';
import * as navigationPreload from 'workbox-navigation-preload';
import * as precaching from 'workbox-precaching';
import * as rangeRequests from 'workbox-range-requests';
import * as routing from 'workbox-routing';
import * as strategies from 'workbox-strategies';
import * as streams from 'workbox-streams';

export {
	backgroundSync, broadcastUpdate, cacheableResponse, core,
	expiration, googleAnalytics, navigationPreload, precaching,
	rangeRequests, routing, strategies, streams
};
export as namespace workbox;
