$(document).ready(function () {
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
                    // Render the host as a hyperlink using string interpolation
                    return `<a href="https://${data}" target="_blank" rel=noopener>${data}</a>`;
                }
            },
            {
                data: 'name',
                render: function (data, type, row) {
                    // Use the name as the text and short description as the tooltip
                    return `<span data-toggle="tooltip" title="${row.shortDescription}">${data}</span>`;
                }
            },
            { data: 'totalUsers' },
            { data: 'totalVideos' },
            { data: 'version' },
            { data: 'signupAllowed' },
            { data: 'languages' },
            { data: 'health' },
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
            // Initialize tooltips after DataTables is fully initialized
            $('[data-toggle="tooltip"]').tooltip();

            // Add click event to show SweetAlert2 alert
            $('#instancesTable tbody').on('dblclick ', 'tr', function () {
                var data = $('#instancesTable').DataTable().row(this).data();

                if (data.host) {

                    // Get the text of the host:
                    const qrText = `${apibaseUrl}${data.host}`;
                    
                    // Make the QR code:
                    let qr = qrcode(0, 'L');
                    qr.addData(qrText);
                    qr.make();
                    // Create an image from it:


                    let qrImg = qr.createImgTag(10, 8, "qr code of " + qrText);

                    Swal.fire({
                        title: `Add ${data.host}`,
                        html: `<div id="qrCode">${qrImg}</div>`,
                        // icon: 'info',
                        confirmButtonText: 'OK'
                    });
                }
            });
        }
    });
});