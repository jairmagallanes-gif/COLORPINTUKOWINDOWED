import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import {
  Truck,
  MapPin,
  Building2,
  Layers,
  RefreshCw,
  Navigation,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Play,
  Pause,
  Maximize2
} from 'lucide-react';
import { ProjectRecord } from '../types';

export interface Coordinates {
  lat: number;
  lng: number;
}

// Coordenadas oficiales de CEDIs Pintuco en Colombia
export const CEDI_COORDINATES: Record<string, { name: string; city: string; coords: Coordinates; address: string; phone: string }> = {
  'medellin': {
    name: 'CEDI Central Guarne / Medellín',
    city: 'Medellín',
    coords: { lat: 6.2796, lng: -75.4431 },
    address: 'Autopista Medellín - Bogotá Km 22, Guarne, Antioquia',
    phone: '+57 (4) 384-8484'
  },
  'bogota': {
    name: 'CEDI Bogotá Fontibón',
    city: 'Bogotá',
    coords: { lat: 4.6732, lng: -74.1436 },
    address: 'Zona Industrial Fontibón, Calle 17 # 98-40, Bogotá D.C.',
    phone: '+57 (1) 425-9000'
  },
  'cali': {
    name: 'CEDI Cali Yumbo',
    city: 'Cali',
    coords: { lat: 3.4516, lng: -76.5320 },
    address: 'Parque Industrial Yumbo, Acopi, Valle del Cauca',
    phone: '+57 (2) 690-3000'
  },
  'barranquilla': {
    name: 'CEDI Costa Norte Barranquilla',
    city: 'Barranquilla',
    coords: { lat: 10.9685, lng: -74.7813 },
    address: 'Vía 40 # 73-290, Barranquilla, Atlántico',
    phone: '+57 (5) 369-1200'
  },
  'bucaramanga': {
    name: 'CEDI Santander Bucaramanga',
    city: 'Bucaramanga',
    coords: { lat: 7.1254, lng: -73.1198 },
    address: 'Anillo Vial Floridablanca - Girón, Santander',
    phone: '+57 (7) 638-4400'
  },
  'cartagena': {
    name: 'CEDI Cartagena Mamonal',
    city: 'Cartagena',
    coords: { lat: 10.3910, lng: -75.4794 },
    address: 'Mamonal Km 6, Bahía Industrial, Cartagena',
    phone: '+57 (5) 668-5500'
  },
  'pereira': {
    name: 'CEDI Eje Cafetero Pereira',
    city: 'Pereira',
    coords: { lat: 4.8133, lng: -75.6961 },
    address: 'Variante La Romelia - El Pollo, Pereira',
    phone: '+57 (6) 330-8000'
  }
};

// Coordenadas predeterminadas por ciudad colombiana para destino de obra
export const CITY_COORDINATES: Record<string, Coordinates> = {
  'medellin': { lat: 6.2442, lng: -75.5812 },
  'medellín': { lat: 6.2442, lng: -75.5812 },
  'bogota': { lat: 4.6560, lng: -74.0560 },
  'bogotá': { lat: 4.6560, lng: -74.0560 },
  'cali': { lat: 3.4372, lng: -76.5225 },
  'barranquilla': { lat: 11.0041, lng: -74.8070 },
  'bucaramanga': { lat: 7.1193, lng: -73.1227 },
  'cartagena': { lat: 10.4243, lng: -75.5472 },
  'pereira': { lat: 4.8087, lng: -75.6906 },
  'manizales': { lat: 5.0689, lng: -75.5174 },
  'armenia': { lat: 4.5339, lng: -75.6811 },
  'ibague': { lat: 4.4389, lng: -75.2322 },
  'ibagué': { lat: 4.4389, lng: -75.2322 },
  'cucuta': { lat: 7.8939, lng: -72.5078 },
  'cúcuta': { lat: 7.8939, lng: -72.5078 },
  'santa marta': { lat: 11.2408, lng: -74.1990 }
};

interface DispatchGoogleMapProps {
  project: ProjectRecord;
  onGpsArrival?: () => void | Promise<void>;
  driverInfo: {
    name: string;
    phone: string;
    vehiclePlate: string;
    trackingNumber: string;
    cediOrigin: string;
    estimatedEta: string;
    currentCheckpoint: string;
    progressPercent: number;
  };
}

// Subcomponent: Fits map to origin, truck, and destination
const MapBoundsFitter: React.FC<{
  cediCoords: Coordinates;
  truckCoords: Coordinates;
  destCoords: Coordinates;
  recenterTrigger: number;
}> = ({ cediCoords, truckCoords, destCoords, recenterTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    try {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(cediCoords);
      bounds.extend(truckCoords);
      bounds.extend(destCoords);
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } catch (e) {
      console.warn('Map bounds fit error:', e);
    }
  }, [map, cediCoords, truckCoords, destCoords, recenterTrigger]);

  return null;
};

// Subcomponent: Live traffic layer overlay
const TrafficOverlay: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  const layerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (enabled) {
      if (!layerRef.current) {
        layerRef.current = new google.maps.TrafficLayer();
      }
      layerRef.current.setMap(map);
    } else if (layerRef.current) {
      layerRef.current.setMap(null);
    }
    return () => {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
};

// Subcomponent: Polyline route rendering (traveled in solid blue, remaining in dashed emerald)
const RoutePolylines: React.FC<{
  cediCoords: Coordinates;
  truckCoords: Coordinates;
  destCoords: Coordinates;
}> = ({ cediCoords, truckCoords, destCoords }) => {
  const map = useMap();
  const completedLineRef = useRef<google.maps.Polyline | null>(null);
  const remainingLineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clean up previous lines
    if (completedLineRef.current) completedLineRef.current.setMap(null);
    if (remainingLineRef.current) remainingLineRef.current.setMap(null);

    // 1. Completed route: CEDI -> Truck
    completedLineRef.current = new google.maps.Polyline({
      path: [cediCoords, truckCoords],
      geodesic: true,
      strokeColor: '#005596', // Azul Pintuco institucional
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map
    });

    // 2. Remaining route: Truck -> Destino de obra
    const lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 3
    };

    remainingLineRef.current = new google.maps.Polyline({
      path: [truckCoords, destCoords],
      geodesic: true,
      strokeColor: '#059669', // Verde esmeralda de entrega
      strokeOpacity: 0,
      strokeWeight: 4,
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '16px'
      }],
      map
    });

    return () => {
      if (completedLineRef.current) completedLineRef.current.setMap(null);
      if (remainingLineRef.current) remainingLineRef.current.setMap(null);
    };
  }, [map, cediCoords, truckCoords, destCoords]);

  return null;
};

export const DispatchGoogleMap: React.FC<DispatchGoogleMapProps> = ({
  project,
  driverInfo,
  onGpsArrival
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [selectedMarker, setSelectedMarker] = useState<'cedi' | 'truck' | 'dest' | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [showTraffic, setShowTraffic] = useState(true);
  const [recenterCounter, setRecenterCounter] = useState(0);

  // Dynamic simulation controls
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(driverInfo.progressPercent ?? 0);
  const gpsArrivalReportedRef = useRef(false);

  useEffect(() => {
    gpsArrivalReportedRef.current = false;
    setIsSimulating(false);
    setCurrentProgress(driverInfo.progressPercent ?? 0);
  }, [project.id]);

  useEffect(() => {
    if (currentProgress < 100) return;
    setIsSimulating(false);
    if (!gpsArrivalReportedRef.current && project.status !== 'finalizado' && project.dispatchInfo?.isDispatched) {
      gpsArrivalReportedRef.current = true;
      void onGpsArrival?.();
    }
  }, [currentProgress, project.id, project.status, project.dispatchInfo?.isDispatched, onGpsArrival]);

  // 1. Resolve CEDI Origin Coordinates
  const cediData = useMemo(() => {
    const rawCedi = (project.assignedWarehouse?.cediName || project.stockValidation?.assignedCedi || driverInfo.cediOrigin || '').toLowerCase();
    for (const key of Object.keys(CEDI_COORDINATES)) {
      if (rawCedi.includes(key)) {
        return CEDI_COORDINATES[key];
      }
    }
    // Check city fallback
    const city = (project.formData?.project?.city || '').toLowerCase();
    for (const key of Object.keys(CEDI_COORDINATES)) {
      if (city.includes(key)) {
        return CEDI_COORDINATES[key];
      }
    }
    return CEDI_COORDINATES['medellin'];
  }, [project, driverInfo.cediOrigin]);

  // 2. Resolve Obra Destination Coordinates
  const destCoords = useMemo<Coordinates>(() => {
    const city = (project.formData?.project?.city || 'Medellín').toLowerCase().trim();
    if (CITY_COORDINATES[city]) {
      // Offset slightly for realistic local address variability
      const base = CITY_COORDINATES[city];
      return {
        lat: base.lat + 0.008,
        lng: base.lng - 0.005
      };
    }
    return { lat: 6.2088, lng: -75.5678 }; // El Poblado default
  }, [project.formData?.project?.city]);

  // 3. Compute Live Interpolated Truck Coordinates based on Progress
  const truckCoords = useMemo<Coordinates>(() => {
    const ratio = Math.max(0.05, Math.min(1, currentProgress / 100));
    // Interpolate with a slight realistic highway curve
    const lat = cediData.coords.lat + (destCoords.lat - cediData.coords.lat) * ratio;
    const lng = cediData.coords.lng + (destCoords.lng - cediData.coords.lng) * ratio;
    // Add micro curvature based on sine
    const curvature = Math.sin(ratio * Math.PI) * 0.015;
    return {
      lat: lat + curvature,
      lng: lng - curvature * 0.8
    };
  }, [cediData.coords, destCoords, currentProgress]);

  // Real-time animation simulation interval
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setCurrentProgress((prev) => Math.min(100, prev + 1.5));
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 text-white flex flex-col relative">
      
      {/* Top Header Controls Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Rastreo Satelital en Tiempo Real • Google Maps Platform
              </h4>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                GPS Activo
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Guía: <strong className="text-slate-200">{driverInfo.trackingNumber}</strong> • Vehículo: <strong className="text-slate-200">{driverInfo.vehiclePlate}</strong> • Conductor: <strong className="text-slate-200">{driverInfo.name}</strong>
            </p>
          </div>
        </div>

        {/* Map Interactive Toggle Buttons */}
        <div className="flex items-center gap-2">
          {/* Simulation Play/Pause Button */}
          <button
            type="button"
            id="btn-simulate-movement"
            onClick={() => setIsSimulating(!isSimulating)}
            disabled={!project.dispatchInfo?.isDispatched || project.status === 'finalizado'}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={project.status === 'finalizado' ? 'Entrega ya confirmada' : project.dispatchInfo?.isDispatched ? 'Simular el avance del vehículo; al 100% se confirmará la entrega' : 'Primero registra el despacho'}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Pausar Simulación' : 'Simular GPS'}</span>
          </button>

          {/* Traffic Toggle */}
          <button
            type="button"
            id="btn-toggle-traffic"
            onClick={() => setShowTraffic(!showTraffic)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              showTraffic
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
            title="Alternar capa de tráfico vehicular en vivo"
          >
            Tráfico
          </button>

          {/* Map Type: Roadmap vs Hybrid Satellite */}
          <button
            type="button"
            id="btn-toggle-map-type"
            onClick={() => setMapTypeId(mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Alternar vista Satelital / Calles"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{mapTypeId === 'roadmap' ? 'Satélite' : 'Mapa'}</span>
          </button>

          {/* Recenter Bounds */}
          <button
            type="button"
            id="btn-recenter-map"
            onClick={() => setRecenterCounter((c) => c + 1)}
            className="p-1.5 rounded-lg border bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 transition-all cursor-pointer"
            title="Ajustar y centrar toda la ruta"
          >
            <Maximize2 className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Embedded Google Map Stage */}
      <div className="relative w-full h-84 md:h-96 bg-slate-900 overflow-hidden">
        {apiKey ? (
          <APIProvider apiKey={apiKey} libraries={['routes', 'marker']}>
            <Map
              id="dispatch-google-map"
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              defaultCenter={truckCoords}
              defaultZoom={12}
              mapTypeId={mapTypeId}
              gestureHandling="greedy"
              disableDefaultUI={false}
              fullscreenControl={false}
              streetViewControl={false}
            >
              {/* Bounds Auto-Fitter */}
              <MapBoundsFitter
                cediCoords={cediData.coords}
                truckCoords={truckCoords}
                destCoords={destCoords}
                recenterTrigger={recenterCounter}
              />

              {/* Traffic overlay */}
              <TrafficOverlay enabled={showTraffic} />

              {/* Dual Colored Route Polyline */}
              <RoutePolylines
                cediCoords={cediData.coords}
                truckCoords={truckCoords}
                destCoords={destCoords}
              />

              {/* 1. Origin Marker: CEDI */}
              <AdvancedMarker
                position={cediData.coords}
                onClick={() => setSelectedMarker(selectedMarker === 'cedi' ? null : 'cedi')}
                title={`CEDI de Origen: ${cediData.name}`}
              >
                <div className="relative group cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-blue-500/40 hover:scale-110 transition-transform">
                    <Building2 className="w-4.5 h-4.5 text-amber-300" />
                  </div>
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow border border-slate-700">
                    CEDI Origen
                  </div>
                </div>
              </AdvancedMarker>

              {/* 2. Live Vehicle Marker: Delivery Truck */}
              <AdvancedMarker
                position={truckCoords}
                onClick={() => setSelectedMarker(selectedMarker === 'truck' ? null : 'truck')}
                title={`Vehículo en Tránsito: ${driverInfo.vehiclePlate}`}
              >
                <div className="relative group cursor-pointer">
                  <span className="absolute -inset-2.5 rounded-full bg-amber-400/50 animate-ping"></span>
                  <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-amber-400/40 hover:scale-115 transition-transform">
                    <Truck className="w-5.5 h-5.5 text-white" />
                  </div>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow border border-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse"></span>
                    {driverInfo.vehiclePlate.split(' ')[0]}
                  </div>
                </div>
              </AdvancedMarker>

              {/* 3. Destination Marker: Obra Cliente */}
              <AdvancedMarker
                position={destCoords}
                onClick={() => setSelectedMarker(selectedMarker === 'dest' ? null : 'dest')}
                title={`Obra Destino: ${project.formData.identification.clientName}`}
              >
                <div className="relative group cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-emerald-500/40 hover:scale-110 transition-transform">
                    <MapPin className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow border border-slate-700">
                    Obra Destino
                  </div>
                </div>
              </AdvancedMarker>

              {/* Interactive InfoWindows */}
              {selectedMarker === 'cedi' && (
                <InfoWindow
                  position={cediData.coords}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="text-slate-900 p-1 min-w-[210px] text-xs font-sans">
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-1">
                      <Building2 className="w-4 h-4" />
                      <span>{cediData.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-1.5 leading-snug">
                      {cediData.address}
                    </p>
                    <div className="bg-slate-100 p-1.5 rounded text-[10px] text-slate-700 space-y-0.5">
                      <div>📞 Tel: <strong>{cediData.phone}</strong></div>
                      <div>📦 Estado: <strong>Despachado con sello de calidad CEDI</strong></div>
                    </div>
                  </div>
                </InfoWindow>
              )}

              {selectedMarker === 'truck' && (
                <InfoWindow
                  position={truckCoords}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="text-slate-900 p-1 min-w-[230px] text-xs font-sans">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-amber-700 flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        {driverInfo.vehiclePlate}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        En Ruta
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-700 mb-2">
                      <div>Conductor: <strong>{driverInfo.name}</strong></div>
                      <div>Guía de seguimiento: <strong>{driverInfo.trackingNumber}</strong></div>
                      <div>Celular: <strong>{driverInfo.phone}</strong></div>
                      <div>Punto actual: <strong>{driverInfo.currentCheckpoint}</strong></div>
                      <div>ETA Estimada: <strong className="text-blue-700">{driverInfo.estimatedEta}</strong></div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-1.5 rounded text-[10px] text-blue-900 font-medium">
                      ✓ Monitoreo satelital activo con sensor térmico de cabina.
                    </div>
                  </div>
                </InfoWindow>
              )}

              {selectedMarker === 'dest' && (
                <InfoWindow
                  position={destCoords}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="text-slate-900 p-1 min-w-[220px] text-xs font-sans">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>Destino: {project.formData.identification.clientName}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-1.5 leading-snug">
                      Dirección: {project.formData.project.address || project.dispatchInfo?.deliveryAddress || 'Dirección de obra registrada'}
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded text-[10px] text-emerald-900 space-y-0.5">
                      <div>👤 Contacto: <strong>{project.formData.identification.contactPerson}</strong></div>
                      <div>🎨 Color: <strong>{project.formData.technical.colorName}</strong></div>
                      <div>⚖️ Galones: <strong>{project.solution.gallonsTotal} Gl</strong></div>
                    </div>
                  </div>
                </InfoWindow>
              )}

            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <Compass className="w-10 h-10 text-amber-400 mb-2 animate-spin" />
            <p className="text-xs font-bold text-white">Iniciando Google Maps Platform...</p>
            <p className="text-[11px] text-slate-400 mt-1">Configurando credenciales satelitales seguras.</p>
          </div>
        )}

        {/* Live Floating Status Overlay Badge */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-xl px-3 py-2 text-xs shadow-xl max-w-xs">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Punto de Control GPS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {Math.round(currentProgress)}% Completado
            </span>
          </div>
          <div className="text-slate-200 font-semibold text-[11px] truncate">
            {driverInfo.currentCheckpoint}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>

      </div>

      {/* Bottom Dispatch Route Details Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Origen Logístico</span>
            <span className="font-bold text-white block truncate">{cediData.name}</span>
            <span className="text-[10px] text-slate-400 truncate block">{cediData.city}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <Truck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehículo & Operador</span>
            <span className="font-bold text-white block truncate">{driverInfo.name}</span>
            <span className="text-[10px] text-amber-300 font-mono block">{driverInfo.vehiclePlate}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Destino de Entrega</span>
            <span className="font-bold text-white block truncate">{project.formData.identification.clientName}</span>
            <span className="text-[10px] text-emerald-300 font-bold block">ETA: {driverInfo.estimatedEta}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
