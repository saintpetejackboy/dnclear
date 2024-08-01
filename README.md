# DNClear

**DNClear** is a high-performance API for managing Do Not Call (DNC) lists using Express, Redis, Node.js, and PM2. This application provides a robust solution for adding, checking, removing, and listing phone numbers in a DNC list, with seamless integration capabilities for services like Go High Level (GHL).

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
- [Testing](#testing)
- [SDK Implementations](#sdk-implementations)
- [Database Support](#database-support)
- [Sync Endpoint](#sync-endpoint)
- [Redis Storage Limits and Performance](#redis-storage-limits-and-performance)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/saintpetejackboy/dnclear.git
   cd dnclear
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables in `/var/www/envfiles/dnclear.env`.

4. Start the server:
   ```bash
   npm start
   ```

5. The API is now running at `http://localhost:3131`.

For more detailed instructions, see the [Installation](#installation) and [Configuration](#configuration) sections.

## Features

- Add, check, remove, and list phone numbers in the DNC list.
- High-performance data storage and retrieval using Redis with paging.
- Asynchronous processing for efficient handling of concurrent requests.
- Secure API authentication using custom middleware.
- Integration with Go High Level (GHL) webhooks.
- Robust error handling and logging.
- Easy deployment and management using PM2.
- CSV Export / Dump functionality.
- Batch adding and scanning of multiple phone numbers.
- Phone number sanitization and standardization.
- Pagination support for retrieving large datasets.
- Centralized configuration management.
- Cross-platform compatibility (Windows, macOS, Linux).
- SDK implementations in multiple languages (JavaScript, PHP, Python).
- Comprehensive unit testing setup with Jest.
- Docker support for containerized deployment (if applicable).

## Tech Stack

- **Node.js**: JavaScript runtime for server-side scripting.
- **Express.js**: Minimal and flexible Node.js web application framework.
- **Redis**: In-memory data structure store for high-speed data operations.
- **PM2**: Production process manager for Node.js applications.
- **Jest**: JavaScript testing framework focused on simplicity.
- **Supertest**: Library for testing HTTP servers.
- **Axios**: Promise-based HTTP client for the browser and Node.js (used in SDK).
- **cURL**: Command-line tool and library for transferring data with URLs (used in PHP SDK).

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

### Batch Add Phone Numbers
- **POST** `/dnc/batch-add`
- Body: `{"phone_numbers": ["1234567890", "9876543210", ...]}`

### Batch Scan Phone Numbers
- **POST** `/dnc/batch-scan`
- Body: `{"phone_numbers": ["1234567890", "9876543210", ...]}`

### Dump Redis data to CSV
- **GET** `/dump-csv`

All endpoints require the `x-api-key` header for authentication.

## Go High Level (GHL) Integration

**DNClear** provides a webhook endpoint for integration with GHL automations:

- **POST** `/dnc/webhook/ghl`
- Body: `{"phone": "1234567890"}`

Configure your GHL workflow to send a POST request to this endpoint when contacts meet your DNC conditions.

## Process Management with PM2

To ensure high availability and easy management, use PM2:

1. Install PM2 globally:
   ```bash
   npm install pm2 -g
   ```

2. Start DNClear with PM2:
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

**DNClear** implements centralized error handling to provide consistent error responses across the application. Key aspects include:

- **400 Bad Request**: Missing required data.
- **403 Forbidden**: Invalid API keys.
- **404 Not Found**: Non-existent phone number removal attempt.
- **409 Conflict**: Adding an already existing phone number.
- **500 Internal Server Error**: Unexpected server errors.

Special handling for GHL webhook ensures workflows continue smoothly by returning a 200 OK status for existing numbers.

## Testing

**DNClear** includes a comprehensive suite of unit tests using Jest and Supertest.

### Test Setup

- **Jest**: For running tests and providing assertions.
- **Supertest**: For making HTTP requests to the Express app.
- **dotenv**: For loading environment variables in the test environment.

### Test Coverage

Tests cover all main API endpoints and functionalities, including adding, checking, removing, and listing phone numbers, handling GHL webhooks, and batch operations.

### Running Tests

To run the test suite, use the following command:
```bash
npm test
```

Integrate these tests into your CI/CD pipeline to ensure that all changes pass the test suite before deployment.

## SDK Implementations

This project includes SDK implementations for multiple programming languages to facilitate easy integration with the DNClear API. You can find these implementations in the `sdk` directory:

- **JavaScript (Node.js)**: Located in `sdk/js/dnclear-client.js`
- **PHP**: Located in `sdk/php/dnclear-client.php`
- **Python**: Located in `sdk/python/python-client.py`

Each SDK provides functions corresponding to the API endpoints, simplifying integration.

## Database Support

**DNClear** supports using a database for storing phone numbers in addition to Redis. Configure the database connection using the following environment variables:

- `DB_TYPE`: Type of the database (e.g., `'mysql'`, `'postgres'`).
- `DB_HOST`: Hostname or IP address of the database server.
- `DB_PORT`: Port number of the database server.
- `DB_NAME`: Name of the database.
- `DB_USER`: Username for connecting to the database.
- `DB_PASSWORD`: Password for connecting to the database.

To use a database, set the `DB_TYPE` environment variable to the desired type and provide the necessary connection details.

### Database Schema

Ensure you have a table named `phone_numbers` with the following schema:
```sql
CREATE TABLE phone_numbers (
  phone_number VARCHAR(10) PRIMARY KEY
);
```

### Database-related Test Cases

Test cases cover adding, checking, removing, and listing phone numbers, as well as syncing data between Redis and the database.

## Sync Endpoint

A new endpoint to sync data between Redis and the database:

- **POST** `/dnc/sync`

Synchronizes phone numbers stored in Redis with the database based on the `dbType` configuration.

## Redis Storage Limits and Performance

When using Redis, both storage capacity and retrieval performance are critical:

- **256MB RAM**: Approximately 4.47 million phone numbers.
- **500MB RAM**: Approximately 8.73 million phone numbers.
- **1GB RAM**: Approximately 17.90 million phone numbers.

### Performance Expectations

Redis provides high performance and low latency, with average retrieval times of less than 1 millisecond per request and the ability to handle tens of thousands of requests per second.

## Contributing

Contributions are welcome! Fork the repository and submit a pull request with your improvements.



## License

This project is licensed under the MIT License.

---

### Discussion: Redis vs. Other Databases

When choosing between Redis and other databases for managing DNC lists, consider the following differences:

**Redis**:
- **Performance**: Extremely fast due to in-memory storage.
- **Scalability**: Can handle a large number of requests per second.
- **Data Persistence**: Limited compared to traditional databases, as it is primarily an in-memory store.
- **Use Cases**: Ideal for real-time applications, caching, and quick data retrieval.

**Relational Databases (e.g., MySQL, PostgreSQL)**:
- **Data Persistence**: Strong persistence and transactional integrity.
- **Complex Queries**: Supports complex SQL queries and joins.
- **Scalability**: Can be scaled vertically and horizontally but may require more management.
- **Use Cases**: Suitable for applications requiring complex data relationships and integrity.

**NoSQL Databases (e.g., MongoDB, Cassandra)**:
- **Flexibility**: Schema-less design allows for flexible and hierarchical data storage.
- **Scalability**: Designed for horizontal scalability and handling large datasets.
- **Use Cases**: Great for applications requiring flexible data models, like content management systems.

In summary, Redis is preferred for its speed and simplicity in handling large volumes of data with low latency. Traditional relational databases provide robust data integrity and complex querying capabilities. NoSQL databases offer flexibility and scalability for unstructured data. The choice depends on your specific use case and requirements.