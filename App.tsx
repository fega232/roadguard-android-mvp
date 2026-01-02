
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Navigation, 
  ShieldAlert, 
  Map as MapIcon, 
  Settings, 
  MessageSquare, 
  AlertTriangle,
  Locate,
  ChevronRight,
  WifiOff,
  Bell
} from 'lucide-react';
import { FRSC_BLACKSPOTS, ALERT_THRESHOLD_KM } from './constants';
import { UserLocation, SafetyAlert, RoadSegment, ChatMessage } from './types';
import { getSafetyInsights, chatWithAssistant } from './services/geminiService';

// --- Utility: Haversine distance ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const App: React.FC = () => {
  const [view, setView] = useState<'dash' | 'map' | 'chat' | 'settings'>('dash');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<SafetyAlert[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});

  // Simulating Tracking
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0, // km/h
            heading: pos.coords.heading,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Proximity Detection Logic
  useEffect(() => {
    if (!location) return;

    const newAlerts: SafetyAlert[] = [];
    FRSC_BLACKSPOTS.forEach(spot => {
      const distance = getDistance(location.lat, location.lng, spot.coordinates.lat, spot.coordinates.lng);
      if (distance <= ALERT_THRESHOLD_KM) {
        newAlerts.push({
          id: Math.random().toString(),
          timestamp: Date.now(),
          segmentId: spot.id,
          distance: Math.round(distance * 10) / 10,
          isActive: true
        });

        // Trigger AI Insight if not already cached
        if (!insights[spot.id]) {
          getSafetyInsights(spot).then(text => {
            setInsights(prev => ({ ...prev, [spot.id]: text || '' }));
          });
        }
      }
    });
    
    // Simple state management to avoid flickering
    if (newAlerts.length > 0 || activeAlerts.length > 0) {
      setActiveAlerts(newAlerts);
    }
  }, [location, insights, activeAlerts.length]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await chatWithAssistant([...chatMessages, userMsg]);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response || 'No response.' }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. I am in offline mode for safety.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto shadow-2xl relative overflow-hidden bg-slate-950">
      
      {/* Top Banner / Status */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <ShieldAlert className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight uppercase">NaijaSafeDrive</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">FRSC Connected</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WifiOff className="w-4 h-4 text-slate-500" />
          <Bell className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {view === 'dash' && (
          <div className="p-4 space-y-6 animate-in fade-in duration-500">
            {/* Real-time Telemetry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Locate className="w-12 h-12" />
                </div>
                <span className="text-4xl font-black text-white">{location?.speed ?? 0}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">km/h</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <AlertTriangle className="w-12 h-12 text-yellow-500" />
                </div>
                <span className="text-4xl font-black text-white">{activeAlerts.length}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Alerts</span>
              </div>
            </div>

            {/* Critical Alert Overlay */}
            {activeAlerts.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Nearby Dangerous Segments</h2>
                {activeAlerts.map(alert => {
                  const segment = FRSC_BLACKSPOTS.find(s => s.id === alert.segmentId);
                  if (!segment) return null;
                  return (
                    <div key={alert.id} className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 safe-zone-pulse relative">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-600 p-2 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-red-400 font-bold leading-tight">{segment.name}</h3>
                          <p className="text-xs text-red-300/80 mt-1">{alert.distance} km away • {segment.riskLevel} Risk</p>
                          <div className="mt-4 bg-slate-900/80 p-3 rounded-xl border border-red-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <ShieldAlert className="w-3 h-3 text-green-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Safety Insight</span>
                            </div>
                            <p className="text-xs text-slate-300 italic">
                              {insights[segment.id] || "Analyzing local road factors..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-slate-300 font-bold uppercase tracking-tight">All Clear</h3>
                <p className="text-sm text-slate-500 mt-2">No reported dangerous zones within 2km of your current position.</p>
              </div>
            )}

            {/* Quick Safety Tips Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-500" /> 
                FRSC Safe Commute Tips
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-400">Night travel is discouraged on the Gwagwalada-Lokoja axis due to poor illumination.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-400">Ensure tyre pressure checks before traversing the Long Bridge heat zone.</p>
                </li>
              </ul>
              <button 
                onClick={() => setView('chat')}
                className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                Ask SafeDrive AI <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {view === 'map' && (
          <div className="h-full bg-slate-900 flex flex-col p-4 animate-in slide-in-from-right duration-300">
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Accident Blackspots (Nigeria)</h2>
            <div className="space-y-3">
              {FRSC_BLACKSPOTS.map(spot => (
                <div key={spot.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{spot.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">{spot.location}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        spot.riskLevel === 'High' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {spot.riskLevel} Risk
                      </span>
                      <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                        {spot.recentAccidents} Recent incidents
                      </span>
                    </div>
                  </div>
                  <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                    <Navigation className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'chat' && (
          <div className="h-full flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Road Safety Consultant</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-[240px]">Ask me about Nigerian traffic laws, road conditions, or emergency steps.</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-br-none' 
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-bl-none animate-pulse text-slate-500 text-sm">
                    Thinking safely...
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <div className="flex gap-2">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about Lagos-Ibadan safety..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <button t
                  onClick={handleSendMessage}
                  disabled={isChatLoading}bh
                  className="bg-green-600 p-3 rounded-xl text-wefhite font-bold hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="p-4 space-y-6 animate-in fade-in duration-300">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Device Settings</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Audio Alerts</h3>
                  <p className="text-xs text-slate-500">Voice warning on approaching risk</p>
                </div>
                <div className="w-12 h-6 bg-green-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Offline Mode</h3>
                  <p className="text-xs text-slate-500">Use cached FRSC accident data</p>
                </div>
                <div className="w-12 h-6 bg-green-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">FRSC Data Sync</h3>
                  <p className="text-xs text-slate-500">Last synced 2 hours ago</p>
                </div>
                <button className="text-[10px] font-bold text-green-500 uppercase tracking-widest border border-green-500/20 px-3 py-1 rounded-md">Sync Now</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 px-6 py-3 pb-8 flex justify-between items-center z-30">
        <button 
          onClick={() => setView('dash')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'dash' ? 'text-green-500' : 'text-slate-500'}`}
        >
          <ShieldAlert className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Dash</span>
        </button>
        <button 
          onClick={() => setView('map')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'map' ? 'text-green-500' : 'text-slate-500'}`}
        >
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Map</span>
        </button>
        <button 
          onClick={() => setView('chat')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'chat' ? 'text-green-500' : 'text-slate-500'}`}
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Consult</span>
        </button>
        <button 
          onClick={() => setView('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'settings' ? 'text-green-500' : 'text-slate-500'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Setup</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
