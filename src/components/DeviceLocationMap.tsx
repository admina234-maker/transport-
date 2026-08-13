import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapPin,
  Printer,
  Radio,
  QrCode,
  Zap,
  Globe,
  Layers,
  Map as MapIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Play,
  X,
  User,
  Hash,
  Maximize2,
  Minimize2,
  Navigation
} from "lucide-react";
import { PrintedDevice } from "../types";
import { SCHOOL_INFO } from "../data/mockData";

interface DeviceLocationMapProps {
  devices: PrintedDevice[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
  onRunTestPrint?: (dev: PrintedDevice) => void;
  onCloseMap?: () => void;
  isModal?: boolean;
}

const SCHOOL_CAMPUS_GPS = {
  lat: 12.3036078,
  lng: 79.8615042,
  name: "Wisdom Nursery & Primary School",
  address: "Isur Chunambedu Road, Essur - 603310 (ஈசூர் - 603310)",
};

export const getDeviceCoordinates = (dev: PrintedDevice): { lat: number; lng: number } => {
  if (dev.latitude && dev.longitude) {
    return { lat: dev.latitude, lng: dev.longitude };
  }

  const loc = (dev.lastKnownLocation || "").toLowerCase();
  if (loc.includes("accounts") || loc.includes("cashier") || loc.includes("admin")) {
    return { lat: 12.3038, lng: 79.8618 };
  }
  if (loc.includes("transport") || loc.includes("depot")) {
    return { lat: 12.3034, lng: 79.8612 };
  }
  if (loc.includes("van") || loc.includes("essur")) {
    return { lat: 12.3069, lng: 79.8562 };
  }
  if (loc.includes("gate")) {
    return { lat: 12.3037, lng: 79.8616 };
  }

  // Consistent fallback hash offset around campus
  let hash = 0;
  for (let i = 0; i < dev.id.length; i++) {
    hash = dev.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const offsetLat = ((hash % 100) - 50) * 0.0001;
  const offsetLng = (((hash >> 2) % 100) - 50) * 0.0001;
  return {
    lat: SCHOOL_CAMPUS_GPS.lat + offsetLat,
    lng: SCHOOL_CAMPUS_GPS.lng + offsetLng,
  };
};

const MAP_TILES = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

export const DeviceLocationMap: React.FC<DeviceLocationMapProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  onRunTestPrint,
  onCloseMap,
  isModal = false,
}) => {
  const [mapTheme, setMapTheme] = useState<"street" | "dark" | "satellite">("street");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng],
        zoom: 15,
        zoomControl: false,
      });

      const tileConfig = MAP_TILES[mapTheme];
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // School Campus Center Marker
      const campusIcon = L.divIcon({
        className: "custom-device-map-school-icon",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2 bg-amber-400/30 rounded-full animate-ping pointer-events-none"></div>
            <div class="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black px-2.5 py-1 rounded-xl shadow-2xl border-2 border-white text-[11px] whitespace-nowrap flex items-center gap-1 font-sans">
              <span>🏫 Wisdom School Campus</span>
            </div>
          </div>
        `,
        iconSize: [160, 36],
        iconAnchor: [80, 18],
      });

      L.marker([SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng], { icon: campusIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans text-xs">
            <b class="text-amber-600 text-sm">${SCHOOL_CAMPUS_GPS.name}</b><br/>
            <span>${SCHOOL_CAMPUS_GPS.address}</span><br/>
            <span class="text-emerald-600 font-bold">Central Hardware & Admin Block</span>
          </div>
        `);
    }

    // Invalidate size after mount
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = MAP_TILES[mapTheme];
    const newLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapTheme]);

  // Render & Update Device Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove stale markers
    Object.keys(markersRef.current).forEach((key) => {
      if (!devices.some((d) => `dev-${d.id}` === key)) {
        map.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

    devices.forEach((dev) => {
      const coords = getDeviceCoordinates(dev);
      const isSelected = dev.id === selectedDeviceId;
      const key = `dev-${dev.id}`;

      let iconEmoji = "🖨️";
      let badgeBg = "bg-emerald-600";
      if (dev.type === "Van GPS Tracker") {
        iconEmoji = "📡";
        badgeBg = "bg-blue-600";
      } else if (dev.type === "RFID Student Card Reader") {
        iconEmoji = "⚡";
        badgeBg = "bg-purple-600";
      } else if (dev.type === "Camera QR Scanner") {
        iconEmoji = "📷";
        badgeBg = "bg-amber-600";
      }

      const isOnline = dev.status === "Online & Ready" || dev.status === "Printing / Active";
      const statusDotColor = isOnline ? "bg-emerald-400" : "bg-slate-400";
      const ringStyle = isSelected
        ? "ring-4 ring-amber-400 border-amber-400 scale-110 shadow-2xl z-30"
        : "border-slate-700 shadow-lg hover:scale-105";

      const markerHtml = `
        <div class="relative flex items-center cursor-pointer font-sans">
          ${isSelected ? '<div class="absolute -inset-3 bg-amber-400/30 rounded-2xl animate-ping pointer-events-none"></div>' : ""}
          <div class="bg-slate-950 text-white border-2 ${ringStyle} p-2 rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all duration-200">
            <div class="${badgeBg} text-white p-1.5 rounded-xl font-bold flex items-center justify-center text-xs">
              ${iconEmoji}
            </div>
            <div class="pr-1">
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-white text-xs">${dev.name}</span>
                <span class="w-2 h-2 rounded-full ${statusDotColor} ${isOnline ? "animate-ping" : ""}"></span>
              </div>
              <span class="text-[10px] text-amber-300 font-bold block truncate max-w-[150px]">
                📍 ${dev.lastKnownLocation || "School Grounds"}
              </span>
            </div>
          </div>
        </div>
      `;

      const deviceIcon = L.divIcon({
        className: `custom-dev-icon-${dev.id}`,
        html: markerHtml,
        iconSize: [210, 48],
        iconAnchor: [105, 24],
      });

      if (markersRef.current[key]) {
        markersRef.current[key].setLatLng([coords.lat, coords.lng]);
        markersRef.current[key].setIcon(deviceIcon);
      } else {
        const marker = L.marker([coords.lat, coords.lng], { icon: deviceIcon }).addTo(map);

        marker.on("click", () => {
          onSelectDevice(dev.id);
        });

        markersRef.current[key] = marker;
      }
    });
  }, [devices, selectedDeviceId]);

  // Fly to selected device location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedDevice) return;

    const coords = getDeviceCoordinates(selectedDevice);
    map.flyTo([coords.lat, coords.lng], 16, {
      duration: 1.2,
    });
  }, [selectedDeviceId]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenterSchool = () => {
    mapInstanceRef.current?.flyTo([SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng], 15, { duration: 1 });
  };

  return (
    <div
      className={`bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between relative transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50 rounded-3xl border-2 border-amber-400" : "h-[480px] w-full"
      }`}
    >
      {/* MAP HEADER BAR */}
      <div className="z-20 bg-slate-900/90 backdrop-blur-md p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                Hardware Device GPS Location Tracker
              </span>
              <span className="bg-emerald-950 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-full border border-emerald-800 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                {devices.length} Devices Mapped
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time physical locations of Printers, GPS Trackers & Card Readers
            </p>
          </div>
        </div>

        {/* MAP HUD CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Tile Layers Switcher */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
            <button
              onClick={() => setMapTheme("street")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "street" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3 h-3" />
              Street
            </button>
            <button
              onClick={() => setMapTheme("satellite")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "satellite" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" />
              Satellite
            </button>
            <button
              onClick={() => setMapTheme("dark")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "dark" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <MapIcon className="w-3 h-3" />
              Dark GIS
            </button>
          </div>

          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRecenterSchool}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
              title="Recenter Map on Wisdom School"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title={isExpanded ? "Collapse Map" : "Expand Map Fullscreen"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onCloseMap && (
            <button
              onClick={onCloseMap}
              className="p-2 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-red-200 rounded-xl border border-slate-700 transition"
              title="Close Location Map"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* LEAFLET CONTAINER */}
      <div className="relative w-full h-full flex-1 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* SELECTED DEVICE TELEMETRY OVERLAY PANEL */}
        {selectedDevice && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/95 text-white border border-slate-800 p-4 rounded-2xl shadow-2xl text-xs space-y-3 backdrop-blur-md max-w-xs sm:max-w-sm w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="font-extrabold text-white text-sm truncate">
                  {selectedDevice.name}
                </span>
              </div>
              <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30">
                {selectedDevice.type}
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[9px] uppercase text-slate-400 font-bold block">
                Last Known Physical Location
              </span>
              <p className="text-amber-300 font-extrabold text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                {selectedDevice.lastKnownLocation || "Wisdom School Administrative Block"}
              </p>
              <span className="text-[10px] text-cyan-400 font-mono block">
                GPS: {getDeviceCoordinates(selectedDevice).lat.toFixed(4)}° N, {getDeviceCoordinates(selectedDevice).lng.toFixed(4)}° E
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[8px] uppercase text-slate-400 font-bold block">Hardware Model</span>
                <span className="text-slate-200 font-bold truncate block">{selectedDevice.model}</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[8px] uppercase text-slate-400 font-bold block">Port / MAC / IP</span>
                <span className="text-slate-200 font-bold truncate block">{selectedDevice.portOrAddress}</span>
              </div>

              {selectedDevice.assignedDriverName && (
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] uppercase text-slate-400 font-bold block">Assigned Operator</span>
                    <span className="text-blue-300 font-bold text-xs">{selectedDevice.assignedDriverName}</span>
                  </div>
                  {selectedDevice.serialNumber && (
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      #{selectedDevice.serialNumber}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-1 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Tested: {selectedDevice.lastTestedTime}</span>

              {onRunTestPrint && (
                <button
                  onClick={() => onRunTestPrint(selectedDevice)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-300" />
                  Test Device Slip
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MAP BOTTOM DEVICE SELECTION STRIP */}
      <div className="z-20 bg-slate-900/90 backdrop-blur-md p-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5">
          <span className="text-slate-400 font-bold text-[10px] uppercase whitespace-nowrap">Select Device:</span>
          {devices.map((dev) => (
            <button
              key={dev.id}
              onClick={() => onSelectDevice(dev.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                dev.id === selectedDeviceId
                  ? "bg-amber-400 text-slate-950 font-black shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              <span>{dev.type === "Van GPS Tracker" ? "📡" : dev.type === "RFID Student Card Reader" ? "⚡" : "🖨️"}</span>
              <span>{dev.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
