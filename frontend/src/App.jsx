import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Watch from './pages/Watch';
import Broadcast from './pages/Broadcast';
import Wallet from './pages/Wallet';
import Following from './pages/Following';
import Channel from './pages/Channel';
import TermsOfService from './pages/TermsOfService';
import CommunityGuidelines from './pages/CommunityGuidelines';
import Login from './pages/Login';
import Register from './pages/Register';
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
              <Route path="browse" element={<Browse />} />
              <Route path="watch/:id" element={<Watch />} />
              <Route path="channel/:username" element={<Channel />} />
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="following" element={<Following />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="guidelines" element={<CommunityGuidelines />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FollowingProvider>
    </P2PProvider>
  );
}

export default App;
