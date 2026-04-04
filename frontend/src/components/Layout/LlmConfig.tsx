import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, message } from 'antd';
import { systemConfigApi } from '../../api/systemConfigApi';
import styles from './LlmConfig.module.css';

interface LlmConfigForm {
  apiUrl: string;
  apiKey: string;
  model: string;
}

interface LlmConfigProps {
  fullPage?: boolean;
}

export const LlmConfig: React.FC<LlmConfigProps> = ({ fullPage = false }) => {
  const [collapsed, setCollapsed] = useState(!fullPage);
  const [loading, setLoading] = useState(false);
  const [apiKeyPlaceholder, setApiKeyPlaceholder] = useState('sk-...');
  const [form] = Form.useForm();

  const loadConfig = useCallback(async () => {
    try {
      const config = await systemConfigApi.getLlmConfig();
      setApiKeyPlaceholder(config.apiKey || 'sk-...');
      form.setFieldsValue({
        ...config,
        apiKey: '',
      });
    } catch {
      message.error('加载配置失败，请刷新页面重试');
    }
  }, [form]);

  useEffect(() => {
    if (!collapsed || fullPage) {
      void loadConfig();
    }
  }, [collapsed, fullPage, loadConfig]);

  const handleSave = async (values: LlmConfigForm) => {
    setLoading(true);
    try {
      await systemConfigApi.updateLlmConfig({
        apiUrl: values.apiUrl,
        model: values.model,
        ...(values.apiKey.trim() ? { apiKey: values.apiKey.trim() } : {}),
      });
      message.success('配置已保存');
      form.setFieldValue('apiKey', '');
      await loadConfig();
      if (!fullPage) setCollapsed(true);
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (fullPage) {
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className={styles.form}
      >
        <Form.Item
          name="apiUrl"
          label="API URL"
          rules={[
            { required: true, message: '请输入 API URL' },
            { pattern: /^https:\/\//, message: 'API URL 必须使用 HTTPS' }
          ]}
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>
        <Form.Item name="apiKey" label="API Key">
          <Input.Password placeholder={apiKeyPlaceholder} />
        </Form.Item>
        <Form.Item name="model" label="模型">
          <Input placeholder="gpt-4o" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          保存配置
        </Button>
      </Form>
    );
  }

  return (
    <div className={styles.llmConfig}>
      <div className={styles.header} onClick={() => setCollapsed(!collapsed)}>
        LLM 配置 {collapsed ? '▼' : '▲'}
      </div>
      {!collapsed && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className={styles.form}
        >
          <Form.Item
            name="apiUrl"
            label="API URL"
            rules={[
              { required: true, message: '请输入 API URL' },
              { pattern: /^https:\/\//, message: 'API URL 必须使用 HTTPS' }
            ]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key">
            <Input.Password placeholder={apiKeyPlaceholder} />
          </Form.Item>
          <Form.Item name="model" label="模型">
            <Input placeholder="gpt-4o" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存配置
          </Button>
        </Form>
      )}
    </div>
  );
};
