import { Link, Outlet, useLocation } from 'react-router-dom';
import DemoNotice from './DemoNotice';
import GarageModal from './GarageModal';
import { useGarage } from '../context/GarageContext';

export default function Layout() {
  const location = useLocation();
  const { garage, isDemo, openModal } = useGarage();
  
  return (
    <div className="app-container">
      <DemoNotice />
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="nav-brand">Garahe</Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/vehicles" className={`nav-link ${location.pathname.startsWith('/vehicles') ? 'active' : ''}`}>Vehicles</Link>
          </div>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="garage-badge-btn"
            onClick={openModal}
            title="View, copy, or switch garage workspace code"
          >
            <span className="garage-badge-dot" style={{ backgroundColor: isDemo ? '#38bdf8' : '#10b981' }} />
            <span className="garage-badge-label">Garage:</span>
            <span className="garage-badge-code">{garage.id.toUpperCase()}</span>
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet key={garage.id} />
      </main>
      <GarageModal />
    </div>
  );
}
