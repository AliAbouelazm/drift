import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Analyze from './pages/Analyze';
import Dashboard from './pages/Dashboard';
import ModelPerformance from './pages/ModelPerformance';
import Trends from './pages/Trends';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main
          style={{
            marginLeft: 220,
            flex: 1,
            padding: 24,
            maxWidth: 1200,
            width: '100%',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/model" element={<ModelPerformance />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
