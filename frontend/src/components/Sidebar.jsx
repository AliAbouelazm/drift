import { NavLink } from 'react-router-dom';
import styles from '../styles/components.module.css';

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarWordmark}>Drift</div>
      <nav>
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/analyze" className={linkClass}>
          Analyze
        </NavLink>
        <NavLink to="/trends" className={linkClass}>
          Trends
        </NavLink>
        <NavLink to="/model" className={linkClass}>
          Model
        </NavLink>
      </nav>
    </aside>
  );
}
