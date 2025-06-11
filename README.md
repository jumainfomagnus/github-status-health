# GitHub Status Health

A Node Express server app that serves GitHub status RSS feeds to a client web page using EJS.

## Features

- Fetches GitHub status from official RSS feed
- Displays status information on a clean, responsive web interface
- Color-coded status indicators for different system states
- Auto-refreshes to show the latest status (every 5 minutes)
- Caching mechanism to prevent excessive requests
- Error handling for network issues and feed parsing errors

## Project Structure

```
/
├── package.json         # Project dependencies and scripts
├── .gitignore           # Git ignore file
├── src/
│   ├── rssReader.js     # RSS feed fetching and parsing module
│   ├── rssServer.js     # Express server setup
│   └── views/
│       └── status.ejs   # EJS template for status page
└── tests/
    ├── unit/
    │   └── rssReader.test.js    # Unit tests for RSS reader
    ├── integration/
    │   └── server.test.js       # Integration tests for server
    └── mocks/
        └── rss-feed-data.js     # Mock RSS data for testing
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/jumainfomagnus/github-status-health.git
   cd github-status-health
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory (optional):
   ```
   PORT=3000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to http://localhost:3000/status

## Screenshots

(Screenshots will be added once the application is deployed)

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reloading
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **EJS** - Embedded JavaScript templates
- **Axios** - HTTP client for making requests
- **xml2js** - XML to JavaScript object parser
- **Bootstrap** - Frontend CSS framework
- **Jest** - Testing framework

## API Endpoints

- `GET /status` - Main status page (HTML)
- `GET /api/status` - Raw status data (JSON)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.