import React from 'react';
import { Widget } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';

const ChatBot: React.FC = () => {
  const handleNewUserMessage = (newMessage: string) => {
    console.log(newMessage);
  };

  return <Widget handleNewUserMessage={handleNewUserMessage} />;
};

export default ChatBot;
