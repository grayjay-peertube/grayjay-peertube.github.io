const crypto = require('crypto');

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

    try {
        // Fetch the data from the upstream server with timeout and error handling
        const response = await axiosInstance.get(upstreamConfigUrl, {
            timeout: 30000, // 30 second timeout
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });

        // Cache the fetched data along with the current timestamp
        cache.set(upstreamConfigUrl, { data: response.data, timestamp: Date.now() });

        return response.data;
    } catch (error) {
        // If upstream config fails, throw a specific error
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw new Error('Timeout fetching plugin configuration from upstream server');
        } else if (error.response) {
            throw new Error(`Failed to fetch upstream plugin config: ${error.response.status} ${error.response.statusText}`);
        } else {
            throw new Error(`Upstream config fetch error: ${error.message}`);
        }
    }
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

    // Fetch instance config data with error handling
    const instanceConfig = await axiosInstance.get(`https://${peerTubePlatformUrl}/api/v1/config/`, {
        timeout: 30000, // 30 second timeout
        validateStatus: function (status) {
            return status >= 200 && status < 300;
        }
    });

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
        // Fetch instance config with timeout and retry logic
        const response = await axiosInstance.get(`${host}/api/v1/config/`, {
            timeout: 30000, // 30 second timeout
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });
        instanceConfig = response.data;

        // Check if instance config is valid
        if (!instanceConfig || !instanceConfig.instance || !instanceConfig.instance.name || !instanceConfig.instance.shortDescription) {
            throw new Error('Invalid PeerTube instance configuration');
        }

    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw new Error('Connection timeout - PeerTube instance not responding');
        } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
            throw new Error('DNS resolution failed - PeerTube instance not found');
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('Connection refused - PeerTube instance unavailable');
        } else if (error.code === 'EPROTO' || error.message.includes('SSL') || error.message.includes('TLS')) {
            throw new Error('SSL/TLS connection error - Invalid certificate or protocol mismatch');
        } else if (error.response) {
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
    const scriptUrl = new URL(remoteConfigData.scriptUrl, `${pluginBaseUrl}/`).toString();

    if(remoteConfigData.authentication) {
        remoteConfigData.authentication.loginUrl = `${platformUrl}/login`;
        remoteConfigData.authentication.completionUrl = `${platformUrl}/api/v1/users/me?*`;
    }

    // Use remote config as baseline and override instance-specific fields
    return {
        ...remoteConfigData,
        name,
        description,
        id,
        platformUrl,
        sourceUrl,
        scriptUrl,
        iconUrl: 'https://plugins.grayjay.app/PeerTube/peertube.png',
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
    ValidatePeerTubeInstance
};
