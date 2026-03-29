import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Sidebar } from './Sidebar';
import { ConfigModal } from '../GithubTools/ConfigModal';
import styles from './Layout.module.css';

export function Layout() {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const location = useLocation();
  const isGithubToolsPage = location.pathname === '/github-tools';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        {isGithubToolsPage && (
          <div className={styles.topRightIcon}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setConfigModalOpen(true)}
              title="GitHub 工具配置"
            />
          </div>
        )}
        <Outlet />
      </main>
      <ConfigModal open={configModalOpen} onClose={() => setConfigModalOpen(false)} />
    </div>
  );
}
