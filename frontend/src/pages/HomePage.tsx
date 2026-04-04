import { useState, useRef, useEffect } from 'react';
import { SendOutlined, RobotOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import { apiRequest } from '../api/client';
import { getErrorMessage } from '../api/types';
import { appendChatMessage, setChatError, setChatLoading, useChatStore } from '../features/chat/chatStore';
import { buildConversationContext, buildLlmMessages } from '../features/chat/contextBuilder';
import type { ChatMessage } from '../features/chat/chat.types';
import styles from './HomePage.module.css';

export function HomePage() {
  const messages = useChatStore((state) => state.messages);
  const loading = useChatStore((state) => state.loading);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    appendChatMessage(userMessage);
    setInput('');
    setChatLoading(true);
    setChatError(null);

    try {
      const context = await buildConversationContext();
      const response = await callLlm([...messages, userMessage], context);

      appendChatMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setChatError(getErrorMessage(error, '请稍后重试'));
      appendChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，发生了错误：${getErrorMessage(error, '请稍后重试')}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setChatLoading(false);
    }
  };

  const callLlm = async (currentMessages: ChatMessage[], context: Awaited<ReturnType<typeof buildConversationContext>>): Promise<string> => {
    const response = await apiRequest<{ reply?: string }>('/llm/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: buildLlmMessages(currentMessages, context),
      }),
    });

    return response.reply || '抱歉，没有得到有效回复。';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>主页</h1>
        <p className={styles.subtitle}>AI 对话助手</p>
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.messages}>
          {messages.map(msg => (
            <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
              <div className={styles.messageIcon}>
                {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageText}>{msg.content}</div>
                <div className={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <div className={styles.messageIcon}>
                <LoadingOutlined />
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageText}>思考中...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            className={styles.input}
            placeholder="输入你的问题..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <SendOutlined />
          </button>
        </div>
      </div>
    </div>
  );
}
