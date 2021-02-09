import React, { ElementType, useContext, useMemo } from 'react';
import { Widget } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';
import SlashbotContext, { SlashbotProvider } from './context';
import './styles.css';

export interface IBlock {
  id?: string;
  isRoot?: string;
  isSearchable?: boolean;
  format?: 'Text' | 'Image' | 'Link' | 'LinkExt';
  delay?: number;
  trigger?: string;
  content?: string;
  next?: IBlock[];
  // This is used only by the bot builder
  expand?: boolean;
}

export interface RCWProps {
  title?: string;
  subtitle?: string;
  senderPlaceHolder?: string;
  profileAvatar?: string;
  titleAvatar?: string;
  showCloseButton?: boolean;
  fullScreenMode?: boolean;
  autoFocus?: boolean;
  launcher?: (handleToggle: () => void) => ElementType;
  showTimeStamp?: boolean;
  chatId?: string;
  launcherOpenLabel?: string;
  launcherCloseLabel?: string;
  sendButtonAlt?: string;
}

const RCW: React.FC<RCWProps> = ({
  title = 'Slashbot',
  subtitle = `A chatbot powered by Dgraph's Slash GraphQL!`,
  profileAvatar = 'https://raw.githubusercontent.com/dgraph-io/graphql-dgraph-web/master/src/images/icons/Vector.png',
  titleAvatar,
  showCloseButton,
  fullScreenMode,
  autoFocus,
  launcher,
  showTimeStamp = false,
  chatId,
  launcherOpenLabel,
  launcherCloseLabel,
  sendButtonAlt,
  senderPlaceHolder,
}) => {
  const {
    showChatWidget,
    handleNewUserMessage,
    handleQuickButtonClicked,
  } = useContext(SlashbotContext);
  return (
    <Widget
      handleNewUserMessage={handleNewUserMessage}
      handleQuickButtonClicked={handleQuickButtonClicked}
      title={title}
      subtitle={subtitle}
      senderPlaceHolder={senderPlaceHolder}
      profileAvatar={profileAvatar}
      titleAvatar={titleAvatar}
      showCloseButton={showCloseButton}
      fullScreenMode={fullScreenMode}
      autoFocus={autoFocus}
      launcher={showChatWidget ? launcher : () => <></>}
      showTimeStamp={showTimeStamp}
      chatId={chatId}
      launcherOpenLabel={launcherOpenLabel}
      launcherCloseLabel={launcherCloseLabel}
      sendButtonAlt={sendButtonAlt}
    />
  );
};

export interface SlashbotProps extends RCWProps {
  GraphQLEndpoint: string;
  restartTrigger?: string;
  storageType?: 'sessionStorage' | 'localStorage' | 'none';
  storageKey?: string;
  token?: string;
  headerKey?: string;
  username?: string;
  onSetUser?: (username: string) => void;
}

const Slashbot: React.FC<SlashbotProps> = ({
  GraphQLEndpoint,
  restartTrigger = 'restart',
  storageType,
  storageKey = 'slashbotConversation',
  title,
  subtitle,
  senderPlaceHolder,
  profileAvatar,
  titleAvatar,
  showCloseButton,
  fullScreenMode,
  autoFocus,
  launcher,
  showTimeStamp,
  chatId,
  launcherOpenLabel,
  launcherCloseLabel,
  sendButtonAlt,
  token,
  headerKey,
  username,
  onSetUser,
  children,
}) => {
  const placeHolder = useMemo(
    () => senderPlaceHolder ?? `Type '${restartTrigger}' to restart bot.`,
    [senderPlaceHolder, restartTrigger],
  );

  return (
    <SlashbotProvider
      GraphQLEndpoint={GraphQLEndpoint}
      restartTrigger={restartTrigger}
      storageType={storageType}
      storageKey={storageKey}
      token={token}
      headerKey={headerKey}
      username={username}
      onSetUser={onSetUser}
    >
      <RCW
        title={title}
        subtitle={subtitle}
        senderPlaceHolder={placeHolder}
        profileAvatar={profileAvatar}
        titleAvatar={titleAvatar}
        showCloseButton={showCloseButton}
        fullScreenMode={fullScreenMode}
        autoFocus={autoFocus}
        launcher={launcher}
        showTimeStamp={showTimeStamp}
        chatId={chatId}
        launcherOpenLabel={launcherOpenLabel}
        launcherCloseLabel={launcherCloseLabel}
        sendButtonAlt={sendButtonAlt}
      />
      {children}
    </SlashbotProvider>
  );
};

export default Slashbot;
