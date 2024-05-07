$(document).ready(function () {

    const apiQrUrl = 'https://peertube-instances.ir-to.com/api/v1/PluginQR?peerTubePlatformUrl=';
    const apiConfUrl = 'https://peertube-instances.ir-to.com/api/v1/PluginConfig.json?peerTubePlatformUrl=';
    const peerTubeInstancesBaseUrl = 'https://instances.joinpeertube.org/api/v1/instances?start=0&count=1000&healthy=true&customizations=3&sort=-customizations&randomSortSeed=1714740'

    // Check if the browser supports custom URI scheme redirection
    var isSupported = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    function openGrayjayApp() {
        var appUrl = "grayjay://plugin/https://plugins.grayjay.app/Bilibili/BiliBiliConfig.json";

        if (isSupported) {
            // Attempt to open the "grayjay" app
            window.location.href = appUrl;
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
            { data: 'version' },
            // { data: 'signupAllowed' },
            {
                data: 'signupAllowed',
                render: function (data) {
                    return data == true ? 'Yes' : 'No';
                }
            },
            // { data: 'languages' },
            // { data: 'health' },
            {
                data: 'createdAt',
                render: function (data) {
                    // Format createdAt to display only the date
                    if (data)
                        return new Date(data).toLocaleDateString();
                }
            }
        ],
        columnDefs: [
            // Handle columns not found
            { targets: '_all', defaultContent: '' }
        ],
        paging: true, // Enable paging
        pageLength: 10, // Number of rows per page
        lengthMenu: [10, 25, 50, 100], // Options for number of rows per page
        scrollY: false, // Disable vertical scrolling
        initComplete: function () {

            // Add click event to show SweetAlert2 alert
            $('#instancesTable tbody').on('dblclick ', 'tr', function () {
                var data = $('#instancesTable').DataTable().row(this).data();

                if (data.host) {
                    Swal.fire({
                        title: `Add ${data.host} to grayjay`,
                        html: `
                        <a href="https://grayjay.app/#download" target="_blank" rel="noopener">Download grayjay</a>
                        </br>
                        <img src="${apiQrUrl}${data.host}">
                        `,
                        // icon: 'info',
                        confirmButtonText: 'Open in grayjay',
                        showCancelButton: true,
                        showConfirmButton: isSupported,
                        cancelButtonText: 'Close',
                        buttonsStyling: false,
                        customClass: {
                            confirmButton: 'swal-button',
                            cancelButton: 'swal-button'
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Handle the "Open in grayjay" button click
                            // You can add your logic here
                            debugger;
                            window.location = `${apiConfUrl}${data.host}`;
                        } else if (result.dismiss === Swal.DismissReason.cancel) {
                            // Handle the "Cancel" button click
                            // You can add your logic here
                        }
                    });
                }
            });
        },
        drawCallback: function () {
            $('[data-toggle="tooltip"]').tooltip();
        },
        responsive: true

    });
});
