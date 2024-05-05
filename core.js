const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');

function GetHostUrl(requestProtocol, backendHostname) {
    const hostUrl = `${(process.env.PROTOCOL || requestProtocol)}://${(process.env.CONFIG_HOST || backendHostname)}`;
    return hostUrl;
}

async function GetQRCode(url) {
    const qrCodeImage = await QRCode.toBuffer(url);
    return qrCodeImage;
}

function GetConfigUrl(peerTubeInstanceUrl, backendUrl) {
    const sourceUrl = new URL(`/api/v1/PluginConfig.json?peerTubePlatformUrl=${peerTubeInstanceUrl}`, backendUrl).toString();
    return sourceUrl;
}

async function getPluginConfig(peerTubePlatformUrl, protocol, hostname) {
    await validatePeerTubeInstance(peerTubePlatformUrl);
    const instanceConfig = await axios.get(`https://${peerTubePlatformUrl}/api/v1/config/`);
    return generatePluginConfigJson(peerTubePlatformUrl, protocol, hostname, instanceConfig);
}

async function validatePeerTubeInstance(peerTubePlatformUrl) {
    const host = (peerTubePlatformUrl || '').toLocaleLowerCase();

    if (!host) {
        throw new Error('peerTubePlatformUrl query parameter is mandatory');
    }

    const platformUrl = `https://${host}`;

    try {
        new URL(platformUrl);
    } catch (error) {
        console.error('Error validating PeerTube instance:', error.message);
        throw new Error('Invalid PeerTube instance URL');
    }

    let instanceConfig = {};

    try {
        instanceConfig = await axios.get(`${platformUrl}/api/v1/config/`);
        if (!instanceConfig.data || !instanceConfig.data.instance || !instanceConfig.data.instance.name || !instanceConfig.data.instance.shortDescription) {
            throw new Error('Invalid PeerTube instance');
        }
    } catch (error) {
        console.error('Error validating PeerTube instance:', error.message);
        throw new Error('Invalid PeerTube instance');
    }
}

async function generatePluginConfigJson(peerTubePlatformUrl, protocol, hostname, instanceConfig) {

    const host = (peerTubePlatformUrl || '').toLocaleLowerCase();
    const platformUrl = `https://${host}`;
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
    // const hostUrl = `${(process.env.PROTOCOL || protocol)}://${(process.env.CONFIG_HOST || hostname)}`;
    var hostUrl = GetHostUrl(protocol, hostname);
    // const sourceUrl = new URL(`/api/v1/PluginConfig.json?peerTubePlatformUrl=${host}`, hostUrl).toString();
    const sourceUrl = GetConfigUrl(host, hostUrl);

    return {
        name,
        description,
        "author": hostUrl,
        "authorUrl": hostUrl,
        platformUrl,
        sourceUrl,
        "repositoryUrl": upstramConfigData.data.repositoryUrl,
        scriptUrl,
        "version": upstramConfigData.data.version,
        "scriptSignature": upstramConfigData.data.scriptSignature,
        "scriptPublicKey": upstramConfigData.data.scriptPublicKey,
        "iconUrl": new URL("./peertube.png", hostUrl).toString(),
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

}

var staticAuth = (req, res, next) => {

    const authorization = req.header["Authorization"] || req.query["Authorization"];

    if (authorization != process.env.STATIC_AUTORIZATION) {
        next();
    }

    return res.status(404);
}



module.exports = {
    GetHostUrl,
    GetConfigUrl,
    getPluginConfig,
    GetQRCode,
    validatePeerTubeInstance
}