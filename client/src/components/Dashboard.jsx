import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { listVehicles, listMaintenanceEntries } from '../api';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageTitle('Dashboard');

  useEffect(() => {
    async function loadData() {
      try {
        const [vs, entries] = await Promise.all([
          listVehicles(),
          listMaintenanceEntries(), // all entries, no vehicleId filter
        ]);
        setVehicles(vs);
        setAllEntries(entries);
        // Sort by date desc, take the 5 most recent
        const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentEntries(sorted.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute summary stats across ALL entries
  const totalSpent = allEntries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const totalJobs = allEntries.length;
  const lastServiceAll = allEntries.length > 0
    ? [...allEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Summary stat cards */}
      <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="card stat-card">
          <p className="text-muted stat-label">Total Vehicles</p>
          <p className="stat-value">{vehicles.length}</p>
        </div>
        <div className="card stat-card">
          <p className="text-muted stat-label">Total Jobs</p>
          <p className="stat-value">{totalJobs}</p>
        </div>
        <div className="card stat-card">
          <p className="text-muted stat-label">Total Spent</p>
          <p className="stat-value">₱{totalSpent.toLocaleString()}</p>
        </div>
        {lastServiceAll && (
          <div className="card stat-card">
            <p className="text-muted stat-label">Last Service</p>
            <p className="stat-value" style={{ fontSize: '1.2rem' }}>{lastServiceAll}</p>
          </div>
        )}
      </div>

      {/* Vehicle cards */}
      <h2 style={{ marginBottom: '1rem' }}>Your Vehicles</h2>
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        {vehicles.length === 0 ? (
          <div className="card empty-state">
            <span className="empty-icon">🚗</span>
            <p className="text-muted">No vehicles added yet.</p>
            <Link to="/vehicles" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Add your first vehicle
            </Link>
          </div>
        ) : (
          vehicles.map(v => {
            const vehicleEntries = recentEntries.filter(e => String(e.vehicleId) === String(v.id));
            const lastService = vehicleEntries.length > 0 ? vehicleEntries[0].date : null;
            return (
              <div key={v.id} className="card vehicle-summary-card">
                <h2>{v.model}</h2>
                <div className="vehicle-meta">
                  <span className="text-muted">🛣 {v.currentMileage.toLocaleString()} km</span>
                  {lastService && (
                    <span className="text-muted">🔧 Last: {lastService}</span>
                  )}
                </div>
                <Link to={`/vehicles/${v.id}/history`} className="btn btn-outline" style={{ marginTop: '1rem' }}>
                  View History
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* Recent maintenance across all vehicles */}
      <h2 style={{ marginBottom: '1rem' }}>Recent Maintenance</h2>
      {recentEntries.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-icon">📋</span>
          <p className="text-muted">No maintenance records yet. Select a vehicle to add one.</p>
        </div>
      ) : (
        <div className="list-group">
          {recentEntries.map(e => {
            const vehicle = vehicles.find(v => String(v.id) === String(e.vehicleId));
            return (
              <Link
                key={e.id}
                to={vehicle ? `/vehicles/${vehicle.id}/history` : '/vehicles'}
                className="card recent-entry-card recent-entry-link"
              >
                <div className="recent-entry-main">
                  <strong style={{ color: 'var(--accent-color)' }}>{e.jobType}</strong>
                  <span className="badge-vehicle">{vehicle ? vehicle.model : 'Unknown vehicle'}</span>
                </div>
                <div className="recent-entry-meta">
                  <span className="text-muted">{e.date}</span>
                  <span className="text-muted">{Number(e.mileage).toLocaleString()} km</span>
                  <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>₱{Number(e.cost).toLocaleString()}</span>
                  <span className="recent-entry-arrow">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
