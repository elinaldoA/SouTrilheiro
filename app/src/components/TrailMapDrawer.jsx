import { MapContainer, TileLayer, Polyline, Marker, useMapEvents } from 'react-leaflet';
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

function CapturarCliques({ aoClicar }) {
  useMapEvents({
    click(e) {
      aoClicar([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function TrailMapDrawer({ centro, pontos, onAdicionarPonto, onMoverPonto, onRemoverPonto, alturaPx = 220 }) {
  if (!centro) return null;

  return (
    <div style={{ height: alturaPx, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
      <MapContainer
        center={[centro.lat, centro.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={`https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />
        <CapturarCliques aoClicar={onAdicionarPonto} />
        {pontos.length > 1 && <Polyline positions={pontos} pathOptions={{ color: '#B5622A', weight: 4 }} />}
        {pontos.map((p, i) => (
          <Marker
            key={i}
            position={p}
            icon={icone}
            draggable
            eventHandlers={{
              dragend: (e) => onMoverPonto?.(i, [e.target.getLatLng().lat, e.target.getLatLng().lng]),
              click: () => onRemoverPonto?.(i),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
