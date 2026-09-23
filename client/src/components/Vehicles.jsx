import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVehicles, createVehicle, deleteVehicle } from '../api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newMileage, setNewMileage] = useState('');

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

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newModel) return;
    await createVehicle({ model: newModel, currentMileage: parseInt(newMileage) || 0 });
    setNewModel('');
    setNewMileage('');
    setShowAddForm(false);
    loadData();
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this vehicle and all its maintenance records?')) {
      await deleteVehicle(id);
      loadData();
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1>Vehicles</h1>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Add New Vehicle</h2>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Vehicle Model</label>
              <input 
                type="text" 
                className="form-control" 
                value={newModel} 
                onChange={(e) => setNewModel(e.target.value)} 
                placeholder="e.g. BMW E90 318i" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Mileage (km)</label>
              <input 
                type="number" 
                className="form-control" 
                value={newMileage} 
                onChange={(e) => setNewMileage(e.target.value)} 
                placeholder="e.g. 85000" 
              />
            </div>
            <button type="submit" className="btn btn-primary">Save Vehicle</button>
          </form>
        </div>
      )}

      <div className="grid-2">
        {vehicles.length === 0 && !showAddForm ? (
          <p className="text-muted">No vehicles added yet.</p>
        ) : (
          vehicles.map(v => (
            <div key={v.id} className="card">
              <h2>{v.model}</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                Current Mileage: {v.currentMileage.toLocaleString()} km
              </p>
              <div className="flex-gap">
                <Link to={`/vehicles/${v.id}/history`} className="btn btn-outline">
                  View
                </Link>
                <button className="btn btn-danger" onClick={() => handleDelete(v.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
