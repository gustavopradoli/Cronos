import { useState } from 'react';
import './styles/theme.css';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <Layout activeItem={activeItem} onNavigate={setActiveItem}>
      <Dashboard />
    </Layout>
  );
}
