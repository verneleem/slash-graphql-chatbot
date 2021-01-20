const fs = require('fs');
const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) throw result.error;
if (!process.env.REACT_APP_AUTH_HEADER)
  console.log(
    'REACT_APP_AUTH_HEADER was not defined in .env using default "X-My-App-Auth"',
  );
if (!process.env.REACT_APP_AUTH_NAMESPACE)
  console.log(
    'REACT_APP_AUTH_NAMESPACE was not defined in .env using default "https://my.app.io/jwt/claims"',
  );
if (!process.env.REACT_APP_AUTH0_CLIENT_ID)
  throw new Error('REACT_APP_AUTH0_CLIENT_ID not set');

const {
  REACT_APP_AUTH_HEADER = 'X-My-App-Auth',
  REACT_APP_AUTH_NAMESPACE = 'https://my.app.io/jwt/claims',
  REACT_APP_AUTH0_CLIENT_ID,
} = process.env;

try {
  const cert = fs.readFileSync('deploy/cert.pem', 'utf8');
  const certLines = cert.split(/\r?\n/);
  const SLASH_AUTH_VERIFICATION_KEY = certLines.join('\\n');
  if (SLASH_AUTH_VERIFICATION_KEY === '')
    throw new Error('Empty deploy/cert.pem file');

  const schema = fs.readFileSync('deploy/schema.graphql', 'utf8');
  const schemaLines = schema.split(/\r?\n/);

  // delete any existing Dgraph.Authorization line
  let i = schemaLines.length;
  while (i--) {
    if (schemaLines[i].startsWith('# Dgraph.Authorization')) {
      schemaLines.splice(i, 1);
    }
  }

  // add a new Dgraph.Authorization line using cert.pem and .env variables
  schemaLines.push(
    `# Dgraph.Authorization {"VerificationKey":"${SLASH_AUTH_VERIFICATION_KEY}","Header":"${REACT_APP_AUTH_HEADER}","Namespace":"${REACT_APP_AUTH_NAMESPACE}","Algo":"RS256","Audience":["${REACT_APP_AUTH0_CLIENT_ID}"]}`,
  );
  const content = schemaLines.join('\n');

  fs.writeFileSync('deploy/schema.graphql', content);
} catch (err) {
  throw err;
} finally {
  console.log(
    'Schema File Updated Successfully using cert.pem and .env variables.',
  );
}
