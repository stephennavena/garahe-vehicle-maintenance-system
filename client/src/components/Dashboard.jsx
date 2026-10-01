import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { listVehicles, listMaintenanceEntries, listFuelLogs } from '../api';
import { computeReminders } from '../utils/serviceReminders';
import SpendingChart from './SpendingChart';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [allFuelLogs, setAllFuelLogs] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageTitle('Dashboard');

  useEffect(() => {
    async function loadData() {
      try {
        const [vs, entries, fuel] = await Promise.all([
          listVehicles(),
          listMaintenanceEntries(),
          listFuelLogs(),
        ]);
        setVehicles(vs);
        setAllEntries(entries);
        setAllFuelLogs(fuel);
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

  // Summary stats across ALL vehicles
  const totalSpent = allEntries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const totalFuelSpent = allFuelLogs.reduce((sum, l) => sum + (Number(l.totalCost) || 0), 0);
  const totalJobs = allEntries.length;
  const lastServiceAll = allEntries.length > 0
    ? [...allEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : null;

  // Reminder counts across all vehicles (for dashboard badge on stat card)
  const vehicleEntriesMap = {};
  for (const e of allEntries) {
    if (!vehicleEntriesMap[e.vehicleId]) vehicleEntriesMap[e.vehicleId] = [];
    vehicleEntriesMap[e.vehicleId].push(e);
  }
  const allReminders = vehicles.flatMap(v =>
    computeReminders(vehicleEntriesMap[v.id] || [], v.currentMileage)
  );
  const overdueCount = allReminders.filter(r => r.status === 'overdue').length;
  const dueSoonCount = allReminders.filter(r => r.status === 'due-soon').length;

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

      {/* Alerts row */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="alerts-row" style={{ marginBottom: '1.5rem' }}>
          {overdueCount > 0 && (
            <div className="alert-banner alert-overdue">
              🔴 <strong>{overdueCount} service{overdueCount !== 1 ? 's' : ''} overdue</strong>
              <span className="text-muted"> — check your vehicles for details</span>
            </div>
          )}
          {dueSoonCount > 0 && (
            <div className="alert-banner alert-due-soon">
              🟡 <strong>{dueSoonCount} service{dueSoonCount !== 1 ? 's' : ''} due soon</strong>
              <span className="text-muted"> — upcoming maintenance required</span>
            </div>
          )}
        </div>
      )}

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
          <p className="text-muted stat-label">Maintenance Spent</p>
          <p className="stat-value">₱{totalSpent.toLocaleString()}</p>
        </div>
        <div className="card stat-card">
          <p className="text-muted stat-label">Fuel Spent</p>
          <p className="stat-value">₱{totalFuelSpent.toLocaleString()}</p>
        </div>
        {lastServiceAll && (
          <div className="card stat-card">
            <p className="text-muted stat-label">Last Service</p>
            <p className="stat-value" style={{ fontSize: '1.2rem' }}>{lastServiceAll}</p>
          </div>
        )}
      </div>

      {/* Spending chart */}
      {allEntries.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Spending Over Time</h2>
          <SpendingChart entries={allEntries} fuelLogs={allFuelLogs} />
        </div>
      )}

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
            const vEntries = vehicleEntriesMap[v.id] || [];
            const vFuel = allFuelLogs.filter(l => String(l.vehicleId) === String(v.id));
            const reminders = computeReminders(vEntries, v.currentMileage);
            const overdue = reminders.filter(r => r.status === 'overdue');
            const dueSoon = reminders.filter(r => r.status === 'due-soon');
            const lastService = vEntries.length > 0
              ? [...vEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
              : null;
            const totalVehicleSpent = vEntries.reduce((s, e) => s + Number(e.cost || 0), 0)
              + vFuel.reduce((s, l) => s + Number(l.totalCost || 0), 0);

            return (
              <div key={v.id} className="card vehicle-summary-card">
                {v.photoUrl && (
                  <div className="vehicle-photo-preview">
                    <img src={v.photoUrl} alt={v.model} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <h2 style={{ marginBottom: '0.5rem' }}>{v.model}</h2>
                  {overdue.length > 0 && (
                    <span className="reminder-badge badge-overdue" title={overdue.map(r => r.detail).join('\n')}>
                      🔴 {overdue.length} overdue
                    </span>
                  )}
                  {overdue.length === 0 && dueSoon.length > 0 && (
                    <span className="reminder-badge badge-due-soon" title={dueSoon.map(r => r.detail).join('\n')}>
                      🟡 {dueSoon.length} due soon
                    </span>
                  )}
                </div>
                <div className="vehicle-meta" style={{ marginBottom: '0.75rem' }}>
                  <span className="text-muted">🛣 {v.currentMileage.toLocaleString()} km</span>
                  {lastService && <span className="text-muted">🔧 Last: {lastService}</span>}
                  <span className="text-muted">💰 ₱{totalVehicleSpent.toLocaleString()} total</span>
                </div>
                <Link to={`/vehicles/${v.id}/history`} className="btn btn-outline" style={{ marginTop: 'auto' }}>
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
                  {e.shopName && <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>📍 {e.shopName}</span>}
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
