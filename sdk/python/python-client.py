import requests
import json

base_url = 'https://your-node-server.com/api'  # Replace with your actual base URL
# It is recommended to store your api_key somewhere more secure, please.
api_key = 'your_api_key'  # Replace with your actual API key

def make_dnc_request(endpoint, method, data=None):
    url = f'{base_url}{endpoint}'
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }

    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=data)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, json=data)
        else:
            raise ValueError(f'Unsupported method: {method}')

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Request Error: {e}')
        return None

def dnclear_add(phone_number):
    return make_dnc_request('/add', 'POST', {'phoneNumber': phone_number})

def dnclear_webhook(phone_number):
    return make_dnc_request('/webhook/ghl', 'POST', {'phone': phone_number})

def dnclear_check(phone_number):
    return make_dnc_request('/check', 'GET', {'phoneNumber': phone_number})

def dnclear_remove(phone_number):
    return make_dnc_request('/remove', 'DELETE', {'phone_number': phone_number})

def dnclear_retrieve(page=1, limit=100):
    params = {'page': page, 'limit': limit}
    return make_dnc_request('/', 'GET', params)

def dnclear_dump_csv():
    url = f'{base_url}/dump-csv'
    headers = {'x-api-key': api_key}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f'Request Error: {e}')
        return None

def dnclear_batch_add(phone_numbers):
    return make_dnc_request('/batch-add', 'POST', {'phone_numbers': phone_numbers})

def dnclear_batch_scan(phone_numbers):
    return make_dnc_request('/batch-scan', 'POST', {'phone_numbers': phone_numbers})

# Example Usage
if __name__ == '__main__':
    # Add a phone number
    response = dnclear_add('222-222-2222')
    print(response)

    # Webhook call
    response = dnclear_webhook('333-333-3333')
    print(response)

    # Check if a phone number is in the DNC list
    response = dnclear_check('222-222-2222')
    print(response)

    # Remove a phone number
    response = dnclear_remove('222-222-2222')
    print(response)

    # Retrieve phone numbers
    response = dnclear_retrieve(1, 100)
    print(response)

    # Dump Redis data to CSV
    response = dnclear_dump_csv()
    print(response)

    # Batch add phone numbers
    response = dnclear_batch_add(['222-222-2222', '333-333-3333'])
    print(response)

    # Batch scan phone numbers
    response = dnclear_batch_scan(['222-222-2222', '333-333-3333'])
    print(response)
