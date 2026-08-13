import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapPin,
  Globe,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  CheckCircle2,
  Send,
  ExternalLink,
  Compass,
  AlertCircle
} from "lucide-react";
import { Vehicle } from "../types";
import { calculateMonthlyTransportFee } from "../utils/feeCalculator";

interface StudentPickupMapPreviewProps {
  pickupLat: number;
  pickupLng: number;
  stopName: string;
  studentName: string;
  assignedVehicle?: Vehicle;
  onChangeLocation: (lat: number, lng: number, calculatedKm: number) => void;
  distanceKm: number;
  parentPhone?: string;
}

const SCHOOL_CAMPUS_GPS = {
  lat: 12.3036078,
  lng: 79.8615042,
  name: "Wisdom Nursery & Primary School",
  address: "Isur Chunambedu Road, Essur - 603310 (ஈசூர் - 603310)",
};

// Calculate Haversine direct road distance in km
export function calculateRoadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directKm = R * c;
  // Apply 1.22x road factor for actual driving route around Essur/Cheyyar roads
  const roadKm = directKm * 1.22;
  return Math.max(0.5, parseFloat(roadKm.toFixed(1)));
}

export const StudentPickupMapPreview: React.FC<StudentPickupMapPreviewProps> = ({
  pickupLat,
  pickupLng,
  stopName,
  studentName,
  assignedVehicle,
  onChangeLocation,
  distanceKm,
  parentPhone = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapTheme, setMapTheme] = useState<"googleStreet" | "googleSatellite" | "street" | "dark">("googleStreet");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const MAP_TILES = {
    googleStreet: {
      url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: '&copy; Google Maps',
    },
    googleSatellite: {
      url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attribution: '&copy; Google Maps Satellite',
    },
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; OpenStreetMap',
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; CARTO',
    },
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = pickupLat || SCHOOL_CAMPUS_GPS.lat + 0.003;
      const initialLng = pickupLng || SCHOOL_CAMPUS_GPS.lng + 0.003;

      const map = L.map(mapContainerRef.current, {
        center: [(SCHOOL_CAMPUS_GPS.lat + initialLat) / 2, (SCHOOL_CAMPUS_GPS.lng + initialLng) / 2],
        zoom: 13,
        zoomControl: false,
      });

      const tileConfig = MAP_TILES[mapTheme];
      const tiles = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;

      // Add School Marker
      const schoolIcon = L.divIcon({
        className: "custom-school-pin",
        html: `
          <div style="background-color: #0f172a; border: 2px solid #f59e0b; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 16px;">
            🏫
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng], { icon: schoolIcon })
        .addTo(map)
        .bindTooltip(`<b>${SCHOOL_CAMPUS_GPS.name}</b><br/>Main Campus Hub`, {
          permanent: false,
          direction: "top",
        });

      // Add Draggable Student Pickup Marker
      const pickupIcon = L.divIcon({
        className: "custom-pickup-pin",
        html: `
          <div style="background-color: #059669; border: 3px solid #ffffff; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(5,150,105,0.6); font-size: 18px; cursor: grab;">
            📍
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const pMarker = L.marker([initialLat, initialLng], {
        icon: pickupIcon,
        draggable: true,
      }).addTo(map);

      pMarker.bindTooltip(`<b>Pickup: ${stopName || studentName}</b><br/>Drag to adjust location`, {
        permanent: true,
        direction: "top",
      });

      pMarker.on("dragend", () => {
        const pos = pMarker.getLatLng();
        const calcKm = calculateRoadDistanceKm(
          SCHOOL_CAMPUS_GPS.lat,
          SCHOOL_CAMPUS_GPS.lng,
          pos.lat,
          pos.lng
        );
        onChangeLocation(pos.lat, pos.lng, calcKm);
      });

      pickupMarkerRef.current = pMarker;

      // Click map to reposition pickup stop
      map.on("click", (e: L.LeafletMouseEvent) => {
        pMarker.setLatLng(e.latlng);
        const calcKm = calculateRoadDistanceKm(
          SCHOOL_CAMPUS_GPS.lat,
          SCHOOL_CAMPUS_GPS.lng,
          e.latlng.lat,
          e.latlng.lng
        );
        onChangeLocation(e.latlng.lat, e.latlng.lng, calcKm);
      });

      // Add dashed line connecting school to pickup stop
      const polyline = L.polyline(
        [
          [SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng],
          [initialLat, initialLng],
        ],
        {
          color: "#10b981",
          weight: 4,
          dashArray: "8, 8",
          opacity: 0.85,
        }
      ).addTo(map);

      polylineRef.current = polyline;

      // Auto fit bounds
      const bounds = L.latLngBounds([
        [SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng],
        [initialLat, initialLng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const tileConfig = MAP_TILES[mapTheme];
      const newTiles = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTiles;
    }
  }, [mapTheme]);

  // Update pickup marker position & polyline when props change
  useEffect(() => {
    if (!pickupMarkerRef.current || !mapInstanceRef.current) return;

    const curLat = pickupLat || SCHOOL_CAMPUS_GPS.lat + 0.003;
    const curLng = pickupLng || SCHOOL_CAMPUS_GPS.lng + 0.003;

    pickupMarkerRef.current.setLatLng([curLat, curLng]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs([
        [SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng],
        [curLat, curLng],
      ]);
    }
  }, [pickupLat, pickupLng]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const curLat = pickupLat || SCHOOL_CAMPUS_GPS.lat + 0.003;
    const curLng = pickupLng || SCHOOL_CAMPUS_GPS.lng + 0.003;
    const bounds = L.latLngBounds([
      [SCHOOL_CAMPUS_GPS.lat, SCHOOL_CAMPUS_GPS.lng],
      [curLat, curLng],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  // Preset stop selection from vehicle route
  const handleSelectRouteStop = (stop: { latitude: number; longitude: number; stopName: string; distanceFromSchoolKm: number }) => {
    if (!stop.latitude || !stop.longitude) return;
    onChangeLocation(stop.latitude, stop.longitude, stop.distanceFromSchoolKm || distanceKm);
  };

  const monthlyFeeEst = calculateMonthlyTransportFee(distanceKm, assignedVehicle?.type || "Van (14-Seater)");
  const googleMapsLiveUrl = `https://maps.google.com/?q=${pickupLat || SCHOOL_CAMPUS_GPS.lat},${pickupLng || SCHOOL_CAMPUS_GPS.lng}`;

  const cleanPhone = parentPhone.replace(/\D/g, "");
  const waMsg = `Hello Parent! Wisdom Nursery & Primary School (Essur) Pickup Location Verification for ${studentName || "Student"}.\n📍 Verified Pickup Stop: ${stopName || "Essur Area"}\n🛣️ Route Distance: ${distanceKm} km | Monthly Fee: ₹${monthlyFeeEst}/mo\n🗺️ Google Maps Live Location: ${googleMapsLiveUrl}\n\nAssigned Van: ${assignedVehicle?.registrationNumber || "School Fleet"}`;
  const whatsappWebUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(waMsg)}`;

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(waMsg);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-3 bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl">
      {/* Map Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              Pickup Route Map Verification (Leaflet GIS)
            </h4>
            <p className="text-[10px] text-slate-400">
              Click map or drag green marker to pinpoint {studentName || "student"}'s exact stop
            </p>
          </div>
        </div>

        {/* Map Tile Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
          <button
            type="button"
            onClick={() => setMapTheme("googleStreet")}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${
              mapTheme === "googleStreet" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => setMapTheme("googleSatellite")}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${
              mapTheme === "googleSatellite" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapTheme("street")}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${
              mapTheme === "street" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {/* Preset Route Stops Dropdown (if assigned vehicle has stops) */}
      {assignedVehicle?.stops && assignedVehicle.stops.length > 0 && (
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px] whitespace-nowrap">
            <Compass className="w-3.5 h-3.5" /> Fast Snap to Route Stop:
          </span>
          <select
            onChange={(e) => {
              const stop = assignedVehicle.stops.find((s) => s.id === e.target.value);
              if (stop) handleSelectRouteStop(stop);
            }}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-1 text-xs font-medium cursor-pointer"
          >
            <option value="">-- Snap Marker to Van Route Stop --</option>
            {assignedVehicle.stops.map((st) => (
              <option key={st.id} value={st.id}>
                {st.stopName} ({st.distanceFromSchoolKm} km from school)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Leaflet Canvas */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Zoom & Recenter HUD Controls */}
        <div className="absolute top-2 right-2 z-[400] flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-lg">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
            title="Fit School and Pickup Bounds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* GPS Badge Overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 shadow">
          <Navigation className="w-3 h-3 text-amber-400 animate-spin" />
          GPS: {pickupLat ? pickupLat.toFixed(4) : "12.3036"}° N, {pickupLng ? pickupLng.toFixed(4) : "79.8615"}° E
        </div>
      </div>

      {/* Live Computed Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Road Distance</span>
          <span className="text-sm font-extrabold text-amber-400 font-mono">{distanceKm} km</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Transport Fee</span>
          <span className="text-sm font-extrabold text-emerald-400 font-mono">₹{monthlyFeeEst.toLocaleString("en-IN")}/mo</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1 flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">GPS Verification</span>
          <span className="text-[11px] font-black text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Leaflet Verified
          </span>
        </div>
      </div>

      {/* WhatsApp Live Location & Alert Trigger ("WHATAPP SENDINGLIVE") */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs">
            WhatsApp
          </div>
          <div>
            <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              WhatsApp Live Location Alert
            </h5>
            <p className="text-[10px] text-slate-400">
              Send parent ({parentPhone || "No Phone"}) pickup map link & live van route
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyWhatsAppText}
            className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-extrabold transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
          >
            {copiedLink ? (
              <span className="text-emerald-400 font-bold">Copied!</span>
            ) : (
              <>Copy Live Link</>
            )}
          </button>

          {cleanPhone ? (
            <a
              href={whatsappWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[11px] transition flex items-center justify-center gap-1 shadow-md cursor-pointer"
            >
              <Send className="w-3 h-3" />
              Send Live WA
            </a>
          ) : (
            <span className="text-[10px] text-slate-500 italic">Enter phone for WA</span>
          )}
        </div>
      </div>
    </div>
  );
};
