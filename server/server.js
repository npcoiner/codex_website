const express = require('express');
const Parser = require('rss-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const parser = new Parser();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rssblog';
let Post;
let useMemory = false;

const postSchema = new mongoose.Schema({
  title: String,
  link: String,
  content: String,
  contentSnippet: String,
  pubDate: Date
});

async function connectMongo() {
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    Post = mongoose.model('Post', postSchema);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    useMemory = true;
    Post = [];
  }
}

connectMongo();

async function fetchPosts() {
  const feedUrl = process.env.RSS_URL || 'https://hnrss.org/frontpage';
  const feed = await parser.parseURL(feedUrl);
  const posts = feed.items.map(item => ({
    title: item.title,
    link: item.link,
    content: item.content,
    contentSnippet: item.contentSnippet,
    pubDate: item.isoDate
  }));
  if (useMemory) {
    Post.length = 0;
    Post.push(...posts);
    return posts;
  }
  await Post.deleteMany({});
  await Post.insertMany(posts);
  return posts;
}

app.get('/api/posts', async (req, res) => {
  try {
    if (useMemory) {
      if (!Post.length) {
        await fetchPosts();
      }
      return res.json(Post);
    }
    let posts = await Post.find().sort({ pubDate: -1 });
    if (!posts.length) {
      posts = await fetchPosts();
    }
    res.json(posts);
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
