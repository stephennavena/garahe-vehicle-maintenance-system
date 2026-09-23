import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import MaintenanceHistory from './components/MaintenanceHistory';
import AddMaintenance from './components/AddMaintenance';
import './styles.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id/history" element={<MaintenanceHistory />} />
          <Route path="vehicles/:id/add-maintenance" element={<AddMaintenance />} />
        </Route>
      </Routes>
    </Router>
  );
}
