require('dotenv').config()

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const app = express();

var staticAuth = (req, res, next) => {

  // const authorization = req.header["Authorization"] || req.query["Authorization"];

  // if (authorization != process.env.STATIC_AUTORIZATION) {
  //   return res.status(404);
  // }

  next();
}

// Define a route to serve index.html
app.get('/', staticAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Assuming index.html is in the 'public' directory
});

// Define your endpoint
app.get('/config.js', (req, res) => {
  // Get the base URL of the server
  const baseUrl = req.protocol + '://' + req.get('host');

  // Your dynamic JavaScript content
  const dynamicScript = `
  const apibaseUrl = '${baseUrl}/api/v1';
  const peerTubeInstancesBaseUrl = 'https://instances.joinpeertube.org/api/v1/instances?start=0&count=100&healthy=true&customizations=3&sort=-customizations&randomSortSeed=1714740'
  `;

  // Set the response content type to JavaScript
  res.setHeader('Content-Type', 'application/javascript');

  // Send the dynamic JavaScript content as response
  res.send(dynamicScript);
});

app.get('/api/v1/:platformUrl/pluginConfig.json', async (req, res) => {

  let host = (req.params.platformUrl || '').toLocaleLowerCase();

  if (!host) {
    return res.status(400).json({ error: 'platformUrl query parameter is mandatory' });
  }

  var platformUrl = `https://${host}`;

  try {
    let platformUrlUrl = new URL(platformUrl);
  } catch (error) {
    console.error('Error validating PeerTube instance:', error.message);
    return res.status(400).json({ error: 'Invalid PeerTube instance URL' });
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
    .update(host)
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
  const sourceUrl = new URL(`/api/v1/${host}/pluginConfig.json`, hostUrl).toString();

  // var request = req.

  const json = {
    "name": "Archworks",
    "description": "A plugin that adds PeerTube as a source",
    "author": "FUTO",
    "authorUrl": "https://greyjayplugins.gitlab.io",
    "platformUrl": "https://tube.archworks.co",
    "sourceUrl": "https://greyjayplugins.gitlab.io/Archworks/PeerTubeConfig.json",
    "repositoryUrl": "https://greyjayplugins.gitlab.io",
    "scriptUrl": "https://greyjayplugins.gitlab.io/Archworks/PeerTubeScript.js",
    "version": 1,
    "scriptSignature": "K6OB+EucIBi4cg3lbgFJtONNXhc7l2ZbTbpHL31XgC0jBA6EHoXY88MDNwpR/cIIvw8IrMTJA3KoqOpP5H1SDkiV7q1qE9OvxvmUQ/r+J92FnCxXuqUyN6x4nW262ABqGC9Ou4YsHEE43Ko69CNNMn0zOKyrk0UAwK8BSWw0IhJ6lppW04bhL3xP2cErQNaPLY8FgndOM1jFd5afVs6xQnryoJjQhBLwtnlyNJjW+ppD4MCNMVhb7roEN4QtgO/ZZsEm2OdRme4LDDI2/ZA+EHgCHj4qlfJ6asyEfNYCnkD3H6gLAaKwzxt8GMmqcGjTDN7JVIZ/rhEVOxRToDYiew==",
    "scriptPublicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqxO0IUiv/1K1y7I9Q+p5jC9zhNv3xohb6UBaDWEQQOqQgk7KwoOiKfirOPTpGWy6qO36UASwf2ztXeAlNZhxe+JFAvXhA60VLXOCrZSYf+gakqxbho2OWom3tFnPpI3XcZH1hkezFFZ/xWiidYWFiPUaRSK+4i3s9sy3b6HafwnOPhubxguyRW7WcS8Oqc49vejlyR0ayqD3XYlsGo1hV2TyxMM+6nQrbQsjFNuI2cbYIHU69iHjeFOKHp8DyH95SdH456UNuXTsD6iQZUMx16AczQgeLeBHnhhdPElnoC8TeoNphAxKBz47THDsAsMo/s/FYpJok7M5gNWMKo8cpwIDAQAB",
    "iconUrl": "./peertube.png",
    "id": "b2a6e8d2-8b29-4d42-a9c7-5c1d8e4b53b7",
    "packages": [
      "Http"
    ],
    "allowEval": false,
    "allowUrls": [
      "everywhere"
    ],
    "constants": {
      "baseUrl": "https://tube.archworks.co"
    }
  };

  res.json(json);
});

const port = process.env.PORT || 80;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
