const express = require('express');
const config = require('./config/env');
const leadRoutes = require('./routes/leadRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/', leadRoutes); // This mounts '/webhook'

// Start Server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Waiting for leads...`);
});
