const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
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
	app.listen(5000, () => console.log('Server running on port 5000'));
}

startServer();