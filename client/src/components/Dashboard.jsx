import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVehicles } from '../api';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await listVehicles();
        setVehicles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="grid-2">
        {vehicles.length === 0 ? (
          <div className="card">
            <p className="text-muted">No vehicles added yet.</p>
            <br />
            <Link to="/vehicles" className="btn btn-primary">Add your first vehicle</Link>
          </div>
        ) : (
          vehicles.map(v => (
            <div key={v.id} className="card">
              <h2>{v.model}</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                Current Mileage: {v.currentMileage.toLocaleString()} km
              </p>
              <Link to={`/vehicles/${v.id}/history`} className="btn btn-outline">
                View History
              </Link>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2>Recent Maintenance</h2>
        <div className="card">
          <p className="text-muted">Select a vehicle to view its maintenance history.</p>
        </div>
      </div>
    </div>
  );
}
