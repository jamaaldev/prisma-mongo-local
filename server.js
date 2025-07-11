const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// === REST API ===

app.get('/api/db-check', async (req, res) => {
  try {
    // Try to find the first post (or use any model from your Prisma schema)
    await prisma.post.findFirst();
    res.json({ status: '✅ MongoDB connected and working via Prisma' });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    res.status(500).json({ error: 'MongoDB not connected', details: error.message });
  }
});



app.post('/api/posts', async (req, res) => {
  const { title, body } = req.body;
    console.log('Received POST data:', req.body); // 👈 This should now log the request body

  try {
    const post = await prisma.post.create({ data: { title, body } });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany();
    res.json(posts.map(post => ({ ...post, id: post.id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;
    console.log('Update POST data:', req.body,req.params.id); // 👈 This should now log the request body

  try {
    const updated = await prisma.post.update({
      where: { id },
      data: { title, body },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.post.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Express 5-safe fallback route for SPA
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  // Connect to MongoDB explicitly
prisma.$connect()
  .then(() => {
    console.log('✅ MongoDB connected via Prisma');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

});
