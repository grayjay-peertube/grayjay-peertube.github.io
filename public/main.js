$(document).ready(function () {

    const apiQrUrl = 'https://peertube-instances.ir-to.com/api/v1/PluginQR?peerTubePlatformUrl=';



    const apiConfUrl = 'grayjay://plugin/https://peertube-instances.ir-to.com/api/v1/PluginConfig.json?peerTubePlatformUrl=';
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

    function showQrCode(host) {

        $('[data-toggle="tooltip"]').tooltip('hide');

        var imageUrl = `${apiQrUrl}${host}`;

        Swal.showLoading();

        // Create an image element dynamically
        var img = new Image();
        img.onload = function () {
            Swal.fire({
                title: 'Scan to add to GrayJay',
                imageUrl,
                imageAlt: 'Generated QR Code',
                html: `<p>QR code for ${host}:</p>`,
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


        // Set the source of the image
        img.src = `${apiQrUrl}${host}`;

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
            preConfirm: (url) => {
                return new Promise((resolve, reject) => {
                    const qrImage = new Image();
                    qrImage.src = `${apiQrUrl}${url}`;
                    qrImage.onload = () => {
                        
                        resolve({ url, qrImage });
                    };
                    qrImage.onerror = (error) => {
                        
                        reject('Failed to generate QR code. Please try again.');
                    };
                });
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            
            if (result.isConfirmed) {
                const { url, qrImage } = result.value;
                showQrCode(url);
            }

        }).catch(function(){
            toastError('Invalid Peertube instace');
        });
    });

});
