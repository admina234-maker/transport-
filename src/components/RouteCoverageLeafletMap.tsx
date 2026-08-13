import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Compass,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Locate,
  Building2,
  Bus,
  MapPin,
  Users,
  Crosshair,
  Layers,
  Radio
} from "lucide-react";
import { Vehicle, RouteStop } from "../types";

interface RouteCoverageLeafletMapProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  viewAllRoutes: boolean;
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  mapTheme: "googleStreet" | "googleSatellite" | "street" | "dark";
  stopStudentsMap: Record<string, { name: string; grade: string; parentPhone: string; status: "Boarded" | "Waiting" }[]>;
  livePulseActive: boolean;
  onSelectVehicle?: (vehicleId: string) => void;
}

const SCHOOL_GPS = {
  lat: 12.3036078,
  lng: 79.8615042,
  name: "Wisdom Nursery & Primary School",
  address: "Isur Chunambedu Road, Essur - 603310",
};

const MAP_TILE_CONFIGS = {
  googleStreet: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
    name: "Google Street",
  },
  googleSatellite: {
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google Satellite</a>',
    name: "Google Satellite",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO Dark</a>',
    name: "Blueprint Dark",
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: "OpenStreetMap",
  },
};

// Route color assignment palette per vehicle index
const VEHICLE_ROUTE_COLORS = [
  { main: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)", name: "Purple" },
  { main: "#ec4899", glow: "rgba(236, 72, 153, 0.4)", name: "Pink" },
  { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", name: "Amber" },
  { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)", name: "Blue" },
  { main: "#10b981", glow: "rgba(16, 185, 129, 0.4)", name: "Emerald" },
];

export const RouteCoverageLeafletMap: React.FC<RouteCoverageLeafletMapProps> = ({
  vehicles,
  selectedVehicleId,
  viewAllRoutes,
  selectedStopId,
  onSelectStop,
  mapTheme,
  stopStudentsMap,
  livePulseActive,
  onSelectVehicle,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Initialize Map Instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [SCHOOL_GPS.lat, SCHOOL_GPS.lng],
      zoom: 12,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // Create container layer group for routes & markers
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = MAP_TILE_CONFIGS[mapTheme] || MAP_TILE_CONFIGS.dark;
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [mapTheme]);

  // Render Polylines, Stops & Vehicle Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const activeFleet = viewAllRoutes ? vehicles : selectedVehicle ? [selectedVehicle] : vehicles;
    const allBoundsPoints: L.LatLngExpression[] = [[SCHOOL_GPS.lat, SCHOOL_GPS.lng]];

    // 1. School Campus Main Hub Marker
    const schoolIcon = L.divIcon({
      className: "custom-leaflet-school-hub",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%);">
          <div style="
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
            color: #0f172a;
            width: 42px; height: 42px;
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 20px;
            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.5);
            border: 3px solid #ffffff;
          ">
            🏫
          </div>
          <div style="
            background: #0f172a;
            color: #fde047;
            border: 1px solid #eab308;
            font-size: 10px; font-weight: 900;
            padding: 3px 8px; border-radius: 8px; margin-top: 4px;
            white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            text-transform: uppercase; font-family: monospace;
          ">
            Wisdom School Campus
          </div>
        </div>
      `,
      iconSize: [120, 60],
      iconAnchor: [60, 30],
    });

    const schoolMarker = L.marker([SCHOOL_GPS.lat, SCHOOL_GPS.lng], { icon: schoolIcon }).addTo(layerGroup);
    schoolMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
        <span style="background:#fef3c7; color:#92400e; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; text-transform:uppercase;">Central Transport Hub</span>
        <h4 style="margin: 4px 0 2px 0; font-weight: 900; font-size: 14px; color:#0f172a;">${SCHOOL_GPS.name}</h4>
        <p style="margin: 0; font-size: 11px; color: #64748b;">${SCHOOL_GPS.address}</p>
      </div>
    `);

    // 2. Render Vehicle Bus Routes Polylines & Pickup Stops
    activeFleet.forEach((v, vIndex) => {
      const isSelectedVehicle = v.id === selectedVehicleId;
      const palette = VEHICLE_ROUTE_COLORS[vIndex % VEHICLE_ROUTE_COLORS.length];

      // Assemble coordinates for route line starting and ending at school campus
      const stopPoints: [number, number][] = v.stops
        .filter((s) => s.latitude && s.longitude && s.distanceFromSchoolKm > 0)
        .map((s) => [s.latitude, s.longitude]);

      if (stopPoints.length === 0) return;

      const routePoints: [number, number][] = [
        [SCHOOL_GPS.lat, SCHOOL_GPS.lng],
        ...stopPoints,
        [SCHOOL_GPS.lat, SCHOOL_GPS.lng],
      ];

      routePoints.forEach((pt) => allBoundsPoints.push(pt));

      // Glow Shadow Polyline
      L.polyline(routePoints, {
        color: palette.glow,
        weight: isSelectedVehicle ? 10 : 6,
        opacity: 0.8,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      // Main Route Line
      L.polyline(routePoints, {
        color: palette.main,
        weight: isSelectedVehicle ? 5 : 3.5,
        opacity: isSelectedVehicle ? 1.0 : 0.6,
        dashArray: isSelectedVehicle ? undefined : "6, 8",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      // 3. Render Stops Markers for this Vehicle
      v.stops.forEach((stop, sIndex) => {
        if (!stop.latitude || !stop.longitude || stop.distanceFromSchoolKm === 0) return;

        const isStopSelected = stop.id === selectedStopId;
        const studentsList = stopStudentsMap[stop.id] || [];
        const studentsCount = studentsList.length || stop.studentsCount;

        const stopDivIcon = L.divIcon({
          className: "custom-route-stop-pin",
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; transform: translate(-50%, -50%);">
              <div style="
                background: ${isStopSelected ? "#8b5cf6" : "#0f172a"};
                color: ${isStopSelected ? "#ffffff" : "#f1f5f9"};
                border: 2px solid ${isStopSelected ? "#fde047" : palette.main};
                width: ${isStopSelected ? "34px" : "28px"};
                height: ${isStopSelected ? "34px" : "28px"};
                border-radius: 12px;
                display: flex; align-items: center; justify-content: center;
                font-weight: 900; font-size: ${isStopSelected ? "13px" : "11px"};
                box-shadow: ${isStopSelected ? "0 0 16px rgba(253, 224, 71, 0.8)" : "0 4px 12px rgba(0,0,0,0.4)"};
                transition: all 0.2s ease-in-out;
              ">
                ${sIndex + 1}
              </div>
              <div style="
                background: rgba(15, 23, 42, 0.95);
                color: ${isStopSelected ? "#fde047" : "#f8fafc"};
                border: 1px solid ${isStopSelected ? "#fde047" : "#334155"};
                font-size: 10px; font-weight: 800;
                padding: 2px 7px; border-radius: 6px; margin-top: 3px;
                white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                font-family: sans-serif;
              ">
                ${stop.stopName} (${studentsCount} 👤)
              </div>
            </div>
          `,
          iconSize: [120, 50],
          iconAnchor: [60, 25],
        });

        const stopMarker = L.marker([stop.latitude, stop.longitude], { icon: stopDivIcon }).addTo(layerGroup);

        // Click Event to select stop
        stopMarker.on("click", () => {
          onSelectStop(stop.id);
          if (onSelectVehicle && v.id !== selectedVehicleId) {
            onSelectVehicle(v.id);
          }
        });

        // Popup Content
        const studentsHtml = studentsList.length > 0
          ? studentsList.map((st) => `<li style="margin-bottom:2px;"><b>${st.name}</b> (${st.grade}) - <span style="color:${st.status==='Boarded'?'#059669':'#d97706'}">${st.status}</span></li>`).join("")
          : `<li>${stop.studentsCount} Students Assigned</li>`;

        stopMarker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 200px; padding: 2px; color: #0f172a;">
            <div style="display:flex; justify-between; align-items:center; gap:8px;">
              <span style="background:#e0e7ff; color:#3730a3; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; text-transform:uppercase;">Stop #${sIndex + 1}</span>
              <span style="font-size:11px; font-weight:800; color:#6b21a8; font-family:monospace;">${stop.distanceFromSchoolKm} km to Gate</span>
            </div>
            <h4 style="margin:6px 0 2px 0; font-weight:900; font-size:14px; color:#0f172a;">${stop.stopName}</h4>
            <p style="margin:0 0 8px 0; font-size:11px; color:#64748b;">📍 ${stop.landmark}</p>
            
            <div style="background:#f8fafc; padding:6px 8px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:8px; font-size:11px;">
              <div>🌅 Morning Pickup: <b>${stop.scheduledTimeMorning}</b></div>
              <div>🌇 Evening Drop-off: <b>${stop.scheduledTimeEvening}</b></div>
            </div>

            <div style="font-size:11px; font-weight:800; color:#334155; margin-bottom:4px;">Enrolled Students (${studentsCount}):</div>
            <ul style="margin:0; padding-left:16px; font-size:11px; color:#475569; max-height:100px; overflow-y:auto;">
              ${studentsHtml}
            </ul>
          </div>
        `);
      });

      // 4. Render Vehicle GPS Marker
      if (v.currentLat && v.currentLng) {
        allBoundsPoints.push([v.currentLat, v.currentLng]);

        const vanDivIcon = L.divIcon({
          className: "custom-route-van-pin",
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%);">
              ${
                livePulseActive
                  ? `<div style="
                      position: absolute; width: 48px; height: 48px;
                      border-radius: 50%; background: rgba(16, 185, 129, 0.4);
                      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                    "></div>`
                  : ""
              }
              <div style="
                background: #10b981;
                color: #022c22;
                width: 38px; height: 38px;
                border-radius: 14px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: 900;
                box-shadow: 0 8px 20px rgba(16, 185, 129, 0.6);
                border: 2px solid #ffffff; z-index: 10;
              ">
                🚌
              </div>
              <div style="
                background: #022c22; color: #6ee7b7;
                border: 1px solid #10b981;
                font-size: 9px; font-weight: 900;
                padding: 2px 6px; border-radius: 6px; margin-top: 3px;
                white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                font-family: monospace; z-index: 10;
              ">
                ${v.registrationNumber} (${v.speedKmH} km/h)
              </div>
            </div>
          `,
          iconSize: [120, 60],
          iconAnchor: [60, 30],
        });

        const vanMarker = L.marker([v.currentLat, v.currentLng], { icon: vanDivIcon }).addTo(layerGroup);
        vanMarker.bindPopup(`
          <div style="font-family: sans-serif; padding: 2px; color: #0f172a;">
            <span style="background:#d1fae5; color:#065f46; font-size:10px; font-weight:800; px:2px 6px; border-radius:4px; text-transform:uppercase;">Live Telemetry Active</span>
            <h4 style="margin: 4px 0 2px 0; font-weight: 900; font-size: 14px;">${v.registrationNumber} (${v.routeName})</h4>
            <p style="margin:0; font-size:11px; color:#475569;">Driver: <b>${v.driverName}</b> (${v.driverPhone})</p>
            <p style="margin:2px 0 0 0; font-size:11px; color:#059669; font-weight:800;">Speed: ${v.speedKmH} km/h | Onboard: ${v.currentOccupancy}/${v.capacity}</p>
          </div>
        `);
      }
    });

    // Fit Bounds when fleet/view updates
    if (allBoundsPoints.length > 1) {
      try {
        const bounds = L.latLngBounds(allBoundsPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (err) {
        // Fallback
      }
    }
  }, [vehicles, selectedVehicleId, viewAllRoutes, selectedStopId, stopStudentsMap, livePulseActive]);

  // Handlers for floating map controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const activeFleet = viewAllRoutes ? vehicles : selectedVehicle ? [selectedVehicle] : vehicles;
    const pts: L.LatLngExpression[] = [[SCHOOL_GPS.lat, SCHOOL_GPS.lng]];

    activeFleet.forEach((v) => {
      v.stops.forEach((s) => {
        if (s.latitude && s.longitude) pts.push([s.latitude, s.longitude]);
      });
      if (v.currentLat && v.currentLng) pts.push([v.currentLat, v.currentLng]);
    });

    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
    }
  };

  const handleCenterSchool = () => {
    mapInstanceRef.current?.setView([SCHOOL_GPS.lat, SCHOOL_GPS.lng], 13);
  };

  return (
    <div className="relative w-full h-[480px] rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
      {/* Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Top Left Controls: Coordinate Badge */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur text-white px-3 py-1.5 rounded-2xl border border-slate-700 text-[10px] font-mono font-bold flex items-center gap-2 shadow-xl">
          <Compass className="w-4 h-4 text-purple-400 animate-spin-slow" />
          <div>
            <span className="block text-slate-400 text-[9px] uppercase">Campus Hub Origin</span>
            <span>12°18'13"N 79°51'41"E (Essur)</span>
          </div>
        </div>
      </div>

      {/* Floating Top Right Controls: Telemetry Speed Badge */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur text-yellow-400 px-3 py-1.5 rounded-2xl border border-slate-700 text-[10px] font-mono font-black flex items-center gap-1.5 shadow-xl">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span>SPEED: {selectedVehicle.speedKmH} KM/H</span>
        </div>
      </div>

      {/* Floating Right Map Zoom & Recenter Controls */}
      <div className="absolute top-16 right-4 z-[400] flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700 shadow-lg cursor-pointer transition"
          title="Zoom In Map"
        >
          <ZoomIn className="w-4 h-4 text-purple-300" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700 shadow-lg cursor-pointer transition"
          title="Zoom Out Map"
        >
          <ZoomOut className="w-4 h-4 text-purple-300" />
        </button>

        <button
          onClick={handleFitBounds}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-yellow-400 rounded-xl border border-slate-700 shadow-lg cursor-pointer transition"
          title="Fit Coverage Area Bounds"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleCenterSchool}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 rounded-xl border border-slate-700 shadow-lg cursor-pointer transition"
          title="Center on Wisdom School Campus"
        >
          <Locate className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Interactive Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-amber-500 to-yellow-400 border border-white shadow-sm inline-block" />
            <span className="font-extrabold text-white">Wisdom School Gate</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-purple-600 border border-yellow-300 shadow-sm inline-block" />
            <span className="font-extrabold text-white">Pickup Stops</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-300 shadow-sm inline-block" />
            <span className="font-extrabold text-white">Active Van GPS</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-8 h-1 rounded bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 inline-block" />
            <span className="font-extrabold text-purple-300">Route Polylines</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            {viewAllRoutes ? "ALL FLEET COVERAGE" : selectedVehicle.routeName}
          </span>
        </div>
      </div>
    </div>
  );
};
