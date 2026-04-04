import { NavLink } from 'react-router-dom';
import { GithubOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './Layout.module.css';
import { clearAuthenticatedSession, useAuthStore } from '../../features/auth/authStore';

const navItems = [
  {
    path: '/',
    label: '主页',
    icon: <HomeOutlined />,
  },
  {
    path: '/todo',
    label: 'TODO',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    path: '/github-tools',
    label: 'GitHub 工具',
    icon: <GithubOutlined />,
  },
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>c</div>
          <span className={styles.logoText}>ccHub</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.path} className={styles.navItem}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userCard}>
          <div className={styles.userName}>{user?.displayName || user?.username}</div>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => clearAuthenticatedSession()}
          >
            退出登录
          </button>
        </div>
        <NavLink to="/settings" className={({ isActive }) => `${styles.settingsLink} ${isActive ? styles.settingsLinkActive : ''}`}>
          <SettingOutlined />
          <span>设置</span>
        </NavLink>
      </div>
    </aside>
  );
}
