
import { RoadSegment } from './types';

export const FRSC_BLACKSPOTS: RoadSegment[] = [
  {
    id: 'lag-ib-1',
    name: 'Long Bridge (Lagos-Ibadan Expressway)',
    location: 'Warewa/Ibafo Axis',
    coordinates: { lat: 6.6917, lng: 3.4022 },
    riskLevel: 'High',
    description: 'High frequency of commercial vehicle brake failures and narrow lanes during construction.',
    recentAccidents: 45,
    commonCauses: ['Overspeeding', 'Brake Failure', 'Poor Lighting']
  },
  {
    id: '3mb-1',
    name: 'Third Mainland Bridge',
    location: 'Lagos Lagoon',
    coordinates: { lat: 6.4754, lng: 3.3958 },
    riskLevel: 'Medium',
    description: 'Wind gusts and high-speed commuters. Frequent breakdowns during peak hours.',
    recentAccidents: 22,
    commonCauses: ['Tyre Burst', 'Reckless Driving']
  },
  {
    id: 'ore-ben-1',
    name: 'Ore-Benin Road',
    location: 'Ondo/Edo Boundary',
    coordinates: { lat: 6.7456, lng: 4.8812 },
    riskLevel: 'High',
    description: 'Known for deep potholes and sharp bends. Poor visibility at night.',
    recentAccidents: 58,
    commonCauses: ['Potholes', 'Night Driving', 'Fatigue']
  },
  {
    id: 'gwag-lok-1',
    name: 'Gwagwalada-Lokoja Road',
    location: 'Abuja-Kogi Border',
    coordinates: { lat: 8.9472, lng: 7.0764 },
    riskLevel: 'High',
    description: 'Single carriage bottlenecks with heavy truck traffic.',
    recentAccidents: 39,
    commonCauses: ['Wrongful Overtaking', 'Heavy Truck Traffic']
  }
];

export const ALERT_THRESHOLD_KM = 2.0; // Warn if within 2km
