import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

const icone = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function TrailMap({ path, alturaPx = 220 }) {
  if (!path || path.length === 0) return null;

  const inicio = path[0];
  const fim = path[path.length - 1];

  return (
    <div style={{ height: alturaPx, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
      <MapContainer bounds={path} boundsOptions={{ padding: [24, 24] }} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={`https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />
        <Polyline positions={path} pathOptions={{ color: '#B5622A', weight: 4 }} />
        <Marker position={inicio} icon={icone} />
        {fim !== inicio && <Marker position={fim} icon={icone} />}
      </MapContainer>
    </div>
  );
}
