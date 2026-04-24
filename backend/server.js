const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',           // Local development
  'http://localhost:5000',           // Local backend
  'https://ai-job-frontend-murex.vercel.app', // Production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.locals.useMemoryStore = true;
app.locals.analyses = [];

async function connectDatabase() {
	if (!process.env.MONGO_URI) {
		console.warn('MONGO_URI is not set. Using in-memory storage.');
		return;
	}

	try {
		await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
		app.locals.useMemoryStore = false;
		console.log('Connected to MongoDB');
	} catch (error) {
		console.warn('MongoDB connection failed. Using in-memory storage instead.');
		console.warn(error.message);
		app.locals.useMemoryStore = true;
	}
}

app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/results', require('./routes/results'));

async function startServer() {
	await connectDatabase();
	const PORT = process.env.PORT || 5000;
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();