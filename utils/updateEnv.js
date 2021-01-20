const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const readline = require('readline');

const defs = {
  REACT_APP_AUTH_NAMESPACE: 'https://my.app.io/jwt/claims',
  REACT_APP_AUTH_HEADER: 'X-My-App-Auth',
};

if (process.env.REACT_APP_AUTH_NAMESPACE)
  defs.REACT_APP_AUTH_NAMESPACE = process.env.REACT_APP_AUTH_NAMESPACE;
if (process.env.REACT_APP_AUTH_HEADER)
  defs.REACT_APP_AUTH_HEADER = process.env.REACT_APP_AUTH_HEADER;
if (process.env.REACT_APP_GRAPHQL_ENDPOINT)
  defs.REACT_APP_GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT;
if (process.env.REACT_APP_AUTH0_DOMAIN)
  defs.REACT_APP_AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN;
if (process.env.REACT_APP_AUTH0_CLIENT_ID)
  defs.REACT_APP_AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID;
if (process.env.AUTH0_CLIENT_SECRET)
  defs.AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

function askQuestion(question, completer = undefined) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

const execShellCommand = async (cmd, msg) => {
  if (msg) console.log(msg);
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
};

const acceptableInput = async (check, onError) => {
  if (!check()) {
    await onError();
    return acceptableInput(check, onError);
  } else {
    return true;
  }
};

const askHasSlash = async () => {
  let yesNo = await askQuestion(
    '\nDo you already have an account on Slash GraphQL? (Y/N) > ',
  );
  await acceptableInput(
    () => {
      yesNo = yesNo.trim();
      const regex = RegExp(/(^y(es)?$)|^no?$/i);
      return regex.test(yesNo);
    },
    async () => {
      yesNo = await askQuestion('Please answer with either yes or no > ');
    },
  );
  const regex = RegExp(/^no?$/i);
  return !regex.test(yesNo);
};

const walkThroughSlashSetup = async () => {
  console.log(
    `
    Please go to https://slash.dgraph.io/ and Sign Up
    It is free to get started ;)
    `,
  );
  return askQuestion('Press enter key to continue...');
};

const askAutomateBackend = async () => {
  let yesNo = await askQuestion(
    '\nDo you want this script to create a new backend for you? (Y/N) > ',
  );
  await acceptableInput(
    () => {
      yesNo = yesNo.trim();
      const regex = RegExp(/(^y(es)?$)|^no?$/i);
      return regex.test(yesNo);
    },
    async () => {
      yesNo = await askQuestion('Please answer with either yes or no > ');
    },
  );
  const regex = RegExp(/^no?$/i);
  return !regex.test(yesNo);
};

const askCanHaveAccess = async () => {
  let yesNo = await askQuestion(
    '\nDo you want to authorize this device to log into your Slash account to complete some steps for you? (Y/N) > ',
  );
  await acceptableInput(
    () => {
      yesNo = yesNo.trim();
      const regex = RegExp(/(^y(es)?$)|^no?$/i);
      return regex.test(yesNo);
    },
    async () => {
      yesNo = await askQuestion('Please answer with either yes or no > ');
    },
  );
  const regex = RegExp(/^no?$/i);
  return !regex.test(yesNo);
};

const askHasBackend = async () => {
  let yesNo = await askQuestion(
    '\nHave you created a backend for this project? (Y/N) > ',
  );
  await acceptableInput(
    () => {
      yesNo = yesNo.trim();
      const regex = RegExp(/(^y(es)?$)|^no?$/i);
      return regex.test(yesNo);
    },
    async () => {
      yesNo = await askQuestion('Please answer with either yes or no > ');
    },
  );
  const regex = RegExp(/^no?$/i);
  return !regex.test(yesNo);
};

const walkThroughBackend = async () => {
  console.log(
    `
    From inside of your Slash GraphQL Dashboard https://slash.dgraph.io/_/dashboard
    Click on the "Launch new backend" button

    This may take a few minutes to spin up.
    
    After you receive the message "Your Backend is live!",
    `,
  );
  return askQuestion('Press enter key to continue...');
};

const askBackendUrl = async () => {
  // NOTE: This supports Dgraph GraphQL running localy also by not checking for cloud.dgraph.io domain or requiring https
  const completer = async (linePartial, callback) => {
    const matches = [];
    if (
      defs.REACT_APP_GRAPHQL_ENDPOINT &&
      defs.REACT_APP_GRAPHQL_ENDPOINT.startsWith(linePartial)
    )
      matches.push(defs.REACT_APP_GRAPHQL_ENDPOINT);
    callback(null, [matches, linePartial]);
  };
  let url = await askQuestion('GraphQL Endpoint > ', completer);
  await acceptableInput(
    () => {
      url = url.trim();
      if (!url.startsWith('https://') && !url.startsWith('http://'))
        return false;
      if (!url.endsWith('/graphql')) return false;
      // TODO: Add check to fetch headers for provided url to validate.
      return true;
    },
    async () => {
      if (!url.startsWith('https://') && !url.startsWith('http://'))
        console.log(
          'Error: You must enter the full URL including the https://',
        );
      if (!url.endsWith('/graphql'))
        console.log('Error: You must use the /graphql endpoint.');
      url = await askQuestion(
        'Please enter a valid Slash GraphQL Endpoint\n > ',
        completer,
      );
    },
  );
  return url;
};

const askForEndpoint = async () => {
  console.log(
    `
    Please copy and paste here your GraphQL Backend Endpoint URL.
    This would be similar to "https://your-name.location.service.cloud.dgraph.io/graphql"

    This can be retrieved from your Slash GraphQL Overview https://slash.dgraph.io/_/dashboard
    `,
  );
  if (defs.REACT_APP_GRAPHQL_ENDPOINT)
    console.log(
      `    Press the \`Tab\` key to use ${defs.REACT_APP_GRAPHQL_ENDPOINT}
    `,
    );
  return askBackendUrl();
};

const askAuthNamespace = async () => {
  const completer = async (linePartial, callback) => {
    const matches = [];
    if (
      defs.REACT_APP_AUTH_NAMESPACE &&
      defs.REACT_APP_AUTH_NAMESPACE.startsWith(linePartial)
    )
      matches.push(defs.REACT_APP_AUTH_NAMESPACE);
    callback(null, [matches, linePartial]);
  };
  let namespace = await askQuestion('Auth Namespace > ', completer);
  await acceptableInput(
    () => {
      namespace = namespace.trim();
      if (['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'].includes(namespace))
        return false;
      return namespace !== '';
    },
    async () => {
      if (['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'].includes(namespace))
        console.log(`Error: ${namespace} is a reserved namespace.`);
      if (namespace === '')
        console.log('Error: The namespace cannot be empty.');
      namespace = await askQuestion(
        'Please enter a valid Namespace\n > ',
        completer,
      );
    },
  );
  return namespace;
};

const askForAuthNamespace = async () => {
  console.log(
    `
    The integration between Slash GraphQL and Auth0 uses a namespace to hold custom claims.
    This namespace should be a unique string that does not collide with other JWT claims.
    To accomplish this level of uniqueness it is best practice to use a personal URL path.
    This url is commonly pointed to yourdomain/jwt/claims, but that is not mandatory. When
    using a URL, it does not need to be a valid accesible URL. This is merely for uniqueness.
    `,
  );
  if (defs.REACT_APP_AUTH_NAMESPACE)
    console.log(
      `    Press the \`Tab\` key to use ${defs.REACT_APP_AUTH_NAMESPACE}
    `,
    );
  return askAuthNamespace();
};

const askAuthHeader = async () => {
  const completer = async (linePartial, callback) => {
    const matches = [];
    if (
      defs.REACT_APP_AUTH_HEADER &&
      defs.REACT_APP_AUTH_HEADER.startsWith(linePartial)
    )
      matches.push(defs.REACT_APP_AUTH_HEADER);
    callback(null, [matches, linePartial]);
  };
  let header = await askQuestion('Auth Header > ', completer);
  await acceptableInput(
    () => {
      header = header.trim();
      return header !== '';
    },
    async () => {
      if (header === '') console.log('Error: The header name cannot be empty.');
      header = await askQuestion(
        'Please enter a valid Header name\n > ',
        completer,
      );
    },
  );
  return header;
};

const askForAuthHeader = async () => {
  console.log(
    `
    The integration between Slash GraphQL and Auth0 creates a JWT that can be forwarded
    to the Slash GraphQL to authorize the request. It is common practice to use a custom
    header name that will not be present with not validated requests. A few common variations
    include: \`X-My-App-Auth\`, \`Authorization\`, \`auth\`, and \`token\`
    `,
  );
  if (defs.REACT_APP_AUTH_HEADER)
    console.log(
      `    Press the \`Tab\` key to use ${defs.REACT_APP_AUTH_HEADER}
    `,
    );
  return askAuthHeader();
};

const askHasAuth0 = async () => {
  let yesNo = await askQuestion(
    '\nDo you already have an Auth0 account? (Y/N) > ',
  );
  await acceptableInput(
    () => {
      yesNo = yesNo.trim();
      const regex = RegExp(/(^y(es)?$)|^no?$/i);
      return regex.test(yesNo);
    },
    async () => {
      yesNo = await askQuestion('Please answer with either yes or no > ');
    },
  );
  const regex = RegExp(/^no?$/i);
  return !regex.test(yesNo);
};

const walkThroughAuth0 = async () => {
  console.log(
    `
    To sign up for Auth0, In your web browser, navigate to: https://auth0.com/signup

    Ceate an account and Login to your dashboard: https://manage.auth0.com/dashboard/
    
    When you have this done,
    `,
  );
  await askQuestion('Press enter key to continue...');
  console.log(
    `
    Auth0 creates a new API key and a Default Application for you already. You may
    use that Default Application or you may decide to create a new application.,
    `,
  );
  return askQuestion('Press enter key to continue...');
};

const askHasAuth0App = async () => {
  let yesNo = await askQuestion(
    '\nView walkthrough to create a new Application on Auth0? (Y/N) > ',
  );
  await acceptableInput(
    () => {
      yesNo = yesNo.trim();
      const regex = RegExp(/(^y(es)?$)|^no?$/i);
      return regex.test(yesNo);
    },
    async () => {
      yesNo = await askQuestion('Please answer with either yes or no > ');
    },
  );
  const regex = RegExp(/^no?$/i);
  return !regex.test(yesNo);
};

const walkThroughAuth0App = async () => {
  console.log(
    `
    On the Getting Started Dashboard of Auth0, https://manage.auth0.com/dashboard,
    Select the option to Integrate Auth0 into your application. (Create Application).
    Name your application.

    For the application type, select Single Page Web Application (SWPA).

    Select CREATE to complete the process then,
    `,
  );
  await askQuestion('Press enter key to continue...');
  console.log(
    `
    Navigating to your Application using your browser on Auth0, select your Application's
    Settings. Before we ask for some of these fields, let's guide you through a few more
    configuration steps before we forget.

    For brevity, we will not cover every setting, just three main ones needed to get your
    application working.

    - Allowed Callback URLs
    - Allowed Logout URLs
    - Allowed Web Origins

    For this simple use case, we are keeping all of the other settings default. We need to
    add the address of our application to these fields. For development purposes we need to
    add our local address, "http://localhost:3000/" This may be different for your, and when
    you deploy your application online, you will need to update this value.

    A common stack is with local development on port 3000 and a live deployment using netlify.
    We can use a wildcard to make this work with the following:

      "http://localhost:3000/, https://*.netlify.app/"

    After you have updated these three fields, Save the Changes and
    `,
  );
  return askQuestion('Press enter key to continue...');
};

const askAuth0Domain = async () => {
  const completer = async (linePartial, callback) => {
    const matches = [];
    if (
      defs.REACT_APP_AUTH0_DOMAIN &&
      defs.REACT_APP_AUTH0_DOMAIN.startsWith(linePartial)
    )
      matches.push(defs.REACT_APP_AUTH0_DOMAIN);
    callback(null, [matches, linePartial]);
  };
  let domain = await askQuestion('Auth0 Domain > ', completer);
  await acceptableInput(
    () => {
      domain = domain.trim();
      if (!domain.endsWith('.auth0.com')) return false;
      return domain !== '';
    },
    async () => {
      if (!domain.endsWith('.auth0.com'))
        console.log('Error: The Auth0 Domain should end with `.auth0.com`');
      if (domain === '')
        console.log('Error: The Auth0 Domain cannot be empty.');
      domain = await askQuestion(
        'Please enter a valid Auth0 Domain\n > ',
        completer,
      );
    },
  );
  return domain;
};

const askForAuth0Domain = async () => {
  console.log(
    `
    The Auth0 Domain is based on your tenant. You can create multiple tenants to keep groups of
    applications separated. You can easily find your Auth0 Domain on your Application Settings Page
    `,
  );
  if (defs.REACT_APP_AUTH0_DOMAIN)
    console.log(
      `    Press the \`Tab\` key to use ${defs.REACT_APP_AUTH0_DOMAIN}
    `,
    );
  return askAuth0Domain();
};

const askAuth0ClientID = async () => {
  const completer = async (linePartial, callback) => {
    const matches = [];
    if (
      defs.REACT_APP_AUTH0_CLIENT_ID &&
      defs.REACT_APP_AUTH0_CLIENT_ID.startsWith(linePartial)
    )
      matches.push(defs.REACT_APP_AUTH0_CLIENT_ID);
    callback(null, [matches, linePartial]);
  };
  let id = await askQuestion('Auth0 Client ID > ', completer);
  await acceptableInput(
    () => {
      id = id.trim();
      return id !== '';
    },
    async () => {
      if (id === '') console.log('Error: The Client ID cannot be empty.');
      id = await askQuestion('Please enter a valid Client ID\n > ', completer);
    },
  );
  return id;
};

const askForAuth0ClientID = async () => {
  console.log(
    `
    Auth0 assigns every Application it's unique Client ID. We will need this for the
    audience of our JWT. This will also allow us to add a rule processed for this application.
    The Client ID can be easily found on the Application Settings page.
    `,
  );
  if (defs.REACT_APP_AUTH0_CLIENT_ID)
    console.log(
      `    Press the \`Tab\` key to use ${defs.REACT_APP_AUTH0_CLIENT_ID}
    `,
    );
  return askAuth0ClientID();
};

const askAuth0ClientSecret = async () => {
  const completer = async (linePartial, callback) => {
    const matches = [];
    if (
      defs.AUTH0_CLIENT_SECRET &&
      defs.AUTH0_CLIENT_SECRET.startsWith(linePartial)
    )
      matches.push(defs.AUTH0_CLIENT_SECRET);
    callback(null, [matches, linePartial]);
  };
  let secret = await askQuestion('Auth0 Client Secret > ', completer);
  await acceptableInput(
    () => {
      secret = secret.trim();
      return secret !== '';
    },
    async () => {
      if (secret === '') console.log('Error: The header name cannot be empty.');
      secret = await askQuestion(
        'Please enter a valid Header name\n > ',
        completer,
      );
    },
  );
  return secret;
};

const askForAuth0ClientSecret = async () => {
  console.log(
    `
    For advanced Auth0 rule management configuration, you will need the Client Secret.
    This Client Secret is unique for every application. The Client Secret can be found
    from the Application Settings page.
    `,
  );
  if (defs.AUTH0_CLIENT_SECRET)
    console.log(
      `    Press the \`Tab\` key to use ${defs.AUTH0_CLIENT_SECRET}
    `,
    );
  return askAuth0ClientSecret();
};

const replaceVariableValue = (line, key, value, values) => {
  let [k] = line.split('=');
  if (k === key) {
    if (typeof values === 'object' && values.hasOwnProperty(key))
      delete values[key];
    return `${k}=${value}`;
  }
  return line;
};

const formLines = (values) => {
  const lines = [];
  for (const [key, value] of Object.entries(values)) {
    lines.push(`${key}=${value}`);
  }
  return lines;
};

const replaceVars = (contents, values) => {
  const data = contents
    .split(/\r?\n/)
    .reverse()
    .map((line) => {
      const entries = Object.entries(values);
      for (const [key, value] of entries) {
        line = replaceVariableValue(line, key, value, values);
      }
      return line;
    })
    .reverse();
  data.push(...formLines(values));
  return data.join('\n');
};

const askGenTypes = async () => {
  let yesNo = await askQuestion(
    '\nDo you want to regenerate graphql types? (Y/N) > ',
  );
  await acceptableInput(
    () => {
      yesNo = yesNo.trim();
      const regex = RegExp(/(^y(es)?$)|^no?$/i);
      return regex.test(yesNo);
    },
    async () => {
      yesNo = await askQuestion('Please answer with either yes or no > ');
    },
  );
  const regex = RegExp(/^no?$/i);
  return !regex.test(yesNo);
};

const root = async () => {
  const hasSlash = await askHasSlash();
  if (!hasSlash) await walkThroughSlashSetup();
  const canHaveAccess = await askCanHaveAccess();
  if (canHaveAccess)
    console.log(
      await execShellCommand(
        'npx slash-graphql login',
        `
    The script will open your browser shortly for you to confirm authorization
    Please click "Confirm" in the Browser Window then return here. The script
    will automatically continue once the authorization process completes.
    `,
      ),
    );
  const automateBackend = !canHaveAccess ? false : await askAutomateBackend();
  let endpoint = null;
  if (automateBackend) {
    const createdBackend = await execShellCommand(
      'npx slash-graphql deploy-backend Boilerplate',
      `
      Please wait while the new backend is being deployed. This may take a few
      minutes. The script will continue once this step is completed.
      `,
    );
    const lines = createdBackend.split('\n');
    console.log(createdBackend);
    if (!Array.isArray(lines) || lines.length < 2)
      throw new Error(
        'Check the output above, the backend was not created successfully',
      );
    if (
      !lines[1].startsWith('https://') &&
      !lines[1].endsWith('cloud.dgraph.io/graphql')
    )
      throw new Error(
        'Check the output above, the second line should have contained the GraphQL endpoint',
      );
    endpoint = lines[1];
  } else {
    const hasBackend = await askHasBackend();
    if (!hasBackend) await walkThroughBackend();
    endpoint = await askForEndpoint();
  }
  const namespace = await askForAuthNamespace();
  const headerKey = await askForAuthHeader();
  const hasAuth0 = await askHasAuth0();
  if (!hasAuth0) await walkThroughAuth0();
  const hasAuth0App = await askHasAuth0App();
  if (hasAuth0App) await walkThroughAuth0App();
  const auth0Domain = await askForAuth0Domain();
  const auth0ClientID = await askForAuth0ClientID();
  const auth0ClientSecret = await askForAuth0ClientSecret();

  try {
    let data = '';
    if (fs.existsSync('.env')) {
      data = fs.readFileSync('.env', 'utf8');
    }
    data = replaceVars(data, {
      REACT_APP_AUTH_NAMESPACE: namespace,
      REACT_APP_AUTH_HEADER: headerKey,
      REACT_APP_GRAPHQL_ENDPOINT: endpoint,
      REACT_APP_AUTH0_DOMAIN: auth0Domain,
      REACT_APP_AUTH0_CLIENT_ID: auth0ClientID,
      AUTH0_CLIENT_SECRET: auth0ClientSecret,
    });
    fs.writeFileSync('.env', data);
  } catch (err) {
    throw err;
  } finally {
    console.log('The .env file was created/updated successfully!');
  }

  console.log(await execShellCommand('npm run auth0-get-cert'));

  console.log(await execShellCommand('npm run auth0-rule-gen'));
  await askQuestion(`
    In your Auth0 Dashboard navigate to Auth Pipeline -> Rules.
    Click "Create New Rule". Use the Empty rule template. Create a name
    for the rule. In your local project directory, copy the contents of
    \`deploy/auth0Rule.js\` and use it to replace the contents of the rule
    Script.
    Click on "Save Changes"
    \n When you are ready to cotinue press enter > `);
  console.log(await execShellCommand('npm run schema-add-auth'));

  if (canHaveAccess) {
    console.log(await execShellCommand('npm run slash-deploy-schema'));
    const genTypes = await askGenTypes();
    if (genTypes) console.log(await execShellCommand('npm run generate'));
  } else {
    console.log(
      `
      The schema was updated with your configuration, but was not deployed.
      To deploy your schema onto Slash, please copy the contents of
      \`deploy/schema.graphql\` and paste into your schema on your Slash Account.
      `,
    );
  }
};

root();
