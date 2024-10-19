const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // Use port 3000 or the port defined in the environment

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define a root route
app.get('/', (req, res) => {
    res.send('Welcome to the Battle Bot API!');
  });

const botRoutes = require('./routes/bot');
app.use('/bot', botRoutes); // Mount the bot routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
