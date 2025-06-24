const crypto = require('crypto');
const QRCode = require('qrcode');

// Define a cache object to store fetched data
const cache = new Map();

/**
 * Fetches upstream config data with caching and TTL.
 * @param {string} upstreamConfigUrl - The URL to fetch the config data from.
 * @param {number} cacheTtl - Time-to-live (TTL) for caching in milliseconds.
 * @param {Object} axiosInstance - Axios instance for making HTTP requests.
 * @returns {Promise<object>} - Resolves with the fetched data.
 */
async function getUpstreamConfigData(upstreamConfigUrl, cacheTtl, axiosInstance) {
    // Check if the data is already cached and not expired
    if (cache.has(upstreamConfigUrl)) {
        const { data, timestamp } = cache.get(upstreamConfigUrl);
        if (Date.now() - timestamp <= cacheTtl) {
            return data;
        }
    }

    // Fetch the data from the upstream server
    const response = await axiosInstance.get(upstreamConfigUrl);

    // Cache the fetched data along with the current timestamp
    cache.set(upstreamConfigUrl, { data: response.data, timestamp: Date.now() });

    return response.data;
}

/**
 * Constructs the host URL based on provided parameters.
 * @param {string} requestProtocol - The request protocol.
 * @param {string} backendHostname - The backend hostname.
 * @returns {string} - The constructed host URL.
 */
function GetHostUrl(requestProtocol, backendHostname) {
    const hostUrl = `${(process.env.PROTOCOL || requestProtocol)}://${(process.env.CONFIG_HOST || backendHostname)}`;
    return hostUrl;
}

/**
 * Generates a QR code image for the given URL.
 * @param {string} url - The URL to generate the QR code for.
 * @returns {Promise<Buffer>} - Resolves with the QR code image buffer.
 */
async function GetQRCode(url) {
    const qrCodeImage = await QRCode.toBuffer(url);
    return qrCodeImage;
}

/**
 * Constructs the config URL for the PeerTube instance.
 * @param {string} peerTubeInstanceUrl - The PeerTube instance URL.
 * @param {string} backendUrl - The backend URL.
 * @returns {string} - The constructed config URL.
 */
function GetConfigUrl(peerTubeInstanceUrl, backendUrl) {
    const sourceUrl = new URL(`/api/v1/PluginConfig.json?peerTubePlatformUrl=${peerTubeInstanceUrl}`, backendUrl).toString();
    return sourceUrl;
}

/**
 * Fetches plugin configuration for the PeerTube instance.
 * @param {string} peerTubePlatformUrl - The PeerTube platform URL.
 * @param {string} protocol - The protocol.
 * @param {string} hostname - The hostname.
 * @param {number} cacheTtl - Time-to-live (TTL) for caching in milliseconds.
 * @param {Object} axiosInstance - Axios instance for making HTTP requests.
 * @returns {Promise<object>} - Resolves with the plugin configuration.
 */
async function GetPluginConfig(peerTubePlatformUrl, protocol, hostname, cacheTtl, axiosInstance) {
    // Validate PeerTube instance
    await ValidatePeerTubeInstance(peerTubePlatformUrl, axiosInstance);

    // Fetch instance config data
    const instanceConfig = await axiosInstance.get(`https://${peerTubePlatformUrl}/api/v1/config/`);

    // Generate plugin configuration JSON
    return generatePluginConfigJson(peerTubePlatformUrl, protocol, hostname, instanceConfig, cacheTtl, axiosInstance);
}

/**
 * Validates the PeerTube instance URL.
 * @param {string} peerTubePlatformUrl - The PeerTube platform URL.
 * @param {Object} axiosInstance - Axios instance for making HTTP requests.
 * @throws {Error} - Throws error if URL is invalid or instance is invalid.
 */
async function ValidatePeerTubeInstance(peerTubePlatformUrl, axiosInstance) {
    
    let host = (peerTubePlatformUrl || '').toLocaleLowerCase().trim();

    // Check if URL is provided
    if (!host) {
        throw new Error('peerTubePlatformUrl query parameter is mandatory');
    }

    // Add https scheme if missing
    if (!/^https?:\/\//.test(host)) {
        host = `https://${host}`;
    }

    try {
        // Validate URL format
        new URL(host);
    } catch (error) {
        throw new Error(`Invalid PeerTube instance URL: ${host}`);
    }

    let instanceConfig;

    try {
        // Fetch instance config
        const response = await axiosInstance.get(`${host}/api/v1/config/`);
        instanceConfig = response.data;

        // Check if instance config is valid
        if (!instanceConfig || !instanceConfig.instance || !instanceConfig.instance.name || !instanceConfig.instance.shortDescription) {
            throw new Error('Invalid PeerTube instance configuration');
        }

    } catch (error) {
        if (error.response) {
            // Axios-specific error handling
            throw new Error(`Failed to fetch PeerTube instance configuration: ${error.response.status} ${error.response.statusText}`);
        } else {
            // General error handling
            throw new Error(`Invalid PeerTube instance: ${error.message}`);
        }
    }
}

/**
 * Generates plugin configuration JSON.
 * @param {string} peerTubePlatformUrl - The PeerTube platform URL.
 * @param {string} protocol - The protocol.
 * @param {string} hostname - The hostname.
 * @param {object} instanceConfig - The instance configuration data.
 * @param {number} cacheTtl - Time-to-live (TTL) for caching in milliseconds.
 * @param {Object} axiosInstance - Axios instance for making HTTP requests.
 * @returns {object} - The generated plugin configuration JSON.
 */
async function generatePluginConfigJson(peerTubePlatformUrl, protocol, hostname, instanceConfig, cacheTtl, axiosInstance) {
    // Generate UUID based on the platformUrl
    const host = (peerTubePlatformUrl || '').toLocaleLowerCase();
    const platformUrl = `https://${host}`;
    const id = crypto
        .createHash('md5')
        .update(host)
        .digest('hex')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

    // Extract instance name and description from instanceConfig
    const name = instanceConfig.data.instance.name;
    const description = instanceConfig.data.instance.shortDescription;

    // Define plugin base URL and config file name
    const pluginBaseUrl = "https://plugins.grayjay.app/pre-release/PeerTube";
    const pluginConfigFileName = "PeerTubeConfig.json";

    // Fetch remote plugin config from stable version
    const remoteConfigUrl = `${pluginBaseUrl}/${pluginConfigFileName}`;
    
    // Fetch remote config data with caching
    const remoteConfigData = await getUpstreamConfigData(remoteConfigUrl, cacheTtl, axiosInstance);

    // Construct other URLs and data for plugin config
    const hostUrl = GetHostUrl(protocol, hostname);
    const sourceUrl = GetConfigUrl(host, hostUrl);

    // Use remote config as baseline and override instance-specific fields
    return {
        ...remoteConfigData,
        name,
        description,
        id,
        platformUrl,
        sourceUrl,
        "constants": {
            ...remoteConfigData.constants,
            "baseUrl": platformUrl
        }
    };
}

// Exporting functions
module.exports = {
    GetHostUrl,
    GetConfigUrl,
    GetPluginConfig,
    GetQRCode,
    ValidatePeerTubeInstance
};
