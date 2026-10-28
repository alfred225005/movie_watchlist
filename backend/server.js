require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const movieRoutes = require('./routes/movieRoutes');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
  ]
}));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Movie Watchlist API is running', data: null }));
app.use('/api/movies', movieRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: 'API endpoint not found.', data: null }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError' || err.name === 'CastError' || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, message: 'Invalid request data.', data: null });
  }
  return res.status(500).json({ success: false, message: 'Something went wrong on the server.', data: null });
});

const PORT = process.env.PORT || 5000;
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI. Create backend/.env using .env.example.');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
  })
  .catch(error => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
