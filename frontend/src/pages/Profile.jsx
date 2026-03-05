import { useState, useEffect, useRef } from 'react';
import { Camera, Edit2, Save, X, Github, Twitter, MessageSquare, Globe, Activity, Database, Shield, Twitch, Layout as LayoutIcon, Mail, Plus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useP2PStats, useP2PSettings } from '../context/P2PContext';

export default function Profile() {
  const stats = useP2PStats();
  const { isSharing, userProfile, updateUserProfile, token } = useP2PSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userProfile);
  const [interestInput, setInterestInput] = useState('');
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBandwidthChange = (e) => {
    const value = parseInt(e.target.value);
    setFormData(prev => ({ ...prev, bandwidthPercent: isNaN(value) ? 5 : Math.max(5, Math.min(80, value)) }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Max 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddInterest = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && interestInput.trim()) {
      e.preventDefault();
      const newInterest = interestInput.trim().replace(',', '');
      if (formData.interests.length < 12 && !formData.interests.includes(newInterest)) {
        setFormData(prev => ({
          ...prev,
          interests: [...prev.interests, newInterest]
        }));
      }
      setInterestInput('');
    }
  };

  const removeInterest = (index) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Update real Backend API
    console.log('📡 Saving to Beacon mesh...', formData);
    try {
      if (token) {
        const res = await axios.patch(`${API_URL}/users/profile`, {
          bio: formData.bio,
          avatar_url: formData.avatar
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          updateUserProfile({
            ...formData,
            bio: res.data.user.bio,
            avatar: res.data.user.avatar_url
          });
          setIsEditing(false);
          setToast('Profile updated – changes are now live on the Beacon mesh ✨');
        }
      } else {
        // Fallback for guest/local-only updates
        updateUserProfile(formData);
        setIsEditing(false);
        setToast('Profile updated locally ✨');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setToast('Failed to update profile. Please try again.');
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Toast */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-bounce border border-green-400"
          >
            <span>{toast}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-white">Edit Profile</h1>
              <p className="text-neutral-400">Update your identity on the Beacon mesh</p>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setFormData(userProfile); }}
                className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-beacon-600 hover:bg-beacon-500 text-white rounded-lg transition-all shadow-lg shadow-beacon-600/20 font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Avatar & Username */}
            <div className="space-y-6">
              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <div className="relative group mx-auto w-32 h-32 mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neutral-800 bg-neutral-800 group-hover:opacity-75 transition-opacity">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Camera className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Change avatar"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="p-2 bg-beacon-600 rounded-full text-white">
                      <Edit2 className="w-5 h-5" />
                    </div>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept=".png,.jpg,.gif"
                    className="hidden"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="display-name" className="block text-xs font-bold text-neutral-500 uppercase mb-1">Display Name</label>
                    <input
                      id="display-name"
                      type="text"
                      name="displayName"
                      required
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-beacon-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-xs font-bold text-neutral-500 uppercase mb-1">Username / Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2 text-neutral-500">@</span>
                      <input
                        id="username"
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-beacon-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bandwidth Sharing */}
              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-beacon-500" />
                  Bandwidth Dedication
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold text-beacon-500">{formData.bandwidthPercent}%</span>
                    <input
                      type="number"
                      value={formData.bandwidthPercent}
                      onChange={handleBandwidthChange}
                      className="w-16 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-right font-mono text-sm"
                    />
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={formData.bandwidthPercent}
                    onChange={handleBandwidthChange}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-beacon-600"
                  />
                  <p className="text-xs text-neutral-500 leading-relaxed italic">
                    "This is how much of your upload you share with the mesh."
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Bio, Interests, Social */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="bio" className="block text-xs font-bold text-neutral-500 uppercase mb-2">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      maxLength={500}
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell the Beacon community about yourself..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-beacon-500 transition-colors resize-none"
                    ></textarea>
                    <div className="text-right text-[10px] text-neutral-600 mt-1 uppercase font-bold tracking-widest">
                      {formData.bio.length} / 500
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Interests (Max 12)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.interests.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 px-3 py-1 bg-neutral-800 rounded-full text-xs text-white border border-neutral-700">
                          {tag}
                          <button type="button" onClick={() => removeInterest(i)} className="hover:text-beacon-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={handleAddInterest}
                      placeholder="Add tag and press Enter..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-beacon-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Email (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-2.5 w-4 h-4 text-neutral-500" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="notifications@example.com"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-beacon-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Social Links</label>
                      <div className="relative">
                        <Twitch className="absolute left-4 top-2.5 w-4 h-4 text-purple-500" />
                        <input
                          type="text"
                          name="social.twitch"
                          value={formData.social.twitch}
                          onChange={handleInputChange}
                          placeholder="Twitch Username"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-beacon-500 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <Twitter className="absolute left-4 top-2.5 w-4 h-4 text-blue-400" />
                        <input
                          type="text"
                          name="social.twitter"
                          value={formData.social.twitter}
                          onChange={handleInputChange}
                          placeholder="X / Twitter Handle"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-beacon-500 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-2.5 w-4 h-4 text-indigo-500" />
                        <input
                          type="text"
                          name="social.discord"
                          value={formData.social.discord}
                          onChange={handleInputChange}
                          placeholder="Discord Invite / ID"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-11 pr-4 py-2 text-white focus:outline-none focus:border-beacon-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 border border-green-400"
        >
          <span>{toast}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden mb-8 shadow-2xl">
        <div className="h-48 bg-gradient-to-r from-beacon-900 to-neutral-950 relative">
          <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[2px]"></div>
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 bg-beacon-600 hover:bg-beacon-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16">
            <div className="w-32 h-32 rounded-full border-4 border-neutral-900 bg-neutral-800 overflow-hidden shadow-2xl shrink-0">
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt={userProfile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  <LayoutIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-poppins font-bold text-white tracking-tight">{userProfile.displayName}</h1>
                <span className="px-2 py-0.5 bg-beacon-500/10 text-beacon-500 text-[10px] font-bold uppercase rounded border border-beacon-500/20">
                  Community Owned
                </span>
              </div>
              <p className="text-xl text-neutral-400 font-medium">@{userProfile.username}</p>
            </div>
            <div className="flex items-center gap-4 pb-2">
               {userProfile.social.twitch && (
                 <a href={`https://twitch.tv/${userProfile.social.twitch}`} target="_blank" rel="noreferrer" className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-purple-500 transition-colors">
                   <Twitch className="w-5 h-5" />
                 </a>
               )}
               {userProfile.social.twitter && (
                 <a href={`https://twitter.com/${userProfile.social.twitter}`} target="_blank" rel="noreferrer" className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-blue-400 transition-colors">
                   <Twitter className="w-5 h-5" />
                 </a>
               )}
               {userProfile.social.discord && (
                 <a href="#" className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-indigo-500 transition-colors">
                   <MessageSquare className="w-5 h-5" />
                 </a>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Key Stats Row */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 flex items-center justify-between group hover:border-beacon-500/30 transition-all">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Credits / Balance</p>
              <h3 className="text-3xl font-mono font-bold text-white">{stats.credits.toFixed(2)} <span className="text-sm text-beacon-500">CR</span></h3>
            </div>
            <div className="p-4 bg-beacon-500/10 rounded-2xl text-beacon-500">
               <Database className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 flex items-center justify-between group hover:border-beacon-500/30 transition-all">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Bandwidth Shared</p>
              <h3 className="text-3xl font-mono font-bold text-white">{userProfile.bandwidthPercent}% <span className="text-sm text-blue-500">RELAY</span></h3>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
               <Activity className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 flex items-center justify-between group hover:border-beacon-500/30 transition-all">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Node Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${isSharing ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <h3 className="text-2xl font-bold text-white">{isSharing ? 'Online' : 'Offline'}</h3>
              </div>
            </div>
            <div className="p-4 bg-green-500/10 rounded-2xl text-green-500">
               <Shield className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Bio & Interests */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-beacon-500" />
              Biography
            </h2>
            <p className="text-neutral-300 leading-relaxed text-lg whitespace-pre-wrap">
              {userProfile.bio || "No bio set yet. Tell the world about yourself!"}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
            <h2 className="text-xl font-bold text-white mb-6">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {userProfile.interests.length > 0 ? userProfile.interests.map((tag, i) => (
                <span key={i} className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 rounded-full border border-neutral-700 transition-colors">
                  {tag}
                </span>
              )) : (
                <p className="text-neutral-500 italic text-sm">No interests added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
