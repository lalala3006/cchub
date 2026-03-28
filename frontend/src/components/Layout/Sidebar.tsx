import { NavLink } from 'react-router-dom';
import styles from './Layout.module.css';

interface NavItem {
  path: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/todo', label: 'TODO' },
  { path: '/accounting', label: '记账' },
  { path: '/skills', label: 'Skills' },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.sidebarTitle}>ccHub</h1>
      <nav>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.path} className={styles.navItem}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
