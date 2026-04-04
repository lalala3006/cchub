import { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { githubToolsApi } from '../../api/githubToolsApi';
import { getErrorMessage } from '../../api/types';
import type { FocusConfig } from '../../api/githubToolsApi';
import styles from './ConfigModal.module.css';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConfigModal({ open, onClose }: ConfigModalProps) {
  const [configs, setConfigs] = useState<FocusConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [weight, setWeight] = useState(5);

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
    } catch (error) {
      message.error(getErrorMessage(error, '加载配置失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!keyword.trim()) return;
    try {
      await githubToolsApi.createConfig(keyword.trim(), weight);
      message.success('添加成功');
      setKeyword('');
      setWeight(5);
      await loadConfigs();
    } catch (error) {
      message.error(getErrorMessage(error, '添加失败'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await githubToolsApi.deleteConfig(id);
      message.success('删除成功');
      await loadConfigs();
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败'));
    }
  };

  const handleUpdateWeight = async (id: number, w: number) => {
    try {
      await githubToolsApi.updateConfig(id, w);
      await loadConfigs();
    } catch (error) {
      message.error(getErrorMessage(error, '更新失败'));
    }
  };

  return (
    <Modal
      title="关注领域配置"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      className={styles.modal}
    >
      <div className={styles.form}>
        <input
          type="text"
          className={styles.input}
          placeholder="输入关键词，如: AI, low-code, cli-tool"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className={styles.weightRow}>
          <span className={styles.weightLabel}>权重</span>
          <input
            type="range"
            min="1"
            max="10"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.weightValue}>{weight}</span>
        </div>
        <button className={styles.addBtn} onClick={handleAdd}>
          添加
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : configs.length === 0 ? (
          <div className={styles.empty}>暂无配置，点击上方添加</div>
        ) : (
          configs.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemKeyword}>{item.keyword}</span>
                <div className={styles.itemWeight}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={item.weight}
                    onChange={(e) => handleUpdateWeight(item.id, Number(e.target.value))}
                    className={styles.sliderSmall}
                  />
                  <span className={styles.weightValue}>{item.weight}</span>
                </div>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(item.id)}
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
