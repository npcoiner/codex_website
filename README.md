# RSS Blog (MERN Example)

This is a minimal MERN stack example that loads an RSS feed and displays posts.

## Getting Started

1. Install dependencies for the server:
   ```bash
   cd server
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```
   The server attempts to connect to `MONGO_URI` (defaults to `mongodb://localhost:27017/rssblog`).
   If MongoDB is unavailable, it falls back to an in-memory store.

3. Open `client/index.html` in your browser to view the posts.

The RSS feed URL can be configured with the `RSS_URL` environment variable.
