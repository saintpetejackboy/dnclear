# dnclear

**dnclear** is a high-performance API for managing Do Not Call (DNC) lists using Express, Redis, Node.js, and PM2. This application provides a robust solution for adding, checking, removing, and listing phone numbers in a DNC list, with seamless integration capabilities for services like Go High Level (GHL).

<p align="center">
  <img src="img/DNClear.png" alt="DNClear Image">
</p>

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Go High Level (GHL) Integration](#go-high-level-ghl-integration)
- [Process Management with PM2](#process-management-with-pm2)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Features

- Add, check, remove, and list phone numbers in the DNC list
- High-performance data storage and retrieval using Redis with paging
- Asynchronous processing for efficient handling of concurrent requests
- Secure API authentication
- Integration with Go High Level (GHL) webhooks
- Robust error handling and logging
- Easy deployment and management using 
- CSV Export / Dump

## Tech Stack

- **Node.js**: A JavaScript runtime for server-side scripting
- **Express.js**: A minimal and flexible Node.js web application framework
- **Redis**: An in-memory data structure store for high-speed data operations
- **PM2**: A production process manager for Node.js applications

## Packages

- **dotenv**: For managing environment variables
- **csv-writer**: A library for creating CSV files
- **body-parser**: Middleware for parsing incoming request bodies

### Node.js Core Modules

- **fs**: File System module for file operations
- **path**: Module for handling file paths
- **os**: Operating System module for OS-related operations

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

3. Ensure Redis is installed and running on your machine. Download it from [here](https://redis.io/download) if needed.

## Configuration

1. Create a `.env` file in the specified directory (default: `/var/www/envfiles/dnclear.env`):
   ```dotenv
   SECRET_KEY=your_secret_key_here
   REDIS_URL=redis://127.0.0.1:6379
   ```

2. Customize the environment file path and name by setting `ENV_PATH` and `ENV_FILENAME` environment variables if needed.

## Usage

Start the server:
```bash
npm start
```

The server will run at `http://localhost:3131` by default.

## API Endpoints

### Add a phone number
- **POST** `/dnc/add`
- Body: `{"phone_number": "1234567890"}`

### Check a phone number
- **GET** `/dnc/check?phone_number=1234567890`

### Remove a phone number
- **DELETE** `/dnc/remove`
- Body: `{"phone_number": "1234567890"}`

### List all phone numbers
- **GET** `/dnc?page=1&limit=100`

### Dump Redis data to CSV
- **GET** `/dump-csv`
- Generates a CSV file containing all phone numbers stored in Redis
- The file is automatically downloaded and then deleted from the server
- No authentication required

This endpoint allows you to export all phone numbers from your DNC list into a CSV file. It's useful for backup purposes or for analyzing your DNC data offline. The process is as follows:

1. The endpoint scans all keys in Redis.
2. It creates a temporary CSV file with a single column for phone numbers.
3. All phone numbers are sanitized and written to the CSV file.
4. The file is sent to the client for download.
5. After the download is complete, the file is automatically deleted from the server.

Note: Depending on the size of your DNC list, this operation might take some time to complete. For very large datasets, consider implementing pagination or using a background job for CSV generation.

#### All endpoints require the `x-api-key` header for authentication.

## Go High Level (GHL) Integration

**dnclear** provides a webhook endpoint for integration with GHL automations:

- **POST** `/dnc/webhook/ghl`
- Body: `{"phone": "1234567890"}`

Configure your GHL workflow to send a POST request to this endpoint when contacts meet your DNC conditions.

## Process Management with PM2

To ensure high availability and easy management, use PM2:

1. Install PM2 globally:
   ```bash
   npm install pm2 -g
   ```

2. Start dnclear with PM2:
   ```bash
   pm2 start dnclear.js --name dnclear
   ```

3. Monitor the application:
   ```bash
   pm2 monit
   ```

4. Set PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Error Handling

**dnclear** implements centralized error handling to provide consistent error responses across the application. Here are some key aspects of the error handling:

- **400 Bad Request**: Returned when required data (like a phone number) is missing.
- **403 Forbidden**: Returned for invalid API keys.
- **404 Not Found**: Returned when trying to remove a non-existent phone number.
- **409 Conflict**: Returned when trying to add a phone number that already exists in the DNC list.
- **500 Internal Server Error**: Returned for unexpected server errors.

### Special Handling for GHL Webhook

The GHL webhook endpoint (`/dnc/webhook/ghl`) has a unique error handling approach:

- If the phone number already exists in the DNC list, it returns a 200 OK status with a message indicating the number already exists. This ensures that the third-party service (GHL) doesn't interpret this as an error, allowing their workflows to continue smoothly.
- This approach prevents unnecessary alerts or retries from the GHL system while still accurately managing the DNC list.

Example response for an existing number:
```json
{
  "message": "Phone number already exists"
}
```

This error handling strategy ensures robust operation of the DNC list while providing seamless integration with GHL so the contacts do not become "stuck" in a workflow.

## Redis Storage Limits and Performance

When using Redis to store 10-digit phone numbers, both storage capacity and retrieval performance are critical considerations. Here are the expectations based on different RAM limits:

- **256MB RAM**: Approximately 4.47 million phone numbers
- **500MB RAM**: Approximately 8.73 million phone numbers
- **1GB RAM**: Approximately 17.90 million phone numbers

### Performance Expectations

Redis is known for its high performance and low latency. Regardless of the number of phone numbers stored, you can expect:

- **Average Retrieval Time**: Less than 1 millisecond per request
- **Load Handling**: Tens of thousands of requests per second under optimal conditions

These performance metrics make Redis an excellent choice for managing large volumes of phone numbers with quick and efficient data retrieval.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## License

This project is licensed under the MIT License.

