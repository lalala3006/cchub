import { useState } from 'react';
import { Button, Form, Input, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/types';
import { authApi } from '../features/auth/authApi';
import { setAuthenticatedSession } from '../features/auth/authStore';
import styles from './LoginPage.module.css';

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  const handleFinish = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(values.username, values.password);
      setAuthenticatedSession(response.user, response.accessToken);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError, '登录失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <Typography.Title level={2}>登录 ccHub</Typography.Title>
        <Typography.Paragraph className={styles.description}>
          登录后可访问 TODO、GitHub 工具、设置和多轮对话助手。
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input autoComplete="username" placeholder="admin" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password autoComplete="current-password" placeholder="请输入密码" />
          </Form.Item>

          {error ? <div className={styles.error}>{error}</div> : null}

          <Button block type="primary" htmlType="submit" loading={loading}>
            登录
          </Button>
        </Form>
      </div>
    </div>
  );
}
