import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Broadcast from './pages/Broadcast';
import Wallet from './pages/Wallet';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="watch/:id" element={<Watch />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="wallet" element={<Wallet />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
