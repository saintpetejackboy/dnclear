# dnclear

This project is an API for managing a Do Not Call (DNC) list using Express and Redis. The API provides endpoints to add, check, remove, and list phone numbers in the DNC list.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/saintpetejackboy/dnclear.git
    cd dnclear
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Ensure you have Redis installed and running on your machine. You can download it from [here](https://redis.io/download).

## Configuration

- The server runs on port `3131` by default.
- The API token used for authentication is defined as `secret_key` in the code. You can change this to any value you prefer.

## Usage

1. Start the server:
    ```bash
    npm start
    ```

2. The server will be running at `http://localhost:3131`.

## Endpoints

### Add a phone number to the DNC list

- **URL:** `/dnc/add`
- **Method:** `POST`
- **Headers:** `x-api-key: {apiToken}`
- **Body:** `{"phone_number": "1234567890"}`
- **Success Response:**
    - **Code:** 200
    - **Content:** `{"phone_number": "1234567890"}`
- **Error Responses:**
    - **Code:** 400
    - **Content:** `{"error": "Phone number is required"}`
    - **Code:** 409
    - **Content:** `{"error": "Phone number already exists"}`

### Check if a phone number is in the DNC list

- **URL:** `/dnc/check`
- **Method:** `GET`
- **Headers:** `x-api-key: {apiToken}`
- **Query Params:** `phone_number=1234567890`
- **Success Response:**
    - **Code:** 200
    - **Content:** `{"phone_number": "1234567890", "in_dnc_list": true}`
- **Error Responses:**
    - **Code:** 400
    - **Content:** `{"error": "Phone number is required"}`

### Remove a phone number from the DNC list

- **URL:** `/dnc/remove`
- **Method:** `DELETE`
- **Headers:** `x-api-key: {apiToken}`
- **Body:** `{"phone_number": "1234567890"}`
- **Success Response:**
    - **Code:** 200
    - **Content:** `{"message": "Phone number removed", "phone_number": "1234567890"}`
- **Error Responses:**
    - **Code:** 400
    - **Content:** `{"error": "Phone number is required"}`
    - **Code:** 404
    - **Content:** `{"error": "Phone number not found"}`

### List all phone numbers in the DNC list

- **URL:** `/dnc`
- **Method:** `GET`
- **Headers:** `x-api-key: {apiToken}`
- **Success Response:**
    - **Code:** 200
    - **Content:** `{"phone_numbers": ["1234567890", "0987654321"]}`

## Error Handling

Common error responses include:
- **Code:** 403
  - **Content:** `{"error": "Forbidden"}`
- **Code:** 500
  - **Content:** `{"error": "Redis client is not connected"}`

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
