<?php
// Set CORS headers
header('Access-Control-Allow-Origin: *'); // You can specify allowed origins here
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit;
}

// Discord Webhook URL (not included here)
$webhook_url = __DISCORD_WEBHOOK__;

// Verify request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Only POST requests are allowed.']);
    exit;
}

// Prepare multipart/form-data fields
$post_fields = [];

// Process text fields
foreach ($_POST as $key => $value) {
    $post_fields[$key] = $value;
}

// Process file uploads
if (!empty($_FILES)) {
    foreach ($_FILES as $key => $file) {
        if (is_array($file['tmp_name'])) {
            // Multiple files uploaded with the same field name
            foreach ($file['tmp_name'] as $index => $tmp_name) {
                if (is_uploaded_file($tmp_name)) {
                    $post_fields[$key . "[$index]"] = new CURLFile(
                        $tmp_name,
                        $file['type'][$index],
                        $file['name'][$index]
                    );
                }
            }
        } else {
            // Single file upload
            if (is_uploaded_file($file['tmp_name'])) {
                $post_fields[$key] = new CURLFile(
                    $file['tmp_name'],
                    $file['type'],
                    $file['name']
                );
            }
        }
    }
}

// Forward the request using cURL
$ch = curl_init($webhook_url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($response === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Failed to forward the request.', 'details' => curl_error($ch)]);
} else {
    http_response_code($http_code);
    echo $response;
}

curl_close($ch);
?>
