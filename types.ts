
export interface RoadSegment {
  id: string;
  name: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  riskLevel: 'High' | 'Medium' | 'Low';
  description: string;
  recentAccidents: number;
  commonCauses: string[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
}

export interface SafetyAlert {
  id: string;
  timestamp: number;
  segmentId: string;
  distance: number;
  isActive: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
