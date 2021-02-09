import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  // useRef,
  useState,
} from 'react';
import {
  addResponseMessage,
  addUserMessage,
  setQuickButtons,
  // toggleInputDisabled,
  // toggleMsgLoader,
  dropMessages,
  // markAllAsRead,
} from 'react-chat-widget';
import useSlashbotInit from './init';
import { gql, GraphQLClient } from 'graphql-request';
import useStateCallback from './useStateCallback';
import { IBlock } from '.';

const ADD_MESSAGE = gql`
  mutation addMessage($message: AddMessageInput!) {
    addMessage(input: [$message]) {
      message {
        id
        by {
          username
          displayName
          picture
        }
        read
        at
      }
    }
  }
`;

const QUERY_ROOT = gql`
  query queryRoot {
    queryBlock(filter: { isRoot: true }) {
      id
      format
      delay
      content
      next {
        id
      }
      author {
        username
        displayName
        picture
      }
    }
  }
`;

const GET_BLOCK = gql`
  query getBlock($id: ID!) {
    getBlock(id: $id) {
      id
      format
      delay
      content
      next {
        id
      }
      author {
        username
        displayName
        picture
      }
    }
  }
`;

const GET_BLOCKS = gql`
  query getBlocks($id: [ID!]!) {
    queryBlock(filter: { id: $id }) {
      id
      format
      delay
      content
      next {
        id
      }
      author {
        username
        displayName
        picture
      }
    }
  }
`;

const SEARCH_BLOCKS = gql`
  query searchBlocks($search: String!) {
    queryBlock(
      filter: {
        and: [{ isSearchable: true }, { content: { anyoftext: $search } }]
      }
    ) {
      id
      format
      delay
      content
      next {
        id
      }
      author {
        username
        displayName
        picture
      }
    }
  }
`;

interface SlashbotContextProps {
  client?: GraphQLClient;
  showChatWidget: boolean;
  toggleChatWidget: (show?: boolean) => void;
  handleNewUserMessage: (newMessage: string) => void;
  handleQuickButtonClicked: (button: string) => void;
  parentBlock?: IBlock;
  setParentBlock: (block: IBlock) => void;
  previousParentBlock: () => void;
  parentBlockHistoryCount?: number;
}

const SlashbotContext = React.createContext<SlashbotContextProps>({
  showChatWidget: false,
  toggleChatWidget: () => {},
  handleNewUserMessage: () => {},
  handleQuickButtonClicked: () => {},
  setParentBlock: () => {},
  previousParentBlock: () => {},
});

export default SlashbotContext;

export interface SlashbotProviderProps {
  GraphQLEndpoint: string;
  restartTrigger: string;
  storageKey: string;
  storageType?: 'sessionStorage' | 'localStorage' | 'none';
  botUsername?: string;
  token?: string;
  headerKey?: string;
  username?: string;
  onSetUser?: (username: string) => void;
}

export const SlashbotProvider: React.FC<SlashbotProviderProps> = ({
  GraphQLEndpoint,
  restartTrigger,
  storageKey,
  storageType = 'none',
  children,
  botUsername = 'slashbot',
  token,
  headerKey,
  username: user,
  // onSetUser,
}) => {
  const [showChatWidget, setShowChatWidget] = useState(true);
  const toggleChatWidget = useCallback((show?: boolean) => {
    if (typeof show === 'boolean') return setShowChatWidget(show);
    return setShowChatWidget((show) => !show);
  }, []);

  const [username, setUsernameState] = useStateCallback(user);
  useEffect(() => {
    if (user) setUsernameState(user);
  }, [setUsernameState, user]);
  // const setUserName = (username: React.SetStateAction<string | undefined>) => {
  //   setUsernameState(username, (username) => {
  //     if (username) onSetUser?.(username);
  //   });
  // };

  const { client, conversationID, conversation } = useSlashbotInit(
    GraphQLEndpoint,
    storageKey,
    storageType,
    token,
    headerKey,
    username,
  );
  console.log(conversationID);
  const messages = useMemo(() => {
    return conversation.data?.getConversation?.messages || [];
  }, [conversation.data]);

  const loaded = conversation.called && !conversation.loading;

  // const [messageLoading, setMessageLoading] = useState(true);
  // useEffect(() => {
  //   toggleMsgLoader();
  // }, [messageLoading]);
  // const toggleMessageLoading = (setLoading?: boolean) => {
  //   if (typeof setLoading === 'boolean') {
  //     setMessageLoading(setLoading);
  //   } else {
  //     setMessageLoading((loading) => !loading);
  //   }
  // };

  // const [, setInputDisabled] = useState(false);
  // const toggleInput = (setDisabled?: boolean) => {
  //   if (typeof setDisabled === 'boolean') {
  //     setInputDisabled((isDisabled) => {
  //       if (isDisabled !== setDisabled) {
  //         toggleInputDisabled();
  //       }
  //       return setDisabled;
  //     });
  //   } else {
  //     toggleInputDisabled();
  //     setInputDisabled((disabled) => !disabled);
  //   }
  // };

  const nextBlocks = useCallback(
    (blocks: IBlock[]) => {
      console.log('called', blocks.length);
      console.log(conversationID);
      if (blocks.length === 1) {
        const block = blocks[0];
        console.log(block);
        if (block?.content) {
          addResponseMessage(block.content);
          if (conversationID)
            client.request(ADD_MESSAGE, {
              message: {
                at: new Date(),
                content: block.content,
                in: { id: conversationID },
                by: { username: botUsername },
              },
            });
        }
        console.log(block?.next?.length);
        if (block?.next?.length && block.next.length > 0) {
          const ids = block?.next?.map?.((b: any) => b.id);
          client
            .request(GET_BLOCKS, {
              id: ids,
            })
            .then((data) => {
              if (data?.queryBlock) nextBlocks(data.queryBlock);
            });
        }
      } else if (blocks.length > 1) {
        setQuickButtons(
          blocks.map((b) => ({
            value: JSON.stringify({ id: b.id, value: b.content }),
            label: b.content || '',
          })),
        );
        addResponseMessage('Pick one of the below options to continue.');
      }
    },
    [botUsername, client, conversationID],
  );

  const start = useCallback(() => {
    client.request(QUERY_ROOT).then((data) => {
      console.log(data);
      if (data?.queryBlock?.length === 1) {
        nextBlocks(data.queryBlock);
      } else if (data?.queryBlock?.length && data.queryBlock.length > 1) {
        addResponseMessage('FIXME: There are more than one root blocks');
      } else {
        addResponseMessage('Welcome to Slashbot. Please train your bot.');
      }
    });
  }, [client, nextBlocks]);

  const handleQuickButtonClicked = useCallback(
    (b: string) => {
      const button = JSON.parse(b);
      addUserMessage(button.value);
      setQuickButtons([]);
      client
        .request(GET_BLOCK, {
          id: button.id,
        })
        .then((data) => {
          if (data?.getBlock) nextBlocks([data.getBlock]);
        });
    },
    [client, nextBlocks],
  );

  const [buttonHandler, setButtonHandler] = useState(
    () => handleQuickButtonClicked,
  );

  const handleNewUserMessage = useCallback(
    (newMessage: string): void => {
      if (newMessage.includes(restartTrigger)) {
        setButtonHandler(() => handleQuickButtonClicked);
        setQuickButtons([]);
        start();
        return;
      }
      if (newMessage) {
        client.request(SEARCH_BLOCKS, { search: newMessage }).then((data) => {
          if (data?.queryBlock) nextBlocks(data.queryBlock);
        });
      }
    },
    [client, handleQuickButtonClicked, nextBlocks, restartTrigger, start],
  );
  const [
    messageHandler,
    // setMessageHandler
  ] = useState(() => handleNewUserMessage);

  // const [,setCheckingUser] = useState(false);
  // const userCheck = () => {
  //   if (username) return null;
  //   setCheckingUser(true);
  //   toggleInput(true);
  //   addResponseMessage(`To assist you better, may we have your email address?`);
  //   setButtonHandler(() => (choice: string) => {
  //     addUserMessage(choice);
  //     setQuickButtons([]);
  //     setButtonHandler(handleQuickButtonClicked);
  //     toggleInput(true);
  //     if (choice === 'yes') {
  //       addResponseMessage(`Please enter your email address now.`);
  //       setMessageHandler(() => (email: string) => {
  //         setUserName(email);
  //         setMessageHandler(handleNewUserMessage);
  //         setCheckingUser(false);
  //       });
  //     } else {
  //       setCheckingUser(false);
  //     }
  //   });
  //   setQuickButtons([
  //     {
  //       value: 'no',
  //       label: 'Skip',
  //     },
  //     {
  //       value: 'yes',
  //       label: 'Yes',
  //     },
  //   ]);
  // };

  useLayoutEffect((): any => {
    if (loaded) {
      // toggleMessageLoading(true);
      // const timer = setTimeout(() => {
      // if (messages.length) {
      //   dropMessages();
      //   for (let i = 0; i < messages.length; i++) {
      //     if (messages[i].content)
      //       addResponseMessage(messages[i].content as string);
      //   }
      // addResponseMessage('TODO: add recent messages');
      // } else {
      dropMessages();
      start();
      // }
      // toggleMessageLoading(false);
      // }, 1.5 * 1000);
      // return () => clearTimeout(timer);
    }
  }, [messages, loaded, start]);

  const [parentBlock, _setParentBlock] = useState<IBlock>();
  const [parentHistory, _setParentHistoryBlock] = useState<IBlock[]>();

  const setParentBlock = useCallback(
    (block: IBlock) => {
      if (parentBlock)
        _setParentHistoryBlock((blocks) => {
          if (blocks?.length) return [...blocks, parentBlock];
          return [parentBlock];
        });
      _setParentBlock(block);
    },
    [parentBlock],
  );

  const previousParentBlock = () => {
    if (parentHistory?.length) {
      const newHistory = [...parentHistory];
      _setParentBlock(newHistory.pop());
      _setParentHistoryBlock(newHistory);
    }
  };

  const context = {
    client,
    showChatWidget,
    toggleChatWidget,
    handleNewUserMessage: messageHandler,
    handleQuickButtonClicked: buttonHandler,
    parentBlock,
    setParentBlock,
    previousParentBlock,
    parentBlockHistoryCount: parentHistory?.length ? parentHistory.length : 0,
  };

  return <SlashbotContext.Provider value={context} children={children} />;
};
