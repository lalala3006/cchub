import { useState, useEffect } from 'react';
import { Modal, Form, Input, Slider, Button, List, Space, message } from 'antd';
import { githubToolsApi } from '../../api/githubToolsApi';
import type { FocusConfig } from '../../api/githubToolsApi';
import styles from './ConfigModal.module.css';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConfigModal({ open, onClose }: ConfigModalProps) {
  const [configs, setConfigs] = useState<FocusConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      loadConfigs();
    }
  }, [open]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await githubToolsApi.getConfig();
      setConfigs(data);
    } catch {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values: { keyword: string; weight: number }) => {
    try {
      await githubToolsApi.createConfig(values.keyword, values.weight);
      message.success('添加成功');
      form.resetFields();
      loadConfigs();
    } catch {
      message.error('添加失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await githubToolsApi.deleteConfig(id);
      message.success('删除成功');
      loadConfigs();
    } catch {
      message.error('删除失败');
    }
  };

  const handleUpdateWeight = async (id: number, weight: number) => {
    try {
      await githubToolsApi.updateConfig(id, weight);
      loadConfigs();
    } catch {
      message.error('更新失败');
    }
  };

  return (
    <Modal title="GitHub 工具收藏配置" open={open} onCancel={onClose} footer={null} width={600}>
      <Form form={form} layout="inline" onFinish={handleAdd} className={styles.form}>
        <Form.Item name="keyword" rules={[{ required: true, message: '请输入关键词' }]}>
          <Input placeholder="关注领域关键词" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="weight" initialValue={5} rules={[{ required: true }]}>
          <Slider min={1} max={10} style={{ width: 120 }} tooltip={{ formatter: (v) => `权重: ${v}` }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            添加
          </Button>
        </Form.Item>
      </Form>

      <List
        className={styles.list}
        loading={loading}
        dataSource={configs}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" danger onClick={() => handleDelete(item.id)}>
                删除
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={item.keyword}
              description={
                <Space>
                  <span>权重:</span>
                  <Slider
                    min={1}
                    max={10}
                    value={item.weight}
                    style={{ width: 100 }}
                    onChange={(v) => handleUpdateWeight(item.id, v)}
                    tooltip={{ formatter: (v) => `${v}` }}
                  />
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
