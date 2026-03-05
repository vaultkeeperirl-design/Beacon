import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useP2PSettings } from './P2PContext';

const FollowingContext = createContext();

export function FollowingProvider({ children }) {
  const { token, username: currentUsername } = useP2PSettings();
  const [followedChannels, setFollowedChannels] = useState(() => {
    try {
      const stored = localStorage.getItem('followedChannels');
      const parsed = stored ? JSON.parse(stored) : [];
      // Ensure we have an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load followed channels:', error);
      return [];
    }
  });

  // Fetch following list from backend on mount or when identity changes
  useEffect(() => {
    if (token && currentUsername && currentUsername !== 'Guest') {
      axios.get(`${API_URL}/users/${currentUsername}/following`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          // Map backend User objects to the frontend channel format
          const backendFollows = res.data.map(user => ({
            id: user.username,
            name: user.username,
            avatar: user.avatar_url,
            title: user.bio,
            isLive: false // We don't know live status from the simple follows list
          }));
          setFollowedChannels(backendFollows);
        })
        .catch(err => console.error('Failed to fetch following list:', err));
    }
    // We don't clear followedChannels if token is missing here,
    // because we want to allow guest/offline local storage persistence
    // until they explicitly log in.
  }, [token, currentUsername]);

  useEffect(() => {
    try {
      localStorage.setItem('followedChannels', JSON.stringify(followedChannels));
    } catch (error) {
      console.error('Failed to save followed channels:', error);
    }
  }, [followedChannels]);

  const follow = useCallback(async (channel) => {
    // Optimistic Update
    setFollowedChannels((prev) => {
      if (prev.some(c => c.id === channel.id)) return prev;
      return [...prev, channel];
    });

    if (token) {
      try {
        await axios.post(`${API_URL}/users/${channel.id}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to follow user on backend:', err);
        // Rollback on error
        setFollowedChannels((prev) => prev.filter(c => c.id !== channel.id));
      }
    }
  }, [token]);

  const unfollow = useCallback(async (channelId) => {
    let rolledBack = false;

    // Optimistic Update
    setFollowedChannels((prev) => prev.filter(c => c.id !== channelId));

    if (token) {
      try {
        await axios.delete(`${API_URL}/users/${channelId}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to unfollow user on backend:', err);
        // Rollback on error
        if (!rolledBack) {
          rolledBack = true;
          // We can't easily get the original state here without stale closure unless we use the functional update.
          // However, to correctly rollback we need to know what we removed.
          // A better way is to fetch the list again or use a ref, but for simple rollback:
          axios.get(`${API_URL}/users/${currentUsername}/following`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => {
             const backendFollows = res.data.map(user => ({
               id: user.username,
               name: user.username,
               avatar: user.avatar_url,
               title: user.bio,
               isLive: false
             }));
             setFollowedChannels(backendFollows);
          });
        }
      }
    }
  }, [token, currentUsername]);

  const isFollowing = useCallback((channelId) => {
    return followedChannels.some(c => c.id === channelId);
  }, [followedChannels]);

  const value = useMemo(() => ({
    followedChannels,
    follow,
    unfollow,
    isFollowing,
  }), [followedChannels, follow, unfollow, isFollowing]);

  return (
    <FollowingContext.Provider value={value}>
      {children}
    </FollowingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFollowing() {
  const context = useContext(FollowingContext);
  if (context === undefined) {
    throw new Error('useFollowing must be used within a FollowingProvider');
  }
  return context;
}
