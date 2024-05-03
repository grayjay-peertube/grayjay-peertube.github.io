const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Define a route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Assuming index.html is in the 'public' directory
});

// Define your endpoint
app.get('/config.js', (req, res) => {
  // Get the base URL of the server
  const baseUrl = req.protocol + '://' + req.get('host');

  // Your dynamic JavaScript content
  const dynamicScript = `
  const apibaseUrl = '${baseUrl}/api/v1?platformUrl=';
  const peerTubeInstancesBaseUrl = 'https://instances.joinpeertube.org/api/v1/instances?start=0&count=100&healthy=true&customizations=3&sort=-customizations&randomSortSeed=1714740'
  `;

  // Set the response content type to JavaScript
  res.setHeader('Content-Type', 'application/javascript');

  // Send the dynamic JavaScript content as response
  res.send(dynamicScript);
});

app.get('/api/v1/', async (req, res) => {

  const platformUrl = (req.query.platformUrl || '').toLocaleLowerCase();

  if (!platformUrl) {
    return res.status(400).json({ error: 'platformUrl query parameter is mandatory' });
  }

  let platformUrlUrl = {};

  try {
    platformUrlUrl = new URL(platformUrl);
  } catch (error) {
    console.error('Error validating PeerTube instance:', error.message);
    return res.status(400).json({ error: 'Invalid PeerTube instance URL' });
  }

  if (!platformUrlUrl.protocol || platformUrlUrl.protocol != 'https:') {
    return res.status(400).json({ error: 'https protocol is required' });
  }

  let instanceConfig = {};

  // Check if the provided URL is a valid PeerTube instance
  try {
    instanceConfig = await axios.get(`${platformUrl}/api/v1/config/`);
    if (!instanceConfig.data || !instanceConfig.data.instance || !instanceConfig.data.instance.name || !instanceConfig.data.instance.shortDescription) {
      throw new Error('Invalid PeerTube instance');
    }
  } catch (error) {
    console.error('Error validating PeerTube instance:', error.message);
    return res.status(400).json({ error: 'Invalid PeerTube instance' });
  }

  const id = crypto
    .createHash('md5')
    .update(platformUrlUrl.host)
    .digest('hex')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'); // Generate UUID based on the platformUrl

  const name = instanceConfig.data.instance.name;
  const description = instanceConfig.data.instance.shortDescription;

  const pluginBaseUrl = "https://plugins.grayjay.app/PeerTube";
  const pluginConfigFileName = "PeerTubeConfig.json";

  const upstreamConfig = `${pluginBaseUrl}/${pluginConfigFileName}`;

  const upstramConfigData = await axios.get(upstreamConfig);

  const scriptUrl = new URL(upstramConfigData.data.scriptUrl, `${pluginBaseUrl}/`).toString();
  const hostUrl = `${req.protocol}://${req.hostname}`;
  const sourceUrl = new URL(`${req.path}?platformUrl=${platformUrl}`, hostUrl).toString();

  // var request = req.

  const json = {
    name,
    description,
    "author": hostUrl,
    "authorUrl": hostUrl,
    platformUrl,
    sourceUrl,
    "repositoryUrl": hostUrl,
    scriptUrl,
    "version": upstramConfigData.data.version,
    "scriptSignature": upstramConfigData.data.scriptSignature,
    "scriptPublicKey": upstramConfigData.data.scriptPublicKey,
    "iconUrl": "./peertube.png",
    id,
    "packages": [
      "Http"
    ],
    "allowEval": false,
    "allowUrls": [
      "everywhere"
    ],
    "constants": {
      "baseUrl": platformUrl
    }
  };
  res.json(json);
});

const port = process.env.PORT || 80;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
