<?php
/**
 * Proxy for shortening share links.
 *
 * Originally this called TinyURL, since TinyURL only allows cross-origin requests from its own origin
 * (its responses carry `Access-Control-Allow-Origin: https://tinyurl.com`).
 * However, the links created by its legacy API (`api-create.php`) now show an ad page before redirecting,
 * and its official API allows only 30 links per month for free accounts,
 * so we now use reurl.cc instead. The endpoint (and its file name) is kept unchanged
 * so that the released versions of BP Studio benefit from the change as well.
 *
 * The API key of reurl.cc is read from the environment variable `REURL_KEY` on the server.
 *
 * Usage: GET tinyurl.php?url=<share link>
 *
 * Returns the short URL as plain text with the proper CORS headers.
 * If the link cannot be shortened for whatever reason,
 * the original link is returned instead, which works just as well (only longer).
 *
 * Only share links of BP Studio are accepted,
 * so that this endpoint cannot be abused as a general URL shortener.
 */

/** Whether the given origin is `https://*.abstreamace.com`. */
function is_allowed_origin($origin) {
    return preg_match('/^https:\/\/[a-z0-9-]+\.abstreamace\.com$/i', $origin) === 1;
}

/**
 * Whether the given origin is `http://localhost` (with any port), for local development.
 * This applies to CORS only; the share links themselves always point to the official hosts.
 */
function is_localhost($origin) {
    return preg_match('/^http:\/\/localhost(:\d+)?$/i', $origin) === 1;
}

/**
 * Shorten the URL with reurl.cc.
 * Returns `[short URL, null]` on success, or `[null, reason]` on failure.
 */
function shorten($url) {
    $key = getenv('REURL_KEY');
    if (!$key) return [null, 'The API key is not set.'];

    $ch = curl_init('https://api.reurl.cc/shorten');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'reurl-api-key: ' . $key,
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['url' => $url]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    if ($response === false) return [null, "Request failed: $error"];

    $data = json_decode($response, true);
    $short = $data['short_url'] ?? '';
    if ($http_code !== 200 || ($data['res'] ?? '') !== 'success' || strpos($short, 'https://reurl.cc/') !== 0) {
        return [null, "HTTP $http_code: " . substr($response, 0, 500)];
    }
    return [$short, null];
}

/** Minimal interval (in seconds) between two failure notifications. */
const NOTIFY_INTERVAL = 600;

/**
 * Notify the failure to the Discord channel (using the same webhook as error.php).
 *
 * If reurl.cc is down, every sharing attempt fails, so we send at most one notification
 * per {@link NOTIFY_INTERVAL}, along with the number of failures skipped in between.
 */
function notify_failure($url, $reason) {
    $webhook_url = $_SERVER['DISCORD_WEBHOOK'] ?? '';
    if (!$webhook_url) return;

    // Throttle the notifications, with the state kept in a temporary file
    $state_file = sys_get_temp_dir() . '/bpstudio-shorten-failure.json';
    $fp = fopen($state_file, 'c+');
    if (!$fp) return;
    flock($fp, LOCK_EX);
    $state = json_decode(stream_get_contents($fp), true) ?: ['last' => 0, 'skipped' => 0];
    $now = time();
    $send = $now - $state['last'] >= NOTIFY_INTERVAL;
    $skipped = $state['skipped'];
    $state = $send ? ['last' => $now, 'skipped' => 0] : ['last' => $state['last'], 'skipped' => $skipped + 1];
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($state));
    flock($fp, LOCK_UN);
    fclose($fp);
    if (!$send) return;

    $content = "**Failed to shorten the share link with reurl.cc**\n"
        . "Reason: $reason\n"
        . 'URL length: ' . strlen($url);
    if ($skipped > 0) $content .= "\n($skipped more failure(s) since the last notification)";

    $ch = curl_init($webhook_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['content' => substr($content, 0, 2000)]); // Discord message limit
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_exec($ch);
}

// Set CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (is_allowed_origin($origin) || is_localhost($origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-store');

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit;
}

header('Content-Type: text/plain; charset=UTF-8');

// Verify request method is GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo 'Only GET requests are allowed.';
    exit;
}

// Verify that the URL is a share link of BP Studio
$url = $_GET['url'] ?? '';
$parts = is_string($url) ? parse_url($url) : false; // `url[]=...` gives an array
$valid = $parts !== false
    && is_allowed_origin(($parts['scheme'] ?? '') . '://' . ($parts['host'] ?? ''))
    && ($parts['path'] ?? '') === '/'
    && strpos($parts['query'] ?? '', 'project=') === 0;
if (!$valid) {
    http_response_code(400); // Bad Request
    echo 'Invalid URL.';
    exit;
}

[$short, $reason] = shorten($url);
if ($short !== null) {
    echo $short;
    exit;
}

// Fallback to the original link on any failure
echo $url;

// Notify the failure after the response is sent (when supported), so that the user doesn't need to wait
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
notify_failure($url, $reason);
?>
