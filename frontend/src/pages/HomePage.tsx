import { useState, useRef, useEffect } from 'react';
import { SendOutlined, RobotOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import { githubToolsApi } from '../api/githubToolsApi';
import { API_BASE_URL } from '../api/githubToolsApi';
import styles from './HomePage.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 ccHub 的 AI 助手。我可以帮你查询和管理你的 TODO、GitHub 工具收藏等信息。有什么我可以帮你的吗？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = await buildContext();
      const response = await callLlm(input.trim(), context);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '请稍后重试'}`,
        timestamp: new Date(),
      }]);
    }

    setLoading(false);
  };

  const buildContext = async (): Promise<string> => {
    let context = '你是一个助手。以下是用户的项目信息：\n\n';

    try {
      const todos = await fetch(`${API_BASE_URL}/todos`).then(r => r.json()).catch(() => []);
      if (todos.length > 0) {
        context += '## TODO 列表\n';
        todos.forEach((todo: any) => {
          context += `- ${todo.title} ${todo.completed ? '[已完成]' : '[未完成]'}\n`;
        });
        context += '\n';
      }
    } catch {}

    try {
      const collection = await githubToolsApi.getCollection('deep_use', '');
      if (collection.length > 0) {
        context += '## 深度使用的 GitHub 工具\n';
        collection.forEach((record: any) => {
          const tool = record.tool;
          context += `- ${tool.name}: ${tool.description || '无描述'}\n`;
        });
        context += '\n';
      }
    } catch {}

    return context;
  };

  const callLlm = async (userInput: string, context: string): Promise<string> => {
    const fullPrompt = `${context}\n\n用户问题: ${userInput}`;

    const response = await fetch(`${API_BASE_URL}/llm/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: fullPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.reply || '抱歉，没有得到有效回复。';
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
                  {msg.timestamp.toLocaleTimeString()}
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
