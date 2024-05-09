$(document).ready(function () {

    const apiQrUrl = 'https://peertube-instances.ir-to.com/api/v1/PluginQR?peerTubePlatformUrl=';


    
    const apiConfUrl = 'grayjay://plugin/https://peertube-instances.ir-to.com/api/v1/PluginConfig.json?peerTubePlatformUrl=';
    const peerTubeInstancesBaseUrl = 'https://instances.joinpeertube.org/api/v1/instances?start=0&count=1000&healthy=true&customizations=3&sort=-customizations&randomSortSeed=1714740'

    // Check if the browser supports custom URI scheme redirection
    var isSupported = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
                $('[data-toggle="tooltip"]').tooltip('hide');
                var data = $('#instancesTable').DataTable().row(this).data();
        
                if (data.host) {
                    // Show loading state
                    Swal.showLoading();
                    
                    // Create an image element dynamically
                    var img = new Image();
                    img.onload = function() {
                        // Once the image is loaded, create the SweetAlert2 alert
                        Swal.fire({
                            title: `Add ${data.host} to grayjay`,
                            html: `
                                <a href="https://grayjay.app/#download" target="_blank" rel="noopener">Download grayjay</a>
                                </br>
                                <img src="${apiQrUrl}${data.host}">
                            `,
                            confirmButtonText: 'Open in grayjay',
                            showCancelButton: true,
                            showConfirmButton: isSupported,
                            cancelButtonText: 'Close',
                            buttonsStyling: false,
                            customClass: {
                                actions: 'btn-group',
                                confirmButton: 'btn btn-primary mb-2',
                                cancelButton: 'btn btn-secondary mb-2'
                            }
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location = `${apiConfUrl}${data.host}`;
                            } else if (result.dismiss === Swal.DismissReason.cancel) {
                                // Handle the "Cancel" button click
                                // You can add your logic here
                            }
                        });
                    };
                    
                    // Set the source of the image
                    img.src = `${apiQrUrl}${data.host}`;
                }
            });
        },        
        drawCallback: function () {
            $('[data-toggle="tooltip"]').tooltip();
        },
        responsive: true

    });
});
