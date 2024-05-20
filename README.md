# PeerTube Instances

## Description
The PeerTube Instances is a tool designed to help users discover and explore various instances of the PeerTube video hosting platform and easily add them to the Grayjay app. 

It provides a user-friendly interface for browsing PeerTube instances, displaying key metrics such as the number of users, videos, and instance versions.

## Components
- **Frontend**: The frontend of the application is built using HTML, CSS, and JavaScript. It utilizes libraries such as Bootstrap, DataTables, and SweetAlert2 to create a responsive and interactive user interface.
- **Backend**: The backend consists of server-side logic implemented using Node.js and Express.js. It handles API requests for fetching PeerTube instance data and generating QR codes for Grayjay integration.
- **QR Code Generation**: QR codes for individual PeerTube instances are generated dynamically using the qrcode library in Node.js.
- **Integration with Grayjay**: The application integrates with Grayjay, a PeerTube client, allowing users to easily add discovered instances to their Grayjay instance.

## Usage
To use the PeerTube Instances Web Application, follow these steps:
1. Clone the repository to your local machine.
2. Install dependencies by running `npm install`.
3. Create a `.env` file based on the provided `env.sample` file and configure the necessary environment variables.
4. Start the server by running `npm start`.
5. Access the application in your web browser at the specified port (default: 80).
