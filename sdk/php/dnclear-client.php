<?php
// Configuration
$base_url = 'https://your-node-server.com/api'; // Replace with your actual base URL
// It is recommended to store your API key somewhere more secure, please.
$api_key = 'your_api_key'; // Replace with your actual API key

function makeDNCRequest($endpoint, $method, $data = null) {
    global $base_url, $api_key;
    $url = $base_url . $endpoint;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'x-api-key: ' . $api_key,
        'Content-Type: application/json'
    ));

    if ($data) {
        $jsonData = json_encode($data);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    }

    $response = curl_exec($ch);

    if ($response === false) {
        $error = curl_error($ch);
        echo "cURL Error: $error";
        return false;
    } else {
        return json_decode($response, true);
    }

    curl_close($ch);
}

function dnclearAdd($phoneNumber) {
    return makeDNCRequest('/add', 'POST', array('phoneNumber' => $phoneNumber));
}

function dnclearWebhook($phoneNumber) {
    return makeDNCRequest('/webhook/ghl', 'POST', array('phone' => $phoneNumber));
}

function dnclearCheck($phoneNumber) {
    return makeDNCRequest('/check', 'GET', null);
}

function dnclearRemove($phoneNumber) {
    return makeDNCRequest('/remove', 'DELETE', array('phone_number' => $phoneNumber));
}

function dnclearRetrieve($page = 1, $limit = 100) {
    $params = http_build_query(array('page' => $page, 'limit' => $limit));
    return makeDNCRequest('/?' . $params, 'GET');
}

function dnclearDumpCsv() {
    global $base_url, $api_key;
    $url = $base_url . '/dump-csv';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'x-api-key: ' . $api_key
    ));
    $response = curl_exec($ch);

    if ($response === false) {
        $error = curl_error($ch);
        echo "cURL Error: $error";
        return false;
    } else {
        return $response;
    }

    curl_close($ch);
}

function dnclearBatchAdd($phoneNumbers) {
    return makeDNCRequest('/batch-add', 'POST', array('phone_numbers' => $phoneNumbers));
}

function dnclearBatchScan($phoneNumbers) {
    return makeDNCRequest('/batch-scan', 'POST', array('phone_numbers' => $phoneNumbers));
}
?>

<!-- Example Usage -->
<?php
// Add a phone number
$response = dnclearAdd('222-222-2222');
print_r($response);

// Webhook call
$response = dnclearWebhook('333-333-3333');
print_r($response);

// Check if a phone number is in the DNC list
$response = dnclearCheck('222-222-2222');
print_r($response);

// Remove a phone number
$response = dnclearRemove('222-222-2222');
print_r($response);

// Retrieve phone numbers
$response = dnclearRetrieve(1, 100);
print_r($response);

// Dump Redis data to CSV
$response = dnclearDumpCsv();
echo $response;

// Batch add phone numbers
$response = dnclearBatchAdd(array('222-222-2222', '333-333-3333'));
print_r($response);

// Batch scan phone numbers
$response = dnclearBatchScan(array('222-222-2222', '333-333-3333'));
print_r($response);
?>
