const axios = require('axios');

const baseUrl = 'https://your-node-server.com/api'; // Replace with your actual base URL
// It is recommended to store your API key somewhere more secure, please.
const apiKey = 'your_api_key'; // Replace with your actual API key

async function makeDNCRequest(endpoint, method, data = null) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
    });

    return response.data;
  } catch (error) {
    console.error(`Request Error: ${error.message}`);
    return null;
  }
}

async function dnclearAdd(phoneNumber) {
  return makeDNCRequest('/add', 'POST', { phoneNumber });
}

async function dnclearWebhook(phoneNumber) {
  return makeDNCRequest('/webhook/ghl', 'POST', { phone: phoneNumber });
}

async function dnclearCheck(phoneNumber) {
  return makeDNCRequest('/check', 'GET', { params: { phoneNumber } });
}

async function dnclearRemove(phoneNumber) {
  return makeDNCRequest('/remove', 'DELETE', { phone_number: phoneNumber });
}

async function dnclearRetrieve(page = 1, limit = 100) {
  const params = { page, limit };
  return makeDNCRequest('/', 'GET', { params });
}

async function dnclearDumpCsv() {
  const url = `${baseUrl}/dump-csv`;
  const headers = { 'x-api-key': apiKey };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Request Error: ${error.message}`);
    return null;
  }
}

async function dnclearBatchAdd(phoneNumbers) {
  return makeDNCRequest('/batch-add', 'POST', { phone_numbers: phoneNumbers });
}

async function dnclearBatchScan(phoneNumbers) {
  return makeDNCRequest('/batch-scan', 'POST', { phone_numbers: phoneNumbers });
}

// Example Usage

(async () => {
  // Add a phone number
  let response = await dnclearAdd('222-222-2222');
  console.log(response);

  // Webhook call
  response = await dnclearWebhook('333-333-3333');
  console.log(response);

  // Check if a phone number is in the DNC list
  response = await dnclearCheck('222-222-2222');
  console.log(response);

  // Remove a phone number
  response = await dnclearRemove('222-222-2222');
  console.log(response);

  // Retrieve phone numbers
  response = await dnclearRetrieve(1, 100);
  console.log(response);

  // Dump Redis data to CSV
  response = await dnclearDumpCsv();
  console.log(response);

  // Batch add phone numbers
  response = await dnclearBatchAdd(['222-222-2222', '333-333-3333']);
  console.log(response);

  // Batch scan phone numbers
  response = await dnclearBatchScan(['222-222-2222', '333-333-3333']);
  console.log(response);
})();
