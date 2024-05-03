const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.get('/v1/', async (req, res) => {

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

  const json = {
    name,
    description,
    "author": "greyjayplugins.gitlab.io",
    "authorUrl": "https://greyjayplugins.gitlab.io",
    platformUrl,
    "sourceUrl": "https://greyjayplugins.gitlab.io/Archworks/PeerTubeConfig.json",
    "repositoryUrl": "https://greyjayplugins.gitlab.io",
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
