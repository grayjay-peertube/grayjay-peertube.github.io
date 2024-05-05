const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });


const core = require('./core');

const express = require('express');

const app = express();

const publicFolder = path.join(__dirname, 'public');

// Serve static files from the 'public' directory
app.use(express.static(publicFolder));

// Define a route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicFolder, 'index.html')); // Assuming index.html is in the 'public' directory
});

// Define your endpoint
app.get('/js/config.js', (req, res) => {
  // Get the base URL of the server

  const protocol = req.protocol;
  const hostname = req.hostname;


  const baseUrl = core.GetHostUrl(protocol, hostname);

  // Your dynamic JavaScript content
  const dynamicScript = `
  const apibaseUrl = '${baseUrl}/api/v1/pluginConfig.json?peerTubePlatformUrl=';
  const peerTubeInstancesBaseUrl = 'https://instances.joinpeertube.org/api/v1/instances?start=0&count=100&healthy=true&customizations=3&sort=-customizations&randomSortSeed=1714740'
  `;

  // Set the response content type to JavaScript
  res.setHeader('Content-Type', 'application/javascript');

  // Send the dynamic JavaScript content as response
  res.send(dynamicScript);
});


app.get('/api/v1/generateQR', async (req, res) => {
  try {


    const { peerTubePlatformUrl } = req.query;

    await core.validatePeerTubeInstance(peerTubePlatformUrl);

    const protocol = req.protocol;
    const hostname = req.hostname;


    var hostUrl = core.GetHostUrl(protocol, hostname);

    const sourceUrl = core.GetConfigUrl(peerTubePlatformUrl, hostUrl);

    const qrCodeImage = await core.GetQRCode(sourceUrl);
    res.set('Content-Type', 'image/png'); // Set the correct MIME type
    res.send(qrCodeImage); // Send image directly
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).send('Invalid PeerTube instance');
  }
});

app.get('/api/v1/PluginConfig.json', async (req, res) => {
  try {
    const { peerTubePlatformUrl } = req.query;
    const protocol = req.protocol;
    const hostname = req.hostname;
    const pluginConfig = await core.getPluginConfig(peerTubePlatformUrl, protocol, hostname);
    res.json(pluginConfig);
  } catch (error) {
    console.error('Error generating plugin config:', error.message);
    res.status(400).json({ error: error.message });
  }
});


const port = process.env.PORT || 80;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
