import { Link, Outlet, useLocation } from 'react-router-dom';
import DemoNotice from './DemoNotice';

export default function Layout() {
  const location = useLocation();
  
  return (
    <div className="app-container">
      <DemoNotice />
      <nav className="navbar">
        <Link to="/" className="nav-brand">Garahe</Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/vehicles" className={`nav-link ${location.pathname.startsWith('/vehicles') ? 'active' : ''}`}>Vehicles</Link>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
