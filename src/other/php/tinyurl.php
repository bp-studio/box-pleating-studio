<?php
/**
 * Proxy for shortening share links with TinyURL.
 *
 * Since 2026, TinyURL only allows cross-origin requests from its own origin
 * (its responses carry `Access-Control-Allow-Origin: https://tinyurl.com`),
 * so the browser can no longer call its API directly from BP Studio.
 * This script calls the API on the server side instead, and returns the
 * short URL as plain text with the proper CORS headers.
 *
 * Usage: GET tinyurl.php?url=<share link>
 *
 * Only share links of BP Studio are accepted,
 * so that this endpoint cannot be abused as a general URL shortener.
 */

/** Whether the given origin is `https://*.abstreamace.com`. */
function is_allowed_origin($origin) {
    return preg_match('/^https:\/\/[a-z0-9-]+\.abstreamace\.com$/i', $origin) === 1;
}

// Set CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (is_allowed_origin($origin)) {
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
$parts = parse_url($url);
$valid = $parts !== false
    && is_allowed_origin(($parts['scheme'] ?? '') . '://' . ($parts['host'] ?? ''))
    && ($parts['path'] ?? '') === '/'
    && strpos($parts['query'] ?? '', 'project=') === 0;
if (!$valid) {
    http_response_code(400); // Bad Request
    echo 'Invalid URL.';
    exit;
}

// Forward the request to TinyURL using cURL
$ch = curl_init('https://tinyurl.com/api-create.php?url=' . rawurlencode($url));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $http_code !== 200 || strpos($response, 'https://tinyurl.com/') !== 0) {
    http_response_code(502); // Bad Gateway
    echo 'Failed to shorten the URL. ' . ($response === false ? $error : "HTTP $http_code");
    exit;
}

echo trim($response);
?>
