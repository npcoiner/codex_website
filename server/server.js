const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');

const app = express();
const parser = new Parser();
app.use(cors());
app.use(express.json());

const DEFAULT_URL = process.env.RSS_URL || 'https://rss.arxiv.org/rss/cs';

app.get('/config.js', (req, res) => {
  res.type('application/javascript').send(`window.DEFAULT_FEED=${JSON.stringify(DEFAULT_URL)};`);
});

app.get('/api/feed', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch feed (${response.status})` });
    }
    const feed = await parser.parseURL(url);
    res.json(feed.items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static('../client'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
