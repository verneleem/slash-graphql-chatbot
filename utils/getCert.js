const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const url = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/pem`;

console.log(url);

const file = fs.createWriteStream('deploy/cert.pem');
https.get(url, function (response) {
  response.pipe(file);
});
