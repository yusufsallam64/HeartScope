import { useRef } from 'react';
import { Message, Conversation } from "@/lib/db/types";
import MessageInput from './MessageInput';
import ChatCallToAction from './ChatCallToAction';

interface ChatInterfaceProps {
  currentConversation: Conversation | undefined;
  messages: Message[] | undefined;
  message: string;
  setMessage: (message: string) => void;
  error: string;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent, messageOverride?: string, isGuruMode?: boolean) => Promise<void>;
}

export const ChatInterface = ({
  currentConversation,
  messages,
  message,
  setMessage,
  error,
  isLoading,
  handleSubmit,
}: ChatInterfaceProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full flex flex-col bg-background-900/30 backdrop-blur-xl rounded-2xl border border-primary-200/30 shadow-lg overflow-hidden max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary-200/30 bg-gradient-to-r from-background-900/50 to-background-950/50">
        <div className="flex items-center gap-4 flex-row place-content-between w-full">
          <h2 className="text-lg font-title text-secondary-500">
            {currentConversation?.title || "New Conversation"}
          </h2>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div
            ref={messageContainerRef}
            className="h-[calc(100%-4rem)] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary-200/30 scrollbar-track-transparent"
          >
            {
              !messages?.length ? (
                <ChatCallToAction />
            ) : (
                messages.map((msg, index) => (
              <div
                key={index}
                className={`group p-4 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                  msg.role === 'user'
                    ? 'ml-auto w-fit max-w-[80%] bg-accent-500/10 border border-accent-500/20 hover:border-accent-500/30'
                    : 'mr-auto w-fit max-w-[80%] bg-secondary-500/10 border border-secondary-500/20 hover:border-secondary-500/30'
                }`}
              >
                <p className={`text-sm font-medium mb-2 ${
                  msg.role === 'user'
                    ? 'text-accent-400 group-hover:text-accent-300'
                    : 'text-secondary-400 group-hover:text-secondary-300'
                }`}>
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </p>
                <p className="text-text-50 group-hover:text-primary-50 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            )))}
          </div>
          
          <MessageInput
          message={message}
          setMessage={setMessage}
          error={error}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          />
          
        </div>
      </div>
    </div>
  );
};