import { createContext, useContext, useState, useEffect, useMemo } from 'react';

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

  const follow = (channel) => {
    setFollowedChannels((prev) => {
      if (prev.some(c => c.id === channel.id)) return prev;
      return [...prev, channel];
    });
  };

  const unfollow = (channelId) => {
    setFollowedChannels((prev) => prev.filter(c => c.id !== channelId));
  };

  const isFollowing = (channelId) => {
    return followedChannels.some(c => c.id === channelId);
  };

  const value = useMemo(() => ({
    followedChannels,
    follow,
    unfollow,
    isFollowing,
  }), [followedChannels]);

  return (
    <FollowingContext.Provider value={value}>
      {children}
    </FollowingContext.Provider>
  );
}

export function useFollowing() {
  const context = useContext(FollowingContext);
  if (context === undefined) {
    throw new Error('useFollowing must be used within a FollowingProvider');
  }
  return context;
}
