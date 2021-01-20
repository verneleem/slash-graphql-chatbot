# Setup Your Environment

Create a new React Applicattion using this template. Run the following commands

```sh
npx create-react-app your-path-to-new-app --template slash-graphql --use-npm
npm run quick-start
```

## Setup Using the Automation Script

From the command line run the command `npm run quick-start` and follow the command line prompts.

## Setup Manually

From the command line, run `npm install`.

1. Copy the `.env.example` file to a new `.env` file
2. Decide on a Claims Namespace.

- An example of a Namespace is `https://my.app.io/jwt/claims`
- This does not have to be a weblink, but that is the common practice to ensure uniqueness
- If you use a weblink, you do not need to have anything on that link. It is merely used for uniqueness.

3. Copy your Namespce to the `.env` variable for `REACT_APP_AUTH_NAMESPACE`
4. Decide on a Header token name.

- This header token by default is `X-My-App-Auth`
- You can use the default or change to your own name.
- We recommend to use something unique and not conflit with [Header Field Definitions](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html) already in use.
- It is common to also use `auth` or `token` here.

5. Copy your Header token name to the `.env` variable for `REACT_APP_AUTH_HEADER`
6. Follow the steps below to configure Slash GraphQL and Auth0

## Create a Slash GraphQL Instance

1. Create an account with Slash [GraphQL](https://slash.dgraph.io)
2. Launch a new backend
3. Copy the GraphQL Endpoint URL to the `.env` variable for `REACT_APP_GRAPHQL_ENDPOINT`

## Configure Auth0

1. Create an account on auth0.com
2. Create a new Application using the Single Page Application type.
3. From the Application Settings on Auth0, copy the Domain to `.env` `REACT_APP_AUTH0_DOMAIN`
4. From the Application Settings on Auth0, copy the Client ID to `.env` `REACT_APP_AUTH0_CLIENT_ID`
5. In the Application Settings on Auth0, set the Allowed Callback URLs, Allowed Logout URLs, and the Allowed Web Origins to your domain. For developing locally, this would most likey be `http://localhost:3000/`
6. Run the command `npm run auth0-rule-gen` to replace environment variables in `/deploy/auth0RuleTemplate.js` generating the `auth0Rule.js` file.
7. Copy the generated `deploy/auth0Rule.js` file contents and paste into a new rule on your Auth0 Dashboard.
8. Retrieve your Certificate `[Domain].pem` file

- In the Application Setting on Auth0, copy the Domain
- In a web browser of your choice, paste in the domain followed by `/pem`
  For example `dev-12abcdef.us.auth0.com/pem`
- This will download a file named matching your Domain with a `.pem` extension.

9. Move this file to the deploy directory and rename it to `cert.pem`

## Deploy schema to Slash GraphQL

**NOTE**: Running the following command will override the schema on your Slash GraphQL Instance. If you are running this on an existing schema, first, update your schema in `deploy/schema.graphql`. The `Dgraph.Authorization` will be added automatically.

From the command line run the command: `npm run slash-deploy`

This will do the following:

- Login to Slash with the CLI (will open a browser window to confirm code)
- Update the `deploy/schema.graphql` file using the cert.pem and .env variables declared in the previous steps.
- Deploys the updated schema to Slash
- Updated the generated GraphQL types and operation hook files.

## Start the App

From the command line run the command: `npm start`

This will open a new browser tab for your app, allowing you to do the following:

- See a status of connectivity to Slash. E.g. "Successfully connected to Slash GraphQL! Found X user(s)"
- Perform CRUD operations with the Test type. (See `src/TestNodes` for example code)
- Authenticate with Auth0 showing one of the following messages and buttons:
  - "There is currently no Authenticated User" | "Authenticate with Auth0"
  - "A login was successful with the following user data: [json]" | "Logout"
- Quick Link to [Learn Slash](https://dgraph.io/learn)
- Quick Link to [Learn React](https://reactjs.org/)

## Develop your App

We have included the basics here to get you started with your own app development very quickly. We even have included some recommended VS Code extensions that may be helpful to you.

## Noteworthy Tidbits:

- If you delete all operations.graphql file and run the `generate` script, it will result in errors. To resolve this, disable `withHooks` in codegen.yml
- The graphql.vscode-graphql extension is capable of running queries and mutations in the workspace. To do this though, you will need to edit graphql.config.yml to have your actual URL instead of using the environment variable.
- We have included a helper utility `onDeleteUpdateCache` to update the cache when running delete mutations. To see it in action, see src/TestNodes/index.tsx
- If you want to customize your login logic and add claims, read the comments in `auth0RuleTemplate.js`.
- This project is purposefully left mostly unstyled. You may already have your favorite style system or prefer to start from scratch. We recommend using [Semantic UI React](https://react.semantic-ui.com/)
- In the default schema, the `User` type is used for storing and relating authenticated users to other data. The `Test` is used to display the CRUD operation example. The `RestrictedByRole` and `RestrictedByOwner` examplify the two different types of auth rules. If you change the `User` type other than adding more fields, the auth0Rule will no longer work correctly and will need updated.

## Advanced Configuration

It is possible to script out the rule deploy to your Auth0 Application. We have started some of this for you in utils/updateRuleWithEnv.js but have left it commented out. This requires some advanced configuration in your Auth0 dashboard briefly explained in the comments of that file. This configuration changes the type of Application and conflicts with a quick setup. If you decide to automate the rule deployment, you will also need to consider the Application environment then using a M2M type instead of SPA. You could create a separate Auth0 application for managing the rules as a M2M application within the same tenant. We are open to PRs if you want to improve upon this template.
