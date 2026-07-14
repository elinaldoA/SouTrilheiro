import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

function SeguirPosicaoAtual({ posicao }) {
  const map = useMap();
  useEffect(() => {
    if (posicao) map.panTo(posicao, { animate: true });
  }, [posicao, map]);
  return null;
}

export default function TrailMapAoVivo({ path, alturaPx = 220 }) {
  if (!path || path.length === 0) return null;

  const posicaoAtual = path[path.length - 1];

  return (
    <div style={{ height: alturaPx, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
      <MapContainer center={posicaoAtual} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={`https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />
        <SeguirPosicaoAtual posicao={posicaoAtual} />
        {path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#B5622A', weight: 4 }} />}
        <CircleMarker
          center={posicaoAtual}
          radius={8}
          pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 }}
        />
      </MapContainer>
    </div>
  );
}
