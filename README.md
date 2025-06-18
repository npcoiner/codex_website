# RSS Reader Example

This project provides a very small Express server and a static React front end for reading RSS feeds.  Users can sign up or log in in the browser (information is stored in `localStorage`) and maintain a personal list of RSS feed URLs.  When signed in, the application fetches all feeds in the list and displays the combined posts.  If any of the feeds fail to load, the error is shown while posts from the other feeds remain visible.

When no user is logged in a default feed is used.

## Getting Started

1. Install dependencies for the server
   ```bash
   cd server
   npm install
   ```
2. Start the server
   ```bash
   npm start
   ```
3. Open `client/index.html` in your browser.

The default RSS feed can be configured with the `RSS_URL` environment variable.
