import React from 'react';
import logo from './logo.svg';
import './App.css';
import { ApolloProvider } from '@apollo/client';
import createApolloClient from './ApolloConfig';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Slashbot from './Slashbot';
import ReactMarkdown from 'react-markdown';
import Train from './Slashbot/train';

// Use Markdown to render to the page.
const content = `
<center>

# Welcome to Slashbot

## A chatbot powered by Dgraph's [Slash GraphQL](https://slash.dgraph.io)!
</center>

Slashbot is a chatbot that uses an AI that is taught by you. To get started, install Slashbot


**_Coming soon_**, you will be able to run,
> \`\`\`sh
> npm install slashbot
> \`\`\`

But for now, just fork this project.

### 1. Import the Slashbot component and drop it into your index file.

> \`\`\`javascript
> import React from 'react';
> import SlashBot from './Slashbot'
> 
> function App() {
>   return (
>     <div calssName="App">
>       <Slashbot GraphQLEndpoint="https://your-endpoint.location.cloud.dgraph.io/graphql" >
>         {/** Your other components here... */}
>       </Slashbot>
>     </div>
>   )
> }
> \`\`\`

### 2. Drop the \`Train\` anywhere in your app inside of the \`Slashbot\` wrapper. This component is how you add the blocks and routes for the bot to follow.

We dropped ours in a Route:

> \`\`\`javascript
> <Slashbot>
>   <Switch>
>     {/** Other routes here... */}
>     <Route path="/train" component={Train} />
>   </Switch>
> </Slashbot>
> \`\`\`

> #### The bot trainer form is a little buggy still right now. WIP

That is it! You can add some more configuration that is based upon [React Chat Widget](https://www.npmjs.com/package/react-chat-widget).
`;

const Header: React.FC = () => {
  return (
    <header className="App-header">
      <div
        style={{
          width: '700px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <img src={logo} className="App-logo" alt="React logo" />
        <img
          src="https://dgraph.io/assets/images/slashgraphql-logo.svg"
          // src="https://qsius.com/skins/Dgraph/assets/images/favicons/safari-pinned-tab.svg"
          className="Slash-logo"
          alt="Slash GraphQL logo"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/1/17/GraphQL_Logo.svg"
          className="App-logo"
          alt="GraphQL Logo"
        />
      </div>
      <div
        style={{
          width: '700px',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        <Link to="/">Home</Link>
        <Link to="/train">Train Slashbot</Link>
      </div>
    </header>
  );
};

const Main: React.FC = ({ children }) => {
  return (
    <div className="App">
      <Header />
      <div className="Main">{children}</div>
    </div>
  );
};

function Default() {
  return (
    <div style={{ textAlign: 'left', padding: '0 80px 20px 80px' }}>
      <ReactMarkdown children={content} allowDangerousHtml />
    </div>
  );
}

function App() {
  const { isAuthenticated, getIdTokenClaims } = useAuth0();

  return (
    <ApolloProvider
      client={createApolloClient(isAuthenticated ? getIdTokenClaims : null)}
    >
      <Slashbot GraphQLEndpoint="https://vocal-behavior.us-west-2.aws.cloud.dgraph.io/graphql">
        <BrowserRouter>
          <Main>
            <Switch>
              <Route exact path="/" component={Default} />
              <Route path="/train" component={Train} />
            </Switch>
          </Main>
        </BrowserRouter>
      </Slashbot>
    </ApolloProvider>
  );
}

export default App;
