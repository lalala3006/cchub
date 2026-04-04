import { LlmConfig } from '../components/Layout/LlmConfig';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>设置</h1>
      </div>
      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>LLM 配置</h2>
          <p className={styles.sectionDesc}>配置大模型 API，用于 AI 对话功能</p>
          <LlmConfig fullPage />
        </section>
      </div>
    </div>
  );
}
