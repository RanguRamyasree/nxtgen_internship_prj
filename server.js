// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/collaboration-tool', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Document Schema
const DocumentSchema = new mongoose.Schema({
  title: String,
  content: String,
  lastModified: { type: Date, default: Date.now }
});

const Document = mongoose.model('Document', DocumentSchema);

// Routes
app.post('/api/documents', async (req, res) => {
  try {
    const doc = new Document({
      title: req.body.title,
      content: req.body.content
    });
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Error creating document' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const documents = await Document.find().sort({ lastModified: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching document' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-document', (documentId) => {
    socket.join(documentId);
  });

  socket.on('send-changes', (delta, documentId) => {
    socket.broadcast.to(documentId).emit('receive-changes', delta);
  });

  socket.on('save-document', async (data) => {
    try {
      await Document.findByIdAndUpdate(data.documentId, { content: data.content });
    } catch (error) {
      console.error('Error saving document:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
