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

## About dnclear

### Cutting-Edge Technologies for Superior Performance

**dnclear** leverages a modern tech stack to deliver high performance and reliability for managing Do Not Call (DNC) lists. By utilizing **Express**, **Redis**, **Node.js**, and **PM2**, this application ensures fast, asynchronous processing and robust data handling.

#### The Tech Stack

- **Express.js**: A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. Express is the backbone of dnclear, handling routing and middleware seamlessly.
- **Redis**: An in-memory data structure store used as a database, cache, and message broker. Redis is known for its lightning-fast read and write operations, making it ideal for managing real-time data and high-performance applications.
- **Node.js**: A JavaScript runtime built on Chrome's V8 JavaScript engine, enabling server-side scripting. Node.js is known for its event-driven architecture and non-blocking I/O operations, which ensure that dnclear can handle a high volume of concurrent requests efficiently.
- **PM2**: A powerful process manager for Node.js applications that simplifies deployment, keeps your application running 24/7, and provides advanced monitoring capabilities. PM2 ensures dnclear runs smoothly in production environments by automatically restarting on crashes, balancing load across instances, and providing detailed monitoring and logging.

#### Why Redis?

Redis is a game-changer for applications requiring rapid data access and manipulation. With its in-memory storage, Redis drastically reduces latency, ensuring that dnclear can process requests in milliseconds. This speed translates to immediate responses when adding, checking, or removing phone numbers from the DNC list.

#### Asynchronous Processing

By leveraging Node.js's asynchronous capabilities, dnclear can handle multiple operations simultaneously without compromising performance. This non-blocking architecture ensures that even during peak loads, the system remains responsive and efficient.

#### Scalability and Reliability

Built with scalability in mind, dnclear can easily handle an increasing number of requests by scaling horizontally. The combination of Redis's high throughput and Node.js's asynchronous processing means that dnclear can grow with your needs, ensuring reliability and performance at scale.

#### Robust Process Management with PM2

PM2 enhances dnclear's reliability by managing application processes, handling automatic restarts on crashes, load balancing across multiple instances, and providing comprehensive monitoring tools. This ensures that dnclear remains highly available and performant, even under heavy load, making it a robust solution for DNC list management.

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

## Enhancing dnclear with PM2

### Seamless Process Management and Monitoring

To ensure dnclear runs smoothly in production environments, we recommend using **PM2**, a powerful process manager for Node.js applications. PM2 simplifies deployment, keeps your application running 24/7, and provides advanced monitoring capabilities.

#### Why PM2?

PM2 offers several advantages for managing Node.js applications:

- **Automatic Restart**: PM2 automatically restarts your application if it crashes, ensuring minimal downtime.
- **Load Balancing**: PM2 can balance the load across multiple instances of your application, optimizing performance and resource usage.
- **Monitoring and Logs**: PM2 provides detailed monitoring and logging, helping you keep track of your application's performance and quickly diagnose issues.
- **Ease of Use**: PM2's straightforward CLI makes it easy to manage your application, scale instances, and deploy updates.

### Setting Up PM2 with dnclear

Follow these steps to integrate PM2 with dnclear:

1. **Install PM2**:
    ```bash
    npm install pm2 -g
    ```

2. **Start dnclear with PM2**:
    ```bash
    pm2 start index.js --name dnclear
    ```
   Replace `index.js` with the entry point of your application if it's different.

3. **Monitor Your Application**:
    ```bash
    pm2 monit
    ```
   This command opens an interactive monitoring dashboard, showing you real-time metrics and logs.

4. **Save Your PM2 Process List**:
    ```bash
    pm2 save
    ```
   This saves the current process list, allowing PM2 to automatically resurrect your application after a system reboot.

5. **Set PM2 to Start on Boot**:
    ```bash
    pm2 startup
    ```
   Follow the on-screen instructions to configure your system to start PM2 and your applications on boot.

### Managing dnclear with PM2

PM2 makes it easy to manage your dnclear application. Here are some common commands:

- **Restart the Application**:
    ```bash
    pm2 restart dnclear
    ```

- **Stop the Application**:
    ```bash
    pm2 stop dnclear
    ```

- **View Logs**:
    ```bash
    pm2 logs dnclear
    ```

- **Scale the Application**:
    ```bash
    pm2 scale dnclear <number_of_instances>
    ```
   Replace `<number_of_instances>` with the desired number of instances.

By integrating PM2 with dnclear, you can ensure your application runs smoothly, even under heavy load, and take advantage of powerful monitoring and management features to keep everything running optimally.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
