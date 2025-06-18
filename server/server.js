const express = require('express');
const Parser = require('rss-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const parser = new Parser();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rssblog';
let Post;
let useMemory = false;
let memoryId = 0;
const sessions = new Set();
const USERNAME = process.env.USERNAME || 'admin';
const PASSWORD = process.env.PASSWORD || 'password';

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


async function fetchPosts() {
  const feedUrl = process.env.RSS_URL || 'https://rss.arxiv.org/rss/cs';
  const feed = await parser.parseURL(feedUrl);
  const posts = feed.items.map((item, idx) => ({
    _id: `${++memoryId}`,
    title: item.title,
    link: item.link,
    content: item.content,
    contentSnippet: item.contentSnippet,
    pubDate: item.isoDate
  }));
  if (useMemory) {
    Post.length = 0;
    Post.push(...posts);
    memoryId = posts.length;
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

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    const token = crypto.randomBytes(16).toString('hex');
    sessions.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/posts', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = {
      _id: useMemory ? `${++memoryId}` : undefined,
      title,
      link: '#',
      content,
      contentSnippet: content,
      pubDate: new Date().toISOString()
    };
    if (useMemory) {
      Post.unshift(newPost);
      return res.json(newPost);
    }
    const created = await new Post(newPost).save();
    res.json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (useMemory) {
      const post = Post.find(p => p._id === id);
      if (!post) return res.status(404).json({ error: 'Not found' });
      post.title = title;
      post.content = content;
      post.contentSnippet = content;
      return res.json(post);
    }
    const updated = await Post.findByIdAndUpdate(
      id,
      { title, content, contentSnippet: content },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (useMemory) {
      const index = Post.findIndex(p => p._id === id);
      if (index === -1) return res.status(404).json({ error: 'Not found' });
      Post.splice(index, 1);
      return res.json({});
    }
    const deleted = await Post.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static('../client'));

const PORT = process.env.PORT || 3000;
connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
