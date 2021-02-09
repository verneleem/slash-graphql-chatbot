import { gql, GraphQLClient } from 'graphql-request';
import { useMemo, useState, useEffect, useCallback } from 'react';
import storageAvailable from './storageCheck';

const getConversation = gql`
  query getConversation($id: ID!) {
    getConversation(id: $id) {
      id
      by {
        username
        displayName
        picture
      }
      messages(order: { desc: at }, first: 10) {
        id
        content
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
const addConversation = gql`
  mutation addConversation($by: UserRef) {
    addConversation(input: [{ by: $by }]) {
      conversation {
        id
      }
    }
  }
`;

export const useSlashbotInit = (
  endpoint: string,
  key: string,
  type: 'sessionStorage' | 'localStorage' | 'none',
  token?: string,
  headerKey?: string,
  username?: string,
) => {
  /** TODO: use username for the following
   * if username is set {
   *   if conversationID found in memory {
   *     if conversation has user and user id not match {
   *       create new conversation
   *     } else if conversation doesn't have user {
   *       update conversation with username
   *     }
   *   }
   *   when adding new conversation, set username
   * }
   */

  const conversationID = useMemo(() => {
    if (storageAvailable(type)) {
      if (type === 'none') return null;
      return window[type as 'sessionStorage' | 'localStorage']?.getItem?.(key);
    }
    return null;
  }, [key, type]);

  const client = useMemo(() => {
    const headers = headerKey && token ? { [headerKey]: token } : {};
    return new GraphQLClient(endpoint, { headers });
  }, [endpoint, headerKey, token]);

  interface IConversation {
    getConversation?: {
      id: string;
      by?: {
        username: string;
        displayName?: string;
        picture?: string;
      };
      messages?: {
        id: string;
        content?: string;
        by?: {
          username: string;
          displayName?: string;
          picture?: string;
        };
        read: boolean;
        at: Date;
      }[];
    };
  }
  interface Iid {
    id: string;
  }
  const [conversation, setConversation] = useState<{
    data: IConversation | null;
    loading: boolean;
    called: boolean;
  }>({ data: null, loading: false, called: false });

  useEffect(() => {
    if (conversationID) {
      setConversation((conversation) => {
        return { ...conversation, called: true, loading: true };
      });
      client
        .request<IConversation, Iid>(getConversation, {
          id: conversationID as string,
        })
        .then((data) => {
          setConversation((conversation) => {
            return { ...conversation, loading: false, data };
          });
        });
    }
  }, [client, conversationID]);

  const [newID, setNewID] = useState<string | null>(null);
  const addConvo = useCallback(() => {
    return client.request(addConversation).then((data) => {
      if (data.addConversation?.conversation?.[0]?.id) {
        const id = data.addConversation.conversation[0].id;
        console.log(id);
        setNewID(id);
        setConversation({
          loading: false,
          called: true,
          data: { getConversation: { id } },
        });
        if (storageAvailable(type)) {
          window[type as 'sessionStorage' | 'localStorage']?.setItem(key, id);
        }
      }
    });
  }, [client, key, type]);
  useEffect(() => {
    if (!Boolean(conversationID)) addConvo();
  }, [conversationID, addConvo]);
  return {
    client,
    conversation,
    conversationID: conversationID ?? newID,
  };
};
export default useSlashbotInit;
