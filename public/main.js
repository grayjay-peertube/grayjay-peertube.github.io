$(document).ready(function () {

    if (/^peertube-instances\.ir-to\.com$/i.test(window.location.hostname)) {
        $('#platform-message').show();
    
        setTimeout(function () {
            window.location.href = "https://grayjay-peertube.github.io/";
        }, 3000);
    }

    const apiBaseUrl='https://peertube-instances.ir-to.com';

    const apiValidateUrl = `${apiBaseUrl}/api/v1/validatePeerTube?peerTubePlatformUrl=`;
    const apiConfUrl = `grayjay://plugin/${apiBaseUrl}/api/v1/PluginConfig.json?peerTubePlatformUrl=`;

    const peerTubeInstancesBaseUrl = 'https://instances.joinpeertube.org/api/v1/instances?start=0&count=1000&healthy=true&customizations=3&sort=-customizations&randomSortSeed=1714740'

    // Check if the browser supports custom URI scheme redirection
    var isSupported = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Store all instances data
    let allInstances = [];
    let filteredInstances = [];
    let availableLanguages = new Map(); // Map to store language codes and names

    function toastError(title){
        Swal.fire({
            icon: 'error',
            title,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        })
    }

    function openInGrayJay(host) {
        window.location = `${apiConfUrl}${host}`;
    }

    function showQrCodeInSwal(html, host){
        Swal.fire({
            title: 'Scan to add to Grayjay',
            html,
            confirmButtonText: 'Open in grayjay',
            showCancelButton: true,
            showConfirmButton: isSupported,
            cancelButtonText: 'Close',
            buttonsStyling: false,
            customClass: {
                actions: 'btn-group',
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-secondary'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                openInGrayJay(host);
            }
        });
    }

    async function validateUrl(apiValidateUrl, host) {
        try {
            const response = await fetch(`${apiValidateUrl}${encodeURIComponent(host)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.valid) {
                return host;
            } else {
                throw new Error('Failed to generate QR code. Please try again.');
            }
        } catch (error) {
            throw error;
        }
    }

    function showQrCode(host) {
        const qrText = `${apiConfUrl}${host}`;

        let qr = qrcode(0, 'L');
        qr.addData(qrText);
        qr.make();

        let qrImg = qr.createImgTag(6, 8, "qr code of " + qrText);

        showQrCodeInSwal(`<div id="qrCode">${qrImg}</div><p>${host}</p>`, host);
    }

    // Format large numbers
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Get language name from code
    function getLanguageName(code) {
        const languageNames = {
            'aa': 'Afar',
            'ab': 'Abkhazian',
            'af': 'Afrikaans',
            'ak': 'Akan',
            'sq': 'Albanian',
            'am': 'Amharic',
            'an': 'Aragonese',
            'ar': 'Arabic',
            'as': 'Assamese',
            'ase': 'American Sign Language',
            'av': 'Avar',
            'avk': 'Kotava',
            'ay': 'Aymara',
            'az': 'Azerbaijani',
            'ba': 'Bashkir',
            'eu': 'Basque',
            'be': 'Belarusian',
            'bfi': 'British Sign Language',
            'bi': 'Bislama',
            'bm': 'Bambara',
            'bn': 'Bengali',
            'bo': 'Tibetan',
            'br': 'Breton',
            'bs': 'Bosnian',
            'bg': 'Bulgarian',
            'bzs': 'Brazilian Sign Language',
            'ca': 'Catalan',
            'ca-valencia': 'Catalan (Valencia)',
            'ce': 'Chechen',
            'ch': 'Chamorro',
            'zh': 'Chinese',
            'zh-Hans': 'Chinese (Simplified)',
            'zh-Hant': 'Chinese (Traditional)',
            'co': 'Corsican',
            'cr': 'Cree',
            'hr': 'Croatian',
            'cse': 'Czech Sign Language',
            'csl': 'Chinese Sign Language',
            'cv': 'Chuvash',
            'cs': 'Czech',
            'da': 'Danish',
            'dsl': 'Danish Sign Language',
            'nl': 'Dutch',
            'dv': 'Dhivehi',
            'dz': 'Dzongkha',
            'ee': 'Ewe',
            'en': 'English',
            'es': 'Spanish',
            'es-419': 'Spanish (Latin America)',
            'eo': 'Esperanto',
            'et': 'Estonian',
            'ff': 'Fulah',
            'fi': 'Finnish',
            'fj': 'Fijian',
            'fo': 'Faroese',
            'fr': 'French',
            'fsl': 'French Sign Language',
            'fy': 'Western Frisian',
            'gl': 'Galician',
            'gd': 'Scottish Gaelic',
            'de': 'German',
            'gn': 'Guaraní',
            'el': 'Greek',
            'gsg': 'German Sign Language',
            'gu': 'Gujarati',
            'gv': 'Manx',
            'ha': 'Hausa',
            'he': 'Hebrew',
            'hi': 'Hindi',
            'ho': 'Hiri Motu',
            'ht': 'Haitian Creole',
            'hu': 'Hungarian',
            'hy': 'Armenian',
            'hz': 'Herero',
            'is': 'Icelandic',
            'ig': 'Igbo',
            'ii': 'Sichuan Yi',
            'ik': 'Inupiaq',
            'id': 'Indonesian',
            'ga': 'Irish',
            'it': 'Italian',
            'iu': 'Inuktitut',
            'ja': 'Japanese',
            'jbo': 'Lojban',
            'jsl': 'Japanese Sign Language',
            'jv': 'Javanese',
            'ka': 'Georgian',
            'kg': 'Kongo',
            'ki': 'Kikuyu',
            'kj': 'Kuanyama',
            'kk': 'Kazakh',
            'kl': 'Kalaallisut',
            'km': 'Khmer',
            'kn': 'Kannada',
            'ko': 'Korean',
            'kr': 'Kanuri',
            'ks': 'Kashmiri',
            'ku': 'Kurdish',
            'kv': 'Komi',
            'kw': 'Cornish',
            'ky': 'Kyrgyz',
            'lv': 'Latvian',
            'lb': 'Luxembourgish',
            'lg': 'Luganda',
            'li': 'Limburgish',
            'lt': 'Lithuanian',
            'ln': 'Lingala',
            'lo': 'Lao',
            'lu': 'Luba-Katanga',
            'mk': 'Macedonian',
            'ms': 'Malay',
            'mt': 'Maltese',
            'mg': 'Malagasy',
            'mh': 'Marshallese',
            'mi': 'Māori',
            'ml': 'Malayalam',
            'mn': 'Mongolian',
            'mr': 'Marathi',
            'my': 'Burmese',
            'na': 'Nauru',
            'nb': 'Norwegian Bokmål',
            'nd': 'North Ndebele',
            'ne': 'Nepali',
            'ng': 'Ndonga',
            'nn': 'Norwegian Nynorsk',
            'no': 'Norwegian',
            'nr': 'South Ndebele',
            'nv': 'Navajo',
            'ny': 'Nyanja',
            'oc': 'Occitan',
            'oj': 'Ojibwe',
            'om': 'Oromo',
            'or': 'Odia',
            'os': 'Ossetian',
            'pa': 'Punjabi',
            'fa': 'Persian',
            'pks': 'Pakistan Sign Language',
            'pl': 'Polish',
            'pt': 'Portuguese',
            'pt-PT': 'Portuguese (Portugal)',
            'ps': 'Pashto',
            'qu': 'Quechua',
            'rm': 'Romansh',
            'rn': 'Rundi',
            'ro': 'Romanian',
            'rsl': 'Russian Sign Language',
            'ru': 'Russian',
            'rw': 'Kinyarwanda',
            'sc': 'Sardinian',
            'sd': 'Sindhi',
            'sdl': 'Saudi Sign Language',
            'se': 'Northern Sami',
            'sr': 'Serbian',
            'sfs': 'South African Sign Language',
            'sg': 'Sango',
            'sh': 'Serbo-Croatian',
            'si': 'Sinhala',
            'sk': 'Slovak',
            'sl': 'Slovenian',
            'sm': 'Samoan',
            'sn': 'Shona',
            'so': 'Somali',
            'ss': 'Swati',
            'st': 'Southern Sotho',
            'su': 'Sundanese',
            'sw': 'Swahili',
            'sv': 'Swedish',
            'swl': 'Swedish Sign Language',
            'ta': 'Tamil',
            'te': 'Telugu',
            'tg': 'Tajik',
            'th': 'Thai',
            'ti': 'Tigrinya',
            'tk': 'Turkmen',
            'tl': 'Tagalog',
            'tlh': 'Klingon',
            'tn': 'Tswana',
            'to': 'Tongan',
            'tok': 'Toki Pona',
            'ts': 'Tsonga',
            'tt': 'Tatar',
            'tr': 'Turkish',
            'tw': 'Twi',
            'ty': 'Tahitian',
            'ug': 'Uyghur',
            'uk': 'Ukrainian',
            'ur': 'Urdu',
            'uz': 'Uzbek',
            've': 'Venda',
            'vi': 'Vietnamese',
            'wa': 'Walloon',
            'cy': 'Welsh',
            'wo': 'Wolof',
            'xh': 'Xhosa',
            'yi': 'Yiddish',
            'yo': 'Yoruba',
            'za': 'Zhuang',
            'zu': 'Zulu',
            'zxx': 'No linguistic content'
        };
        return languageNames[code] || code.toUpperCase();
    }

    // Create a card for an instance
    function createInstanceCard(instance) {
        const signupClass = instance.signupAllowed ? 'open' : 'closed';
        const signupText = instance.signupAllowed ? 'Open' : 'Closed';
        
        // Process languages
        let languageInfo = '';
        if (instance.languages && instance.languages.length > 0) {
            const langNames = instance.languages.slice(0, 3).map(lang => getLanguageName(lang));
            languageInfo = langNames.join(', ');
            if (instance.languages.length > 3) {
                languageInfo += ` +${instance.languages.length - 3} more`;
            }
        } else {
            languageInfo = 'Not specified';
        }
        
        return `
            <div class="col-lg-4 col-md-6">
                <div class="card instance-card" data-host="${instance.host}">
                    <div class="card-header">
                        <h5 title="${instance.name}">${instance.name}</h5>
                        <div class="instance-host">
                            <a href="https://${instance.host}" target="_blank" rel="noopener" class="text-white text-decoration-none" onclick="event.stopPropagation()">
                                ${instance.host}
                            </a>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="instance-description">${instance.shortDescription || 'No description available'}</p>
                        <div class="language-info mb-3">
                            <span class="language-label">Languages:</span>
                            <span class="language-value" title="${instance.languages ? instance.languages.map(lang => getLanguageName(lang)).join(', ') : 'Not specified'}">${languageInfo}</span>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Users</span>
                                <span class="stat-value">${formatNumber(instance.totalUsers || 0)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Videos</span>
                                <span class="stat-value">${formatNumber(instance.totalVideos || 0)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Followers</span>
                                <span class="stat-value">${formatNumber(instance.totalInstanceFollowers || 0)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Following</span>
                                <span class="stat-value">${formatNumber(instance.totalInstanceFollowing || 0)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center gap-2">
                                <span class="version-badge" title="${instance.version || 'Unknown'}">v${instance.version || 'Unknown'}</span>
                                <span class="signup-badge ${signupClass}">Signup: ${signupText}</span>
                            </div>
                            <div class="card-actions">
                                <button class="action-btn copy-url-btn" data-host="${instance.host}" title="Copy configuration URL">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                                <button class="action-btn show-qr-btn" data-host="${instance.host}" title="Show QR code">
                                    <i class="bi bi-qr-code"></i>
                                </button>
                                <button class="action-btn open-instance-btn" data-host="${instance.host}" title="Open instance in new tab">
                                    <i class="bi bi-box-arrow-up-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render instances
    function renderInstances(instances) {
        const container = $('#instancesContainer');
        container.empty();
        
        if (instances.length === 0) {
            $('#noResults').show();
            container.hide();
        } else {
            $('#noResults').hide();
            container.show();
            
            instances.forEach(instance => {
                container.append(createInstanceCard(instance));
            });
        }
    }

    // Filter and sort instances
    function filterAndSortInstances() {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const signupFilter = $('#signupFilter').val();
        const languageFilter = $('#languageFilter').val();
        const sortBy = $('#sortSelect').val();
        
        // Filter
        filteredInstances = allInstances.filter(instance => {
            const matchesSearch = !searchTerm || 
                instance.name.toLowerCase().includes(searchTerm) ||
                instance.host.toLowerCase().includes(searchTerm) ||
                (instance.shortDescription && instance.shortDescription.toLowerCase().includes(searchTerm));
            
            const matchesSignup = !signupFilter || 
                instance.signupAllowed.toString() === signupFilter;
            
            const matchesLanguage = !languageFilter || 
                (instance.languages && instance.languages.includes(languageFilter));
            
            return matchesSearch && matchesSignup && matchesLanguage;
        });
        
        // Sort
        filteredInstances.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'users':
                    return (b.totalUsers || 0) - (a.totalUsers || 0);
                case 'videos':
                    return (b.totalVideos || 0) - (a.totalVideos || 0);
                case 'version':
                    return (b.version || '').localeCompare(a.version || '');
                default:
                    return 0;
            }
        });
        
        renderInstances(filteredInstances);
    }

    // Populate language filter
    function populateLanguageFilter() {
        const languageSelect = $('#languageFilter');
        
        // Clear all options first
        languageSelect.empty();
        languageSelect.append('<option value="">All Languages</option>');
        
        // Only add options if we have languages
        if (availableLanguages.size > 0) {
            // Sort languages by name
            const sortedLanguages = Array.from(availableLanguages.entries()).sort((a, b) => a[1].localeCompare(b[1]));
            
            sortedLanguages.forEach(([code, name]) => {
                languageSelect.append(`<option value="${code}">${name}</option>`);
            });
        }
        
    }

    // Collect all available languages from instances
    function collectLanguages(instances) {
        availableLanguages.clear();
        const languageCounts = new Map(); // Track how many instances use each language
        
        instances.forEach(instance => {
            if (instance.languages && Array.isArray(instance.languages) && instance.languages.length > 0) {
                instance.languages.forEach(langCode => {
                    if (langCode && langCode.trim() !== '') {
                        // Count how many instances use this language
                        languageCounts.set(langCode, (languageCounts.get(langCode) || 0) + 1);
                        
                        if (!availableLanguages.has(langCode)) {
                            availableLanguages.set(langCode, getLanguageName(langCode));
                        }
                    }
                });
            }
        });
        
        // Verify: only keep languages that are actually used
        const verifiedLanguages = new Map();
        for (const [code, name] of availableLanguages.entries()) {
            if (languageCounts.has(code) && languageCounts.get(code) > 0) {
                verifiedLanguages.set(code, name);
            }
        }
        
        availableLanguages.clear();
        for (const [code, name] of verifiedLanguages.entries()) {
            availableLanguages.set(code, name);
        }
        
        populateLanguageFilter();
    }

    // Load instances from API
    async function loadInstances() {
        try {
            const response = await fetch(peerTubeInstancesBaseUrl);
            const data = await response.json();
            
            allInstances = data.data || [];
            filteredInstances = [...allInstances];
            
            // Collect and populate languages
            collectLanguages(allInstances);
            
            $('#loadingSpinner').hide();
            filterAndSortInstances();
        } catch (error) {
            console.error('Error loading instances:', error);
            $('#loadingSpinner').html('<p class="text-danger">Failed to load instances. Please try again later.</p>');
        }
    }

    // Event listeners for search and filters
    $('#searchInput').on('input', filterAndSortInstances);
    $('#signupFilter').on('change', filterAndSortInstances);
    $('#languageFilter').on('change', filterAndSortInstances);
    $('#sortSelect').on('change', filterAndSortInstances);

    // Click handler for instance cards
    $(document).on('click', '.instance-card', function(e) {
        // Don't trigger card click if clicking on action buttons
        if (!$(e.target).closest('.action-btn').length && !$(e.target).closest('a').length) {
            const host = $(this).data('host');
            showQrCode(host);
        }
    });

    // Click handler for copy URL button
    $(document).on('click', '.copy-url-btn', function(e) {
        e.stopPropagation();
        const host = $(this).data('host');
        const configUrl = `${apiConfUrl}${host}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(configUrl).then(() => {
            // Change icon to checkmark
            const icon = $(this).find('i');
            icon.removeClass('bi-clipboard').addClass('bi-check-lg');
            
            // Show toast notification
            Swal.fire({
                icon: 'success',
                title: 'Copied!',
                text: 'Configuration URL copied to clipboard',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
            
            // Change icon back after 2 seconds
            setTimeout(() => {
                icon.removeClass('bi-check-lg').addClass('bi-clipboard');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            toastError('Failed to copy URL');
        });
    });

    // Click handler for show QR button
    $(document).on('click', '.show-qr-btn', function(e) {
        e.stopPropagation();
        const host = $(this).data('host');
        showQrCode(host);
    });

    // Click handler for open instance button
    $(document).on('click', '.open-instance-btn', function(e) {
        e.stopPropagation();
        const host = $(this).data('host');
        window.open(`https://${host}`, '_blank', 'noopener,noreferrer');
    });

    // Event listener for the generate QR code button
    $('#generateQRBtn').click(function () {
        Swal.fire({
            title: 'Enter PeerTube Instance URL',
            input: 'text',
            inputPlaceholder: 'Enter instance URL',
            showCancelButton: true,
            confirmButtonText: 'Generate QR Code',
            showLoaderOnConfirm: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'URL is required';
                }
            },
            preConfirm: (host) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const validHost = await validateUrl(apiValidateUrl, host);
                        resolve(validHost);
                    } catch (error) {
                        console.error('Error:', error.message);
                        reject('Failed to validate URL. Please try again.');
                    }
                });
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                showQrCode(result.value);
            }
        }).catch(function(){
            toastError('Invalid Peertube instance');
        });
    });

    // Load instances on page load
    loadInstances();
});