import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import StockDetail from './pages/StockDetail';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/holdings" element={<Holdings />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/stocks/:id" element={<StockDetail />} />
      </Routes>
      <BottomNav />
    </>
  );
}
