import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const FollowingContext = createContext();

export function FollowingProvider({ children }) {
  const [followedChannels, setFollowedChannels] = useState(() => {
    try {
      const stored = localStorage.getItem('followedChannels');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load followed channels:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('followedChannels', JSON.stringify(followedChannels));
    } catch (error) {
      console.error('Failed to save followed channels:', error);
    }
  }, [followedChannels]);

  const follow = useCallback((channel) => {
    setFollowedChannels((prev) => {
      if (prev.some(c => c.id === channel.id)) return prev;
      return [...prev, channel];
    });
  }, []);

  const unfollow = useCallback((channelId) => {
    setFollowedChannels((prev) => prev.filter(c => c.id !== channelId));
  }, []);

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
