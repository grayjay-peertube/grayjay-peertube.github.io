# PeerTube Instances

## Description
PeerTube Instances is a tool designed to help users discover and explore various instances of the PeerTube video hosting platform and easily add them to the Grayjay app.

It provides a user-friendly interface for browsing PeerTube instances, displaying key metrics such as the number of users, videos, and instance versions.

## Components
- **Frontend**: A static web application built using HTML, CSS, and JavaScript. It utilizes Bootstrap, SweetAlert2, and qrcode-generator to create a responsive and interactive user interface.
- **Backend**: The backend API is maintained in a separate repository: [grayjay-peertube-api](https://github.com/grayjay-peertube/grayjay-peertube-api)
- **QR Code Generation**: QR codes are generated client-side using the qrcode-generator library.
- **Integration with Grayjay**: The application integrates with Grayjay, allowing users to easily add discovered PeerTube instances to their Grayjay app.

## Usage
This is a static site hosted on GitHub Pages at [grayjay-peertube.github.io](https://grayjay-peertube.github.io/).

To run locally, serve the root folder with any static file server.
