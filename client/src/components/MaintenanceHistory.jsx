import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, listMaintenanceEntries, deleteMaintenanceEntry } from '../api';

export default function MaintenanceHistory() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadData() {
    try {
      const v = await getVehicle(id);
      setVehicle(v);
      const data = await listMaintenanceEntries(id);
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleDelete(entryId) {
    if (window.confirm('Delete this maintenance record?')) {
      await deleteMaintenanceEntry(entryId);
      loadData();
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!vehicle) return <div>Vehicle not found</div>;

  const filteredEntries = entries.filter(e => 
    e.jobType.toLowerCase().includes(search.toLowerCase()) || 
    (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCost = entries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const lastService = entries.length > 0 ? entries[0].date : 'N/A';

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Maintenance History</h1>
          <p className="text-muted">Vehicle: <strong style={{color: 'var(--text-primary)'}}>{vehicle.model}</strong> &nbsp; | &nbsp; Current Mileage: <strong style={{color: 'var(--text-primary)'}}>{vehicle.currentMileage.toLocaleString()} km</strong></p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{textAlign: 'center'}}>
          <p className="text-muted">Total Jobs</p>
          <h2>{entries.length}</h2>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <p className="text-muted">Total Cost</p>
          <h2>₱{totalCost.toLocaleString()}</h2>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <p className="text-muted">Last Service</p>
          <h2>{lastService}</h2>
        </div>
      </div>

      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search maintenance..." 
          style={{ maxWidth: '300px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link to={`/vehicles/${id}/add-maintenance`} className="btn btn-primary">Add Maintenance</Link>
      </div>

      <div className="list-group">
        {filteredEntries.length === 0 ? (
          <p className="text-muted">No records found.</p>
        ) : (
          filteredEntries.map(e => (
            <div key={e.id} className="card maintenance-card">
              <div className="mc-job">
                <strong style={{display: 'block', color: 'var(--accent-color)'}}>{e.jobType}</strong>
                <span className="text-muted" style={{fontSize: '0.8rem'}}>{e.notes}</span>
              </div>
              <div className="mc-date">{e.date}</div>
              <div className="mc-mileage">{Number(e.mileage).toLocaleString()} km</div>
              <div className="mc-cost">₱{Number(e.cost).toLocaleString()}</div>
              <div className="mc-action">
                <button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderColor: 'var(--danger-color)', color: 'var(--danger-color)'}} onClick={() => handleDelete(e.id)}>
                  Del
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
