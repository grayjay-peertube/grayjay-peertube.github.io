$(document).ready(function () {

    if (/^peertube-instances\.ir-to\.com$/i.test(window.location.hostname)) {
        $('#platform-message').show();
    
        setTimeout(function () {
            window.location.href = "https://grayjay-peertube.github.io/";
        }, 3000);
    }

    const apiBaseUrl='https://peertube-instances.ir-to.com';


    const apiQrUrl = `${apiBaseUrl}/api/v1/PluginQR?peerTubePlatformUrl=`;
    const apiValidateUrl = `${apiBaseUrl}/api/v1/validatePeerTube?peerTubePlatformUrl=`;
    const apiConfUrl = `grayjay://plugin/${apiBaseUrl}/api/v1/PluginConfig.json?peerTubePlatformUrl=`;

    const peerTubeInstancesBaseUrl = 'https://instances.joinpeertube.org/api/v1/instances?start=0&count=1000&healthy=true&customizations=3&sort=-customizations&randomSortSeed=1714740'

    // Check if the browser supports custom URI scheme redirection
    var isSupported = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Handle the "Cancel" button click
                // You can add your logic here
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

    function showQrCode(host, generateOnClientSide = true) {

        $('[data-toggle="tooltip"]').tooltip('hide');

        if(!generateOnClientSide){

            Swal.showLoading();
    
            // Create an image element dynamically
            var img = new Image();
            img.onload = function () {
                showQrCodeInSwal(`<div id="qrCode"><img alt="Generated QR Code" src="${img.src}"></div><p>${host}</p>`, host);
            }
    
            // Set the source of the image
            img.src = `${apiQrUrl}${host}`;
        } else {

            const qrText = `${apiConfUrl}${host}`;

            let qr = qrcode(0, 'L');
            qr.addData(qrText);
            qr.make();

            let qrImg = qr.createImgTag(6, 8, "qr code of " + qrText);
    
            showQrCodeInSwal(`<div id="qrCode">${qrImg}</div><p>${host}</p>`, host);
        }       

    }

    // Initialize DataTable
    $('#instancesTable').DataTable({
        ajax: {
            url: peerTubeInstancesBaseUrl,
            dataSrc: 'data'
        },
        columns: [
            {
                data: 'host',
                render: function (data) {
                    // Render the host as a hyperlink using template literals
                    return `<a href="https://${data}" target="_blank" rel="noopener">${data}</a>`;
                }
            },
            {
                data: 'name',
                render: function (data, type, row) {
                    // Use the name as the text and short description as the tooltip
                    return `<span class="tooltip-span" data-toggle="tooltip" title="${row.shortDescription}">${data}</span>`;
                }
            },
            { data: 'totalUsers' },
            { data: 'totalVideos' },
            { data: 'totalLocalVideos' },
            { data: 'totalInstanceFollowers' },
            { data: 'totalInstanceFollowing' },
            { data: 'version' },
            {
                data: 'signupAllowed',
                render: function (data) {
                    return data == true ? 'Yes' : 'No';
                }
            },
        ],
        columnDefs: [
            // Handle columns not found
            { targets: '_all', defaultContent: '' }
        ],
        paging: true, // Enable paging
        pageLength: 25, // Number of rows per page
        lengthMenu: [10, 25, 50, 100], // Options for number of rows per page
        scrollY: false, // Disable vertical scrolling
        initComplete: function () {
            $('#instancesTable tbody').on('dblclick ', 'tr', function () {

                var data = $('#instancesTable').DataTable().row(this).data();

                showQrCode(data.host);

            });
        },
        drawCallback: function () {
            $('[data-toggle="tooltip"]').tooltip();
        },
        responsive: true

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
                // Check if a value is provided
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

});
