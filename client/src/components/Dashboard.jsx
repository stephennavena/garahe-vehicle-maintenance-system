import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { listVehicles, listMaintenanceEntries } from '../api';
import { computeReminders } from '../utils/serviceReminders';
import SpendingChart from './SpendingChart';

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
          listMaintenanceEntries(),
        ]);
        setVehicles(vs);
        setAllEntries(entries);
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

  // Summary stats
  const totalSpent = allEntries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const totalJobs = allEntries.length;
  const lastServiceAll = allEntries.length > 0
    ? [...allEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : null;

  // Reminder counts
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


      {allEntries.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Spending Over Time</h2>
          <SpendingChart entries={allEntries} />
        </div>
      )}


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
            const reminders = computeReminders(vEntries, v.currentMileage);
            const overdue = reminders.filter(r => r.status === 'overdue');
            const dueSoon = reminders.filter(r => r.status === 'due-soon');
            const lastService = vEntries.length > 0
              ? [...vEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
              : null;
            const totalVehicleSpent = vEntries.reduce((s, e) => s + Number(e.cost || 0), 0);

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

                <div className="vehicle-quick-stats">
                  <div className="quick-stat">
                    <span className="quick-stat-label">Odometer</span>
                    <span className="quick-stat-value">{Number(v.currentMileage).toLocaleString()} km</span>
                  </div>
                  <div className="quick-stat">
                    <span className="quick-stat-label">Jobs Logged</span>
                    <span className="quick-stat-value">{vEntries.length}</span>
                  </div>
                  <div className="quick-stat">
                    <span className="quick-stat-label">Total Spent</span>
                    <span className="quick-stat-value">₱{totalVehicleSpent.toLocaleString()}</span>
                  </div>
                  <div className="quick-stat">
                    <span className="quick-stat-label">Last Service</span>
                    <span className="quick-stat-value">{lastService || 'Never'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link to={`/vehicles/${v.id}/history`} className="btn btn-secondary btn-sm">
                    View History
                  </Link>
                  <Link to={`/vehicles/${v.id}/add-maintenance`} className="btn btn-primary btn-sm">
                    + Log Service
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>


      <h2 style={{ marginBottom: '1rem' }}>Recent Maintenance</h2>
      {recentEntries.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-icon">🔧</span>
          <p className="text-muted">No maintenance jobs recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentEntries.map(e => {
            const v = vehicles.find(veh => veh.id === e.vehicleId);
            return (
              <Link
                key={e.id}
                to={`/vehicles/${e.vehicleId}/history`}
                className="card recent-entry-card"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="tag">{e.jobType}</span>
                    <span style={{ fontWeight: 600 }}>{v ? v.model : `Vehicle #${e.vehicleId}`}</span>
                    {e.shopName && <span className="text-muted text-sm">at {e.shopName}</span>}
                  </div>
                  <p className="text-muted text-sm">{e.date} · {Number(e.mileage).toLocaleString()} km{e.notes ? ` · ${e.notes}` : ''}</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '110px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    ₱{Number(e.cost).toLocaleString()}
                  </span>
                  <span className="recent-entry-arrow" aria-hidden="true">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
