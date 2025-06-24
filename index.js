const path = require('path');
const axios = require('axios');
const cors = require('cors'); // Import CORS middleware
require('dotenv').config({ path: path.join(__dirname, '.env') });

const core = require('./core');

const express = require('express');

const app = express();

const publicFolder = path.join(__dirname, 'public');

// Serve static files from the 'public' directory
app.use(express.static(publicFolder));

// Define CORS options
const corsOptions = {
  origin: '*', // Allow requests from any origin
  methods: ['GET'], // Allow only GET requests
};

// Enable CORS middleware with options
app.use(cors(corsOptions));

// Define a route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicFolder, 'index.html')); // Assuming index.html is in the 'public' directory
});

// Define your endpoint for PluginQR
app.get('/api/v1/PluginQR', async (req, res) => {
  try {
    const { peerTubePlatformUrl } = req.query;
    await core.ValidatePeerTubeInstance(peerTubePlatformUrl, axios);
    const protocol = req.protocol;
    const hostname = req.hostname;
    var hostUrl = core.GetHostUrl(protocol, hostname);
    const sourceUrl = core.GetConfigUrl(peerTubePlatformUrl, hostUrl);
    const qrCodeImage = await core.GetQRCode(sourceUrl);
    res.set('Content-Type', 'image/png'); // Set the correct MIME type
    res.send(qrCodeImage); // Send image directly
  } catch (err) {
    console.error('Error generating QR code:', err.message || err);
    res.status(500).json({ error: 'Invalid PeerTube instance' });
  }
});

// Define your endpoint for PluginConfig.json
app.get('/api/v1/PluginConfig.json', async (req, res) => {
  try {
    const { peerTubePlatformUrl } = req.query;
    const protocol = req.protocol;
    const hostname = req.hostname;
    const pluginConfig = await core.GetPluginConfig(peerTubePlatformUrl, protocol, hostname, 10000, axios);
    res.json(pluginConfig);
  } catch (error) {
    console.error('Error generating plugin config:', error.message || error);
    res.status(400).json({ error: error.message || 'Failed to generate plugin configuration' });
  }
});

// Define your endpoint for validating PeerTube instances
app.get('/api/v1/validatePeerTube', async (req, res) => {
  try {
    const { peerTubePlatformUrl } = req.query;
    await core.ValidatePeerTubeInstance(peerTubePlatformUrl, axios);
    res.json({ valid: true });
  } catch (err) {
    console.error('Error validating PeerTube instance:', err.message || err);
    res.json({ valid: false, error: err.message });
  }
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const port = process.env.PORT || 80;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
