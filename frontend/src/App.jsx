import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Broadcast from './pages/Broadcast';
import Wallet from './pages/Wallet';
import Following from './pages/Following';
import Channel from './pages/Channel';
import { P2PProvider } from './context/P2PContext';
import { FollowingProvider } from './context/FollowingContext';

function App() {
  return (
    <P2PProvider>
      <FollowingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="watch/:id" element={<Watch />} />
              <Route path="channel/:username" element={<Channel />} />
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="following" element={<Following />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FollowingProvider>
    </P2PProvider>
  );
}

export default App;
