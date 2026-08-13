import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  Bus,
  MapPin,
  Navigation,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Phone,
  Zap,
  Radio,
  CheckCircle2,
  Send,
  Compass,
  Search,
  Globe,
  Layers,
  Map as MapIcon
} from "lucide-react";
import { Vehicle, RouteStop } from "../types";

interface InteractiveFleetMapProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
}

// Wisdom School Main Campus (Essur, Cheyyar Road, Tamil Nadu)
const SCHOOL_GPS = {
  lat: 12.3036078,
  lng: 79.8615042,
  name: "Wisdom Nursery & Primary School",
  address: "Isur Chunambedu Road, Essur - 603310 (ஈசூர் - 603310)",
};

// Map Tile Layers Configuration (Including Google Maps Tile Servers & OpenStreetMap)
const MAP_TILES = {
  googleStreet: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
    name: "Google Street Map",
  },
  googleSatellite: {
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps Satellite</a>',
    name: "Google Satellite",
  },
  googleHybrid: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps Hybrid</a>',
    name: "Google Hybrid",
  },
  googleTerrain: {
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps Terrain</a>',
    name: "Google Terrain",
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: "OpenStreetMap View",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: "Dark GIS View",
  },
};

export const InteractiveFleetMap: React.FC<InteractiveFleetMapProps> = ({
  vehicles: initialVehicles,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showStops, setShowStops] = useState<boolean>(true);
  const [showGeofence, setShowGeofence] = useState<boolean>(true);
  const [mapTheme, setMapTheme] = useState<
    "googleStreet" | "googleSatellite" | "googleHybrid" | "googleTerrain" | "street" | "dark"
  >("googleStreet");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [delayAlertSent, setDelayAlertSent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [trafficMode, setTrafficMode] = useState<"clear" | "moderate" | "heavy" | "monsoon">("clear");
  const [showEtaPanel, setShowEtaPanel] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const routePolylinesRef = useRef<L.Polyline[]>([]);
  const geofenceCircleRef = useRef<L.Circle | null>(null);

  // Distance & Real-Time ETA Calculation Engine
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const getVehicleEtaInfo = (v: Vehicle) => {
    const distToSchool = calculateDistanceKm(v.currentLat, v.currentLng, SCHOOL_GPS.lat, SCHOOL_GPS.lng);
    let speed = v.speedKmH || 32;
    if (speed < 10) speed = 25; // realistic fallback urban speed

    let trafficMultiplier = 1.0;
    let extraTrafficMins = 0;
    if (trafficMode === "moderate") {
      trafficMultiplier = 1.25;
      extraTrafficMins = 3;
    } else if (trafficMode === "heavy") {
      trafficMultiplier = 1.6;
      extraTrafficMins = 7;
    } else if (trafficMode === "monsoon") {
      trafficMultiplier = 2.0;
      extraTrafficMins = 12;
    }

    const etaToSchoolMins = Math.max(1, Math.round((distToSchool / (speed / trafficMultiplier)) * 60 + extraTrafficMins));

    // Next stop ETA logic
    let nextStopInfo = { name: "Wisdom School Gate", etaMins: etaToSchoolMins, distKm: distToSchool };
    if (v.stops && v.stops.length > 0) {
      const nextStop = v.stops[v.currentStopIndex || 0] || v.stops[0];
      const distToNext = calculateDistanceKm(v.currentLat, v.currentLng, nextStop.latitude, nextStop.longitude);
      const etaToNextMins = Math.max(1, Math.round((distToNext / (speed / trafficMultiplier)) * 60 + extraTrafficMins / 2));
      nextStopInfo = {
        name: nextStop.stopName,
        etaMins: etaToNextMins,
        distKm: distToNext,
      };
    }

    return {
      distToSchool,
      etaToSchoolMins,
      nextStopInfo,
      trafficMultiplier,
      extraTrafficMins,
    };
  };

  // Sync prop changes
  useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  // Live GPS Coordinate Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((v) => {
          if (v.status !== "In Transit") return v;

          // Tiny GPS nudge along route
          const deltaLat = (Math.random() - 0.48) * 0.0006;
          const deltaLng = (Math.random() - 0.48) * 0.0006;
          const speedVariation = Math.floor(32 + Math.random() * 16);

          return {
            ...v,
            currentLat: parseFloat((v.currentLat + deltaLat).toFixed(4)),
            currentLng: parseFloat((v.currentLng + deltaLng).toFixed(4)),
            speedKmH: speedVariation,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [SCHOOL_GPS.lat, SCHOOL_GPS.lng],
        zoom: 13,
        zoomControl: false,
      });

      const tileConfig = MAP_TILES[mapTheme];
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // School Campus Marker
      const schoolIcon = L.divIcon({
        className: "custom-leaflet-school-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-3 bg-amber-400/40 rounded-full animate-ping"></div>
            <div class="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-3 py-1.5 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2 font-sans font-black text-xs whitespace-nowrap">
              <span class="text-base">🏫</span>
              <span>Wisdom Primary School Campus</span>
            </div>
          </div>
        `,
        iconSize: [180, 44],
        iconAnchor: [90, 22],
      });

      L.marker([SCHOOL_GPS.lat, SCHOOL_GPS.lng], { icon: schoolIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans text-xs">
            <b class="text-amber-600 text-sm">Wisdom Nursery & Primary School</b><br/>
            <span>${SCHOOL_GPS.address}</span><br/>
            <span class="text-emerald-600 font-bold">Main Transport Depot & Central Gate</span>
          </div>
        `);
    }

    // Invalidate size shortly after mount to prevent gray tile glitch
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when expanded changes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Update Tile Layer Theme when mapTheme state changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const tileConfig = MAP_TILES[mapTheme];
    const newLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [mapTheme]);

  // Update Map Geofence Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geofenceCircleRef.current) {
      map.removeLayer(geofenceCircleRef.current);
      geofenceCircleRef.current = null;
    }

    if (showGeofence) {
      // 15km Safe Transport Perimeter
      const circle = L.circle([SCHOOL_GPS.lat, SCHOOL_GPS.lng], {
        radius: 12000, // 12km radius visual circle
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.05,
        weight: 2,
        dashArray: "6, 6",
      }).addTo(map);

      circle.bindTooltip("15km Safe School Transport Geofence Zone", {
        permanent: false,
        direction: "top",
      });

      geofenceCircleRef.current = circle;
    }
  }, [showGeofence]);

  // Update Vehicle Markers and Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old route polylines
    routePolylinesRef.current.forEach((pl) => map.removeLayer(pl));
    routePolylinesRef.current = [];

    // Clear old stop markers if showStops is false
    Object.keys(markersRef.current).forEach((key) => {
      if (key.startsWith("stop-")) {
        if (!showStops) {
          map.removeLayer(markersRef.current[key]);
          delete markersRef.current[key];
        }
      }
    });

    const routeColors = ["#06b6d4", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];

    vehicles.forEach((v, vIdx) => {
      const color = routeColors[vIdx % routeColors.length];
      const isSelected = v.id === selectedVehicleId;

      // Draw Route Polyline
      if (showRoutes && v.stops && v.stops.length > 0) {
        const latLngs: [number, number][] = v.stops.map((stp) => [stp.latitude, stp.longitude]);
        // Connect to current vehicle & school campus
        latLngs.unshift([v.currentLat, v.currentLng]);
        latLngs.push([SCHOOL_GPS.lat, SCHOOL_GPS.lng]);

        const polyline = L.polyline(latLngs, {
          color: color,
          weight: isSelected ? 5 : 3,
          opacity: isSelected ? 0.9 : 0.5,
          dashArray: isSelected ? undefined : "6, 6",
        }).addTo(map);

        routePolylinesRef.current.push(polyline);
      }

      // Draw Pickup Stops Markers
      if (showStops && v.stops) {
        v.stops.forEach((stp, sIdx) => {
          if (stp.distanceFromSchoolKm === 0) return;

          const stopMarkerKey = `stop-${v.id}-${stp.id}`;
          if (!markersRef.current[stopMarkerKey]) {
            const stopIcon = L.divIcon({
              className: "custom-leaflet-stop-pin",
              html: `
                <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-300 font-mono text-[10px] font-black flex items-center justify-center shadow-lg hover:scale-125 transition">
                  ${sIdx + 1}
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const stopMarker = L.marker([stp.latitude, stp.longitude], { icon: stopIcon })
              .addTo(map)
              .bindPopup(`
                <div class="p-2 font-sans text-xs text-slate-900 space-y-1.5 min-w-[200px]">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span class="text-[10px] font-bold uppercase text-amber-600">🚏 Student Pick-Up Point #${sIdx + 1}</span>
                    <span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">${stp.distanceFromSchoolKm} km to Gate</span>
                  </div>
                  <b class="text-sm font-black text-slate-900 block">${stp.stopName}</b>
                  <p class="text-slate-600 text-xs flex items-center gap-1">📍 ${stp.landmark}</p>
                  <div class="pt-1.5 border-t border-slate-100 text-[10px] font-mono flex justify-between items-center font-bold text-slate-700 bg-amber-50 p-1.5 rounded-lg">
                    <span>Morning Pickup: <strong>${stp.scheduledTimeMorning}</strong></span>
                    <span class="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded">👥 ${stp.studentsCount} Students</span>
                  </div>
                  <div class="text-[9px] text-slate-500 font-mono">Assigned Route: ${v.routeName} (${v.registrationNumber})</div>
                </div>
              `);

            stopMarker.on("click", () => {
              onSelectVehicle(v.id);
            });

            markersRef.current[stopMarkerKey] = stopMarker;
          }
        });
      }

      // Update / Create Vehicle Marker
      const vehicleKey = `vehicle-${v.id}`;
      const statusBg = v.status === "In Transit" ? "bg-emerald-500 text-slate-950" : "bg-blue-600 text-white";
      const borderStyle = isSelected ? "border-amber-400 ring-4 ring-amber-400/30 scale-110" : "border-slate-700";

      const etaData = getVehicleEtaInfo(v);
      const trafficBadgeColor =
        trafficMode === "clear"
          ? "bg-emerald-500/90 text-slate-950"
          : trafficMode === "moderate"
          ? "bg-amber-400 text-slate-950"
          : trafficMode === "heavy"
          ? "bg-rose-500 text-white"
          : "bg-indigo-600 text-white";

      const vehicleHtml = `
        <div class="relative flex flex-col items-center cursor-pointer font-sans">
          <!-- Real-Time Floating ETA Overlay Badge Above Marker -->
          <div class="mb-1 bg-slate-950 text-white border border-amber-400/80 px-2 py-0.5 rounded-full font-black text-[10px] shadow-2xl flex items-center gap-1.5 whitespace-nowrap z-30 font-mono">
            <span class="text-amber-400">⏱️ ETA: ${etaData.etaToSchoolMins} mins</span>
            <span class="text-slate-400">(${etaData.distToSchool} km)</span>
            <span class="${trafficBadgeColor} text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
              ${trafficMode === "clear" ? "🟢 Clear" : trafficMode === "moderate" ? "🟡 Moderate" : trafficMode === "heavy" ? "🔴 Jam" : "🌧️ Rain"}
            </span>
          </div>

          <div class="relative flex items-center">
            ${isSelected ? '<div class="absolute -inset-3 bg-amber-400/30 rounded-2xl animate-ping pointer-events-none"></div>' : ""}
            <div class="bg-slate-950 text-white border-2 ${borderStyle} p-2 rounded-2xl shadow-2xl flex items-center gap-2 font-mono text-xs whitespace-nowrap">
              <div class="${statusBg} p-1.5 rounded-xl font-bold flex items-center justify-center text-sm">
                🚌
              </div>
              <div>
                <div class="flex items-center gap-1">
                  <span class="font-extrabold text-white text-xs">${v.registrationNumber}</span>
                  <span class="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded font-bold">${v.speedKmH} km/h</span>
                </div>
                <div class="flex items-center justify-between gap-2 text-[10px] text-slate-300">
                  <span class="truncate">${v.driverName}</span>
                  <span class="text-cyan-300 font-extrabold">🚏 ${etaData.nextStopInfo.etaMins}m next</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        className: `custom-vehicle-icon-${v.id}`,
        html: vehicleHtml,
        iconSize: [200, 72],
        iconAnchor: [100, 36],
      });

      if (markersRef.current[vehicleKey]) {
        const marker = markersRef.current[vehicleKey];
        marker.setLatLng([v.currentLat, v.currentLng]);
        marker.setIcon(vehicleIcon);
      } else {
        const marker = L.marker([v.currentLat, v.currentLng], { icon: vehicleIcon }).addTo(map);

        marker.on("click", () => {
          onSelectVehicle(v.id);
        });

        markersRef.current[vehicleKey] = marker;
      }
    });
  }, [vehicles, selectedVehicleId, showRoutes, showStops, trafficMode]);

  // Center camera on selected vehicle when selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeV = vehicles.find((v) => v.id === selectedVehicleId);
    if (activeV) {
      map.flyTo([activeV.currentLat, activeV.currentLng], 14, {
        duration: 1.2,
      });
    }
  }, [selectedVehicleId]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetMap = () => {
    mapInstanceRef.current?.flyTo([SCHOOL_GPS.lat, SCHOOL_GPS.lng], 13, { duration: 1 });
  };

  const handleSendDelayAlert = (regNumber: string) => {
    setDelayAlertSent(regNumber);
    setTimeout(() => setDelayAlertSent(null), 4000);
  };

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const handleSearchLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const query = searchQuery.toLowerCase();
    if (query.includes("cheyyar")) {
      mapInstanceRef.current.flyTo([12.3160, 79.8384], 15, { duration: 1 });
    } else if (query.includes("vandavasi")) {
      mapInstanceRef.current.flyTo([12.2653, 79.8894], 14, { duration: 1 });
    } else if (query.includes("essur") || query.includes("wisdom")) {
      mapInstanceRef.current.flyTo([SCHOOL_GPS.lat, SCHOOL_GPS.lng], 15, { duration: 1 });
    } else if (query.includes("tindivanam")) {
      mapInstanceRef.current.flyTo([12.2360, 79.9100], 14, { duration: 1 });
    } else {
      // Find matching vehicle
      const foundV = vehicles.find(
        (v) =>
          v.registrationNumber.toLowerCase().includes(query) ||
          v.driverName.toLowerCase().includes(query) ||
          v.routeName.toLowerCase().includes(query)
      );
      if (foundV) {
        onSelectVehicle(foundV.id);
      }
    }
  };

  return (
    <div
      className={`bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between relative transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50 rounded-3xl border-2 border-amber-400" : "min-h-[550px] h-[600px] w-full"
      }`}
    >
      {/* MAP TOP HUD CONTROL BAR */}
      <div className="z-20 bg-slate-900/90 backdrop-blur-md p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                Live Van GPS & Real-Time Traffic Radar
              </span>
              <span className="bg-emerald-900/80 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-full border border-emerald-700 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Live GPS ETA Pulse
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cheyyar, Essur & Vandavasi Transport Corridor • Wisdom School Campus
            </p>
          </div>
        </div>

        {/* Traffic Simulation Condition Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[9px] uppercase text-amber-400 font-black px-1.5">Traffic:</span>
          <button
            onClick={() => setTrafficMode("clear")}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
              trafficMode === "clear"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
            title="Clear Traffic Flow (Normal Speed)"
          >
            🟢 Clear Flow
          </button>
          <button
            onClick={() => setTrafficMode("moderate")}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
              trafficMode === "moderate"
                ? "bg-amber-400 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
            title="Moderate Traffic (+3m Delay)"
          >
            🟡 Moderate (+3m)
          </button>
          <button
            onClick={() => setTrafficMode("heavy")}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
              trafficMode === "heavy"
                ? "bg-rose-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            title="Heavy School Zone Traffic (+7m Delay)"
          >
            🔴 Heavy (+7m)
          </button>
          <button
            onClick={() => setTrafficMode("monsoon")}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
              trafficMode === "monsoon"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            title="Monsoon Rain Delay (+12m Delay)"
          >
            🌧️ Rain (+12m)
          </button>
        </div>

        {/* Location Search Input */}
        <form onSubmit={handleSearchLocation} className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <Search className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <input
            type="text"
            placeholder="Search Cheyyar, Essur, Van..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-400 px-2 py-1 outline-none w-32 sm:w-40 font-bold"
          />
          <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10px] cursor-pointer">
            Search
          </button>
        </form>

        {/* HUD Interactive Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layer Visibility Toggles */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                showRoutes ? "bg-cyan-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
              title="Toggle Route Polylines on Map"
            >
              🛣️ Routes
            </button>
            <button
              onClick={() => setShowStops(!showStops)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                showStops ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
              }`}
              title="Toggle Student Pick-Up Points on Map"
            >
              🚏 Student Pickups
            </button>
            <button
              onClick={() => setShowGeofence(!showGeofence)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                showGeofence ? "bg-blue-500 text-white font-black" : "text-slate-400 hover:text-white"
              }`}
              title="Toggle 15km Safe Geofence Zone"
            >
              🛡️ Geofence
            </button>
          </div>

          {/* Map Tile View Switcher */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setMapTheme("googleStreet")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "googleStreet" ? "bg-amber-400 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Google Maps Standard View"
            >
              <Globe className="w-3 h-3 text-blue-400" />
              Google Map
            </button>
            <button
              onClick={() => setMapTheme("googleSatellite")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "googleSatellite" ? "bg-amber-400 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Google Maps High-Res Satellite Imagery"
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              Satellite
            </button>
            <button
              onClick={() => setMapTheme("googleHybrid")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "googleHybrid" ? "bg-amber-400 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Google Maps Hybrid View (Satellite + Labels)"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              Hybrid
            </button>
            <button
              onClick={() => setMapTheme("googleTerrain")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "googleTerrain" ? "bg-amber-400 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Google Maps Terrain View"
            >
              <Compass className="w-3 h-3 text-amber-400" />
              Terrain
            </button>
            <button
              onClick={() => setMapTheme("street")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "street" ? "bg-amber-400 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="OpenStreetMap Standard View"
            >
              <MapIcon className="w-3 h-3 text-indigo-400" />
              OSM
            </button>
            <button
              onClick={() => setMapTheme("dark")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                mapTheme === "dark" ? "bg-amber-400 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
              title="Dark GIS Contrast View"
            >
              <MapIcon className="w-3 h-3 text-purple-400" />
              Dark GIS
            </button>
          </div>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition border cursor-pointer ${
              isSimulating
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? "text-emerald-400 animate-bounce" : ""}`} />
            {isSimulating ? "GPS Movement Active" : "GPS Simulation Paused"}
          </button>

          {/* Zoom & Reset Controls */}
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
              onClick={handleResetMap}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
              title="Recenter Map on School"
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
        </div>
      </div>

      {/* Toast Alert Feedback */}
      {delayAlertSent && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 border border-amber-300 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          Delay WhatsApp broadcast triggered for parents on vehicle {delayAlertSent}!
        </div>
      )}

      {/* MAIN LEAFLET MAP CONTAINER */}
      <div className="relative w-full h-full flex-1 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* LEFT FLOATING REAL-TIME FLEET ETA OVERLAY WIDGET */}
        <div className="absolute top-4 left-4 z-20 hidden md:block max-w-xs w-full">
          <div className="bg-slate-900/95 text-white border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-extrabold text-xs text-white">Real-Time Fleet ETAs</span>
              </div>
              <button
                onClick={() => setShowEtaPanel(!showEtaPanel)}
                className="text-[10px] text-slate-400 hover:text-amber-400 font-bold"
              >
                {showEtaPanel ? "Hide" : "Show"}
              </button>
            </div>

            {showEtaPanel && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {vehicles.map((v) => {
                  const etaInfo = getVehicleEtaInfo(v);
                  const isSel = v.id === selectedVehicleId;

                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVehicle(v.id)}
                      className={`p-2 rounded-xl text-xs cursor-pointer transition border flex items-center justify-between gap-2 ${
                        isSel
                          ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-white">{v.registrationNumber}</span>
                          <span className="text-[9px] text-slate-400">({v.type.split(" ")[0]})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">🚏 {etaInfo.nextStopInfo.name}</span>
                      </div>

                      <div className="text-right font-mono flex-shrink-0">
                        <span className="text-amber-300 font-black text-xs block">
                          ⏱️ {etaInfo.etaToSchoolMins} mins
                        </span>
                        <span className="text-[9px] text-slate-400 block">{etaInfo.distToSchool} km to Gate</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE SELECTED VAN TELEMETRY OVERLAY CARD */}
        {activeVehicle && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/95 text-white border border-slate-800 p-4 rounded-2xl shadow-2xl text-xs space-y-3 backdrop-blur-md max-w-xs sm:max-w-sm w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="font-extrabold text-white text-sm">
                  {activeVehicle.registrationNumber}
                </span>
                <span className="bg-slate-800 text-amber-400 font-mono text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                  {activeVehicle.type}
                </span>
              </div>

              <button
                onClick={() => {
                  mapInstanceRef.current?.flyTo([activeVehicle.currentLat, activeVehicle.currentLng], 15, { duration: 1 });
                }}
                className="p-1 text-slate-400 hover:text-amber-400 transition flex items-center gap-1 font-bold text-[10px]"
                title="Focus Camera"
              >
                <Compass className="w-3.5 h-3.5" />
                Center
              </button>
            </div>

            {/* REAL-TIME ETA OVERLAY BANNER */}
            {(() => {
              const activeEta = getVehicleEtaInfo(activeVehicle);
              return (
                <div className="bg-gradient-to-r from-amber-500/20 via-slate-950 to-slate-950 border border-amber-500/40 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-amber-300 font-black">
                    <span className="flex items-center gap-1 text-xs">
                      ⏱️ ETA to Wisdom School Gate:
                    </span>
                    <span className="text-sm font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg">
                      {activeEta.etaToSchoolMins} mins
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono pt-1 border-t border-slate-800">
                    <span>Distance to Gate: <strong>{activeEta.distToSchool} km</strong></span>
                    <span>Next Stop: <strong>{activeEta.nextStopInfo.etaMins}m ({activeEta.nextStopInfo.name})</strong></span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Speed Gauge</span>
                <span className="text-amber-400 font-black text-sm">{activeVehicle.speedKmH} km/h</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Fuel Reserve</span>
                <span className="text-emerald-400 font-black text-sm">{activeVehicle.fuelLevelPercent}%</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Occupancy</span>
                <span className="text-white font-black text-xs">
                  {activeVehicle.currentOccupancy} / {activeVehicle.capacity} Seats
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Traffic Impact</span>
                <span className="text-cyan-400 text-[10px] font-bold block truncate uppercase">
                  {trafficMode === "clear" ? "🟢 Normal Flow" : trafficMode === "moderate" ? "🟡 +15% Slowdown" : trafficMode === "heavy" ? "🔴 +35% School Jam" : "🌧️ +50% Monsoon"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Route Driver Contact</span>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200">{activeVehicle.driverName}</span>
                <a
                  href={`tel:${activeVehicle.driverPhone}`}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition"
                >
                  <Phone className="w-3 h-3" />
                  Call
                </a>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => handleSendDelayAlert(activeVehicle.registrationNumber)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                Broadcast Live ETA & Delay WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAP BOTTOM LEGEND HUD BAR */}
      <div className="z-20 bg-slate-900/90 backdrop-blur-md p-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Active Fleet Live Selection:</span>
          {vehicles.map((v) => {
            const eta = getVehicleEtaInfo(v);
            return (
              <button
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  v.id === selectedVehicleId
                    ? "bg-amber-400 text-slate-950 font-black"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }`}
              >
                <span>🚌 {v.registrationNumber}</span>
                <span className="text-[10px] opacity-80">({eta.etaToSchoolMins}m)</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-400">Campus GPS: 12.3036° N, 79.8615° E</span>
          <span className="text-emerald-400 font-bold">Wisdom Google & OSM Live Map Active</span>
        </div>
      </div>
    </div>
  );
};
