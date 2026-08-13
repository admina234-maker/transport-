import React, { useState } from "react";
import {
  Navigation,
  Sparkles,
  Zap,
  Phone,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Bus,
  AlertTriangle,
  Play,
  BarChart3,
  TrendingDown,
  Info,
  MapPin,
  Map,
  Compass,
  Layers,
  Radio,
  Send,
  X,
  Users,
  Locate,
  Crosshair,
  ArrowRight,
  CheckCircle,
  Building2,
  BellRing,
  AlertOctagon,
  Sliders,
  Settings,
  RefreshCw,
  Edit3,
  Eye
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Vehicle } from "../types";
import { RouteCoverageLeafletMap } from "./RouteCoverageLeafletMap";

interface RouteOptimizerProps {
  vehicles: Vehicle[];
}

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ vehicles }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || "");
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [driverModeActive, setDriverModeActive] = useState<boolean>(false);
  const [sosTriggered, setSosTriggered] = useState<boolean>(false);
  const [chartTimeframe, setChartTimeframe] = useState<"30days" | "morning" | "evening">("30days");

  // Map Grid State
  const [mapTheme, setMapTheme] = useState<"googleStreet" | "googleSatellite" | "street" | "dark">("dark");
  const [selectedStopId, setSelectedStopId] = useState<string | null>("STP-101");
  const [viewAllRoutes, setViewAllRoutes] = useState<boolean>(false);
  const [livePulseActive, setLivePulseActive] = useState<boolean>(true);
  const [etaBroadcastMsgSent, setEtaBroadcastMsgSent] = useState<boolean>(false);

  // Automated Delay Alerts System State
  const [delayThresholdMins, setDelayThresholdMins] = useState<number>(10);
  const [showAlertConfigModal, setShowAlertConfigModal] = useState<boolean>(false);
  const [smsAlertDispatched, setSmsAlertDispatched] = useState<boolean>(false);
  const [acknowledgedVehicleIds, setAcknowledgedVehicleIds] = useState<string[]>([]);
  const [editingVehicleDelay, setEditingVehicleDelay] = useState<{ id: string; delayMins: number; reason: string } | null>(null);

  // Initial mock scheduled/telemetry delays mapped by vehicle ID
  const [vehicleDelays, setVehicleDelays] = useState<Record<string, { currentDelayMins: number; reason: string; lastUpdated: string }>>({
    "TN-25-AW-1024": { currentDelayMins: 12, reason: "Cheyyar Arch Bridge Road Construction", lastUpdated: "08:05 AM" },
    "TN-25-BX-4098": { currentDelayMins: 7, reason: "Heavy Morning School Zone Traffic", lastUpdated: "08:02 AM" },
    "TN-25-CY-7712": { currentDelayMins: 18, reason: "Tindivanam Highway Toll Gate Bottleneck", lastUpdated: "08:12 AM" },
  });

  // Derived list of vehicles with current delay data
  const vehiclesWithDelayData = vehicles.map((v) => {
    const delayInfo = vehicleDelays[v.id] || { currentDelayMins: 0, reason: "On Schedule", lastUpdated: "Just now" };
    return {
      ...v,
      currentDelayMins: delayInfo.currentDelayMins,
      delayReason: delayInfo.reason,
      delayLastUpdated: delayInfo.lastUpdated,
    };
  });

  // Filter vehicles exceeding configurable delay threshold
  const delayedVehiclesExceedingThreshold = vehiclesWithDelayData.filter(
    (v) => v.currentDelayMins >= delayThresholdMins
  );

  const handleDispatchDelaySMS = (vehicleReg: string, delayMins: number, routeName: string) => {
    setSmsAlertDispatched(true);
    setTimeout(() => setSmsAlertDispatched(false), 4500);
  };

  const handleAcknowledgeAlert = (vehicleId: string) => {
    if (!acknowledgedVehicleIds.includes(vehicleId)) {
      setAcknowledgedVehicleIds([...acknowledgedVehicleIds, vehicleId]);
    }
  };

  const handleResetAlerts = () => {
    setAcknowledgedVehicleIds([]);
  };

  const handleSaveVehicleDelay = () => {
    if (editingVehicleDelay) {
      setVehicleDelays((prev) => ({
        ...prev,
        [editingVehicleDelay.id]: {
          currentDelayMins: Number(editingVehicleDelay.delayMins) || 0,
          reason: editingVehicleDelay.reason || "Traffic Delay",
          lastUpdated: "Just Now",
        },
      }));
      setAcknowledgedVehicleIds((prev) => prev.filter((id) => id !== editingVehicleDelay.id));
      setEditingVehicleDelay(null);
    }
  };

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Sample student data mapping for map stop popovers
  const stopStudentsMap: Record<string, { name: string; grade: string; parentPhone: string; status: "Boarded" | "Waiting" }[]> = {
    "STP-101": [
      { name: "K. Aarav", grade: "Grade 2", parentPhone: "9842103841", status: "Boarded" },
      { name: "S. Harish", grade: "Nursery", parentPhone: "9789312045", status: "Boarded" },
      { name: "M. Priya", grade: "Grade 4", parentPhone: "9600451829", status: "Boarded" },
      { name: "R. Kavin", grade: "LKG", parentPhone: "9176598821", status: "Waiting" },
    ],
    "STP-102": [
      { name: "P. Nivedha", grade: "Grade 1", parentPhone: "9842103842", status: "Boarded" },
      { name: "T. Varun", grade: "UKG", parentPhone: "9789312046", status: "Waiting" },
    ],
    "STP-103": [
      { name: "V. Ananya", grade: "LKG", parentPhone: "9600451830", status: "Waiting" },
      { name: "E. Gokul", grade: "Grade 5", parentPhone: "9176598822", status: "Waiting" },
    ],
    "STP-201": [
      { name: "R. Deepa", grade: "UKG", parentPhone: "9842103843", status: "Boarded" },
      { name: "P. Karthik", grade: "Grade 3", parentPhone: "9789312047", status: "Boarded" },
    ],
    "STP-202": [
      { name: "S. Janani", grade: "Nursery", parentPhone: "9600451831", status: "Boarded" },
      { name: "M. Saravanan", grade: "Grade 2", parentPhone: "9176598823", status: "Waiting" },
    ],
    "STP-203": [
      { name: "A. Mithran", grade: "LKG", parentPhone: "9842103844", status: "Waiting" },
    ],
    "STP-301": [
      { name: "D. Naveen", grade: "Nursery", parentPhone: "9842103845", status: "Boarded" },
      { name: "T. Kavitha", grade: "Grade 1", parentPhone: "9789312048", status: "Boarded" },
    ],
    "STP-302": [
      { name: "S. Vignesh", grade: "Grade 4", parentPhone: "9600451832", status: "Boarded" },
    ],
    "STP-303": [
      { name: "B. Preethi", grade: "UKG", parentPhone: "9176598824", status: "Waiting" },
    ],
  };

  // Compute map bounding box and projected grid coordinates
  const activeFleet = viewAllRoutes ? vehicles : [vehicle];
  const allStops = activeFleet.flatMap((v) => v.stops);
  const allLats = allStops.map((s) => s.latitude).concat(activeFleet.map((v) => v.currentLat));
  const allLngs = allStops.map((s) => s.longitude).concat(activeFleet.map((v) => v.currentLng));

  const minLat = Math.min(...allLats) - 0.006;
  const maxLat = Math.max(...allLats) + 0.006;
  const minLng = Math.min(...allLngs) - 0.006;
  const maxLng = Math.max(...allLngs) + 0.006;

  // Convert GPS coordinates to Map Grid X,Y percentage (12% to 88% range for margins)
  const getCoords = (lat: number, lng: number) => {
    const x = 12 + ((lng - minLng) / (maxLng - minLng || 1)) * 76;
    const y = 88 - ((lat - minLat) / (maxLat - minLat || 1)) * 76;
    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  // Wisdom School Campus GPS position (Main Hub)
  const schoolLat = 12.3036078;
  const schoolLng = 79.8615042;
  const schoolCoords = getCoords(schoolLat, schoolLng);

  // Active selected stop details
  const activeStop = allStops.find((s) => s.id === selectedStopId) || vehicle.stops[0];
  const activeStopStudents = (selectedStopId && stopStudentsMap[selectedStopId]) || [
    { name: "K. Aarav", grade: "Grade 2", parentPhone: "9842103841", status: "Boarded" },
    { name: "S. Harish", grade: "Nursery", parentPhone: "9789312045", status: "Boarded" },
  ];

  const handleBroadcastEtaSms = () => {
    setEtaBroadcastMsgSent(true);
    setTimeout(() => setEtaBroadcastMsgSent(false), 4000);
  };

  // 30-day average delay data for Recharts Bar Chart
  const delayDataByTimeframe = {
    "30days": [
      { name: "TN 25 AW 1024", shortName: "Van 1 (Cheyyar)", avgDelayMins: 4.2, maxDelayMins: 12, onTimePercent: 96, color: "#3b82f6" },
      { name: "TN 25 BX 4098", shortName: "Van 2 (Vandavasi)", avgDelayMins: 8.5, maxDelayMins: 19, onTimePercent: 92, color: "#8b5cf6" },
      { name: "TN 25 CY 7712", shortName: "Bus 3 (Tindivanam)", avgDelayMins: 12.8, maxDelayMins: 26, onTimePercent: 87, color: "#f59e0b" },
    ],
    "morning": [
      { name: "TN 25 AW 1024", shortName: "Van 1 (Cheyyar)", avgDelayMins: 3.5, maxDelayMins: 9, onTimePercent: 97, color: "#3b82f6" },
      { name: "TN 25 BX 4098", shortName: "Van 2 (Vandavasi)", avgDelayMins: 7.2, maxDelayMins: 15, onTimePercent: 94, color: "#8b5cf6" },
      { name: "TN 25 CY 7712", shortName: "Bus 3 (Tindivanam)", avgDelayMins: 11.0, maxDelayMins: 22, onTimePercent: 89, color: "#f59e0b" },
    ],
    "evening": [
      { name: "TN 25 AW 1024", shortName: "Van 1 (Cheyyar)", avgDelayMins: 4.9, maxDelayMins: 14, onTimePercent: 95, color: "#3b82f6" },
      { name: "TN 25 BX 4098", shortName: "Van 2 (Vandavasi)", avgDelayMins: 9.8, maxDelayMins: 22, onTimePercent: 90, color: "#8b5cf6" },
      { name: "TN 25 CY 7712", shortName: "Bus 3 (Tindivanam)", avgDelayMins: 14.6, maxDelayMins: 30, onTimePercent: 84, color: "#f59e0b" },
    ],
  };

  const chartData = delayDataByTimeframe[chartTimeframe];

  const handleOptimizeClick = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/gemini/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType: vehicle.type,
          startLocation: "Wisdom Nursery & Primary School, Essur",
          stops: vehicle.stops,
        }),
      });
      const data = await res.json();
      setOptimizationResult(data);
    } catch (e) {
      alert("Route optimization service unavailable. Re-ordering stops locally.");
      setOptimizationResult({
        estimatedTotalKm: 16.4,
        estimatedTotalTimeMins: 38,
        recommendations: "Reordered sequence via Essur Arch Bridge to avoid morning railway crossing bottleneck.",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSosTrigger = () => {
    setSosTriggered(true);
    setTimeout(() => {
      alert(`EMERGENCY SOS ALERT BROADCAST: Vehicle ${vehicle.registrationNumber} sent emergency signal to Chief Officer Mr. R SARAVANAN (9176593129)!`);
    }, 200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-purple-600 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            AI Route Optimizer & Driver Console
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Smart Route Optimization</h2>
          <p className="text-xs text-slate-400">
            Re-orders pickup stops dynamically to minimize travel time, fuel usage, and ensure student safety.
          </p>
        </div>

        <button
          onClick={() => setDriverModeActive(!driverModeActive)}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition shadow-lg flex items-center gap-2 ${
            driverModeActive
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {driverModeActive ? "Exit Driver Console" : "Launch Driver Console Mode"}
        </button>
      </div>

      {/* AUTOMATED ADMIN ROUTE DELAY ALERT BANNER */}
      {delayedVehiclesExceedingThreshold.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950 via-red-950 to-rose-950 text-white p-5 sm:p-6 rounded-3xl border-2 border-amber-500/80 shadow-2xl relative overflow-hidden space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Banner Top Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10 border-b border-amber-500/30 pb-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl ring-4 ring-amber-400/30 flex-shrink-0 mt-0.5">
                <BellRing className="w-6 h-6 text-yellow-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-md font-mono">
                    <AlertOctagon className="w-3.5 h-3.5 text-slate-950" />
                    AUTOMATED ADMIN DELAY ALERT
                  </span>
                  <span className="bg-red-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono border border-red-400">
                    {delayedVehiclesExceedingThreshold.length} Vehicle(s) &gt;= {delayThresholdMins} Mins Delay
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white mt-1 leading-tight">
                  High Scheduled Delay Alert: Threshold Exceeded (&gt;={delayThresholdMins} Mins)
                </h3>
                <p className="text-xs text-amber-100/90 mt-1 max-w-3xl leading-relaxed">
                  Real-time telemetry detected <strong>{delayedVehiclesExceedingThreshold.length}</strong> vehicle(s) delayed past the admin configured threshold of <strong>{delayThresholdMins} minutes</strong>. Instant advisory dispatch available below.
                </p>
              </div>
            </div>

            {/* Configurable Threshold Quick Controls */}
            <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-center flex-shrink-0">
              <div className="bg-slate-900/90 border border-amber-500/40 p-1.5 rounded-2xl flex items-center gap-2 shadow-inner">
                <span className="text-[10px] font-extrabold uppercase text-amber-300 px-2 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-400" />
                  Threshold:
                </span>
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDelayThresholdMins(mins)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer font-mono ${
                      delayThresholdMins === mins
                        ? "bg-amber-400 text-slate-950 shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAlertConfigModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-yellow-300 border border-amber-500/50 font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                Alert Settings
              </button>
            </div>
          </div>

          {/* SMS Dispatched Success Notification Banner */}
          {smsAlertDispatched && (
            <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg border-2 border-emerald-300 animate-in fade-in duration-200">
              <CheckCircle className="w-4 h-4 text-slate-950 flex-shrink-0" />
              <span>Automated Route Delay Advisory SMS successfully dispatched to parent groups for affected routes!</span>
            </div>
          )}

          {/* List of Delayed Vehicles Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
            {delayedVehiclesExceedingThreshold.map((v) => {
              const isAcknowledged = acknowledgedVehicleIds.includes(v.id);
              const isSelected = selectedVehicleId === v.id;

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 shadow-lg space-y-3 ${
                    isAcknowledged
                      ? "bg-slate-900/80 border-slate-700/80 opacity-75"
                      : "bg-slate-900/90 border-amber-500/60 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-yellow-300 text-sm">{v.registrationNumber}</span>
                        {isAcknowledged ? (
                          <span className="bg-slate-800 text-slate-400 text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono">
                            Acknowledged
                          </span>
                        ) : (
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono animate-pulse">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">{v.routeName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Driver: {v.driverName} ({v.driverPhone})</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-black font-mono text-red-400 bg-red-950/80 px-2.5 py-1 rounded-xl border border-red-500/50 block">
                        +{v.currentDelayMins}m
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono font-bold mt-1 block">
                        Updated {v.delayLastUpdated}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Telemetry Delay Reason:</span>
                    <p className="text-amber-200 font-medium text-[11px] leading-snug mt-0.5">{v.delayReason}</p>
                  </div>

                  {/* Actions for this vehicle */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        if (v.stops[0]) setSelectedStopId(v.stops[0].id);
                      }}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-purple-600 text-white border border-purple-400 shadow"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-yellow-300" />
                      {isSelected ? "Viewing Route" : "Focus Route"}
                    </button>

                    <button
                      onClick={() => handleDispatchDelaySMS(v.registrationNumber, v.currentDelayMins, v.routeName)}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-1.5 px-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Dispatch Advisory SMS to Parents"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-950" />
                      SMS Parents
                    </button>

                    {!isAcknowledged ? (
                      <button
                        onClick={() => handleAcknowledgeAlert(v.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-2 rounded-xl text-xs transition cursor-pointer"
                        title="Acknowledge & Dismiss Alert"
                      >
                        Dismiss
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingVehicleDelay({ id: v.id, delayMins: v.currentDelayMins, reason: v.delayReason })}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-2 rounded-xl text-xs transition cursor-pointer"
                        title="Edit Delay"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner Footer Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-amber-500/30 pt-3 text-xs text-amber-200 gap-2">
            <span className="font-mono text-[11px] font-bold">
              Automated Alert Rule: Triggered when telemetry delay &gt;= {delayThresholdMins} minutes.
            </span>

            {acknowledgedVehicleIds.length > 0 && (
              <button
                onClick={handleResetAlerts}
                className="text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Acknowledged Alerts
              </button>
            )}
          </div>
        </div>
      )}

      {/* Driver Console Overlay if active */}
      {driverModeActive ? (
        <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500/50 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xl">
                D
              </div>
              <div>
                <h3 className="font-black text-xl text-emerald-400">Driver Console Mode</h3>
                <p className="text-xs text-slate-400">
                  Vehicle: <strong className="text-white">{vehicle.registrationNumber}</strong> | Driver: {vehicle.driverName}
                </p>
              </div>
            </div>

            <button
              onClick={handleSosTrigger}
              className={`px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition shadow-2xl flex items-center gap-2 ${
                sosTriggered
                  ? "bg-red-600 text-white animate-bounce"
                  : "bg-red-700 hover:bg-red-600 text-white border-2 border-yellow-400"
              }`}
            >
              <ShieldAlert className="w-6 h-6 text-yellow-300" />
              EMERGENCY SOS PANIC
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-xs uppercase font-bold block">Current Speed</span>
              <span className="text-3xl font-black text-yellow-400">{vehicle.speedKmH} <span className="text-sm font-normal">km/h</span></span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-xs uppercase font-bold block">Students Onboard</span>
              <span className="text-3xl font-black text-emerald-400">{vehicle.currentOccupancy} / {vehicle.capacity}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-xs uppercase font-bold block">Admin Contact</span>
              <span className="text-lg font-bold text-white block mt-1">9176593129 (Mr. R Saravanan)</span>
            </div>
          </div>

          {/* Pickup Checklist */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-200 text-base">Pickup Stops Sequence Checklist:</h4>
            <div className="space-y-2">
              {vehicle.stops.map((stop, idx) => (
                <div key={stop.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{stop.stopName}</p>
                      <p className="text-slate-400 text-xs">{stop.landmark}</p>
                    </div>
                  </div>

                  <span className="font-mono text-amber-400 font-bold">{stop.scheduledTimeMorning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* AI Route Optimizer Standard Interface */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Select Route to Optimize</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Assigned Van / Bus Fleet:</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-sm"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.routeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Scheduled Delay Telemetry Status Card */}
              {(() => {
                const currentDelay = vehicleDelays[vehicle.id]?.currentDelayMins || 0;
                const currentReason = vehicleDelays[vehicle.id]?.reason || "On Schedule";
                const isExceeding = currentDelay >= delayThresholdMins;

                return (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2 transition shadow-sm ${
                    isExceeding ? "bg-red-50 border-red-300 text-red-950" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <Clock className={`w-3.5 h-3.5 ${isExceeding ? "text-red-600" : "text-slate-600"}`} />
                        Scheduled Delay Telemetry
                      </span>
                      <button
                        onClick={() => setEditingVehicleDelay({ id: vehicle.id, delayMins: currentDelay, reason: currentReason })}
                        className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Delay
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-base font-black font-mono block ${isExceeding ? "text-red-600" : "text-emerald-700"}`}>
                          {currentDelay > 0 ? `+${currentDelay} Minutes Delay` : "On Schedule (0 Mins)"}
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 mt-0.5">{currentReason}</p>
                      </div>

                      {isExceeding && (
                        <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono border border-red-700">
                          &gt;={delayThresholdMins}m Threshold
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-800">Current Stops Sequence ({vehicle.stops.length}):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 font-medium">
                  {vehicle.stops.map((s) => (
                    <li key={s.id}>{s.stopName} ({s.distanceFromSchoolKm} km)</li>
                  ))}
                </ol>
              </div>

              <button
                onClick={handleOptimizeClick}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                {isOptimizing ? "Optimizing Sequence with AI..." : "Run AI Route Sequence Optimization"}
              </button>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Optimization Results & Safety Analysis
              </h3>

              {optimizationResult ? (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <span className="text-emerald-800 font-bold block text-[10px] uppercase">Optimized Distance</span>
                      <span className="text-xl font-black text-emerald-950 font-mono">
                        {optimizationResult.estimatedTotalKm || 14.8} km
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                      <span className="text-blue-800 font-bold block text-[10px] uppercase">Est. Travel Time</span>
                      <span className="text-xl font-black text-blue-950 font-mono">
                        {optimizationResult.estimatedTotalTimeMins || 32} Mins
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                    <span className="text-amber-400 font-bold text-xs uppercase block">AI Route Safety Advisory:</span>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      {optimizationResult.recommendations ||
                        "Pickup order arranged from farthest stop (Vandavasi/Cheyyar) to Essur school gate. Keeps average van speed under 40 km/h for nursery child safety."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  Select a route and click <strong>Run AI Route Sequence Optimization</strong> to optimize pickup sequence.
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 w-max">
                    <Map className="w-3.5 h-3.5 text-purple-600" />
                    Interactive Leaflet Route Coverage GIS Map
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                    Live Telemetry Active
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Student Pickup Logistics & Fleet Coverage Map
                </h3>
                <p className="text-xs text-slate-500">
                  Interactive GIS map rendering real-time bus polylines, pickup stop markers, student boarding counts, and live GPS positions.
                </p>
              </div>

              {/* Map Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* View All Routes Toggle */}
                <button
                  onClick={() => setViewAllRoutes(!viewAllRoutes)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center gap-1.5 cursor-pointer ${
                    viewAllRoutes
                      ? "bg-purple-600 text-white border-purple-700 shadow"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {viewAllRoutes ? "All Fleet Coverage (Combined)" : "Single Route Focus"}
                </button>

                {/* Map Theme Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                  <button
                    onClick={() => setMapTheme("dark")}
                    className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                      mapTheme === "dark" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setMapTheme("googleStreet")}
                    className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                      mapTheme === "googleStreet" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Street
                  </button>
                  <button
                    onClick={() => setMapTheme("googleSatellite")}
                    className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                      mapTheme === "googleSatellite" ? "bg-amber-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => setMapTheme("street")}
                    className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                      mapTheme === "street" ? "bg-emerald-800 text-white shadow" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    OSM
                  </button>
                </div>
              </div>
            </div>

            {/* Map Canvas and Stop Inspector Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Leaflet GIS Map Canvas Container */}
              <div className="lg:col-span-7 space-y-3">
                <RouteCoverageLeafletMap
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  viewAllRoutes={viewAllRoutes}
                  selectedStopId={selectedStopId}
                  onSelectStop={(stopId) => setSelectedStopId(stopId)}
                  mapTheme={mapTheme}
                  stopStudentsMap={stopStudentsMap}
                  livePulseActive={livePulseActive}
                  onSelectVehicle={(vId) => setSelectedVehicleId(vId)}
                />

                {/* Map Quick Guidance */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Info className="w-3.5 h-3.5 text-purple-600" />
                    Click any numbered pickup stop node on the Leaflet map to inspect student rosters & stop schedules.
                  </span>
                  <span className="font-mono font-bold text-[10px] text-slate-400 uppercase">
                    GIS: WGS84 | ESSUR LOGISTICS
                  </span>
                </div>
              </div>

              {/* Selected Stop & Student Roster Inspector Panel */}
              <div className="lg:col-span-5 bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                      Stop Inspector
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-1">{activeStop.stopName}</h4>
                    <p className="text-xs text-slate-500">{activeStop.landmark}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200 font-mono block">
                      {activeStop.distanceFromSchoolKm} km to Gate
                    </span>
                  </div>
                </div>

                {/* Scheduled Times Banner */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-0.5">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Morning Pickup</span>
                    <span className="text-sm font-black text-slate-900 font-mono block">{activeStop.scheduledTimeMorning}</span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-0.5">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Evening Drop-off</span>
                    <span className="text-sm font-black text-slate-900 font-mono block">{activeStop.scheduledTimeEvening}</span>
                  </div>
                </div>

                {/* Parent SMS Notification Broadcast Status Notice */}
                {etaBroadcastMsgSent && (
                  <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl text-emerald-950 font-bold text-xs flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Live Van ETA SMS alert dispatched to parents at {activeStop.stopName}!</span>
                  </div>
                )}

                {/* Assigned Students List for this Stop */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      Enrolled Students at Stop ({activeStopStudents.length})
                    </h5>
                    <span className="text-[10px] font-bold text-slate-400">Boarding Roster</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeStopStudents.map((st, i) => (
                      <div
                        key={i}
                        className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs hover:border-purple-300 transition"
                      >
                        <div>
                          <p className="font-extrabold text-slate-900">{st.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {st.grade} | Parent: <a href={`tel:${st.parentPhone}`} className="text-purple-700 hover:underline font-mono">{st.parentPhone}</a>
                          </p>
                        </div>

                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                            st.status === "Boarded"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Broadcast SMS Button */}
                <button
                  onClick={handleBroadcastEtaSms}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-4 rounded-2xl text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-yellow-400" />
                  Broadcast Van ETA SMS to Parents at Stop
                </button>
              </div>
            </div>
          </div>

          {/* NEW RECHARTS VISUAL MODULE: 30-Day Average Route Delay Times per Vehicle */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 w-max">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  30-Day Fleet Analytics
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-1">
                  Average Route Delay Times Per Vehicle (Last 30 Days)
                </h3>
                <p className="text-xs text-slate-500">
                  Historical telemetry analysis tracking average and peak delays across all school transport routes.
                </p>
              </div>

              {/* Timeframe Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setChartTimeframe("30days")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    chartTimeframe === "30days"
                      ? "bg-slate-900 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  30-Day Avg
                </button>
                <button
                  onClick={() => setChartTimeframe("morning")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    chartTimeframe === "morning"
                      ? "bg-slate-900 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Morning Pickup
                </button>
                <button
                  onClick={() => setChartTimeframe("evening")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    chartTimeframe === "evening"
                      ? "bg-slate-900 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Evening Return
                </button>
              </div>
            </div>

            {/* Metric Overview Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Overall Fleet Avg Delay</span>
                  <span className="text-lg font-black text-slate-900 font-mono">8.5 Mins</span>
                </div>
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Average On-Time Arrival</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">92.7%</span>
                </div>
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Top Bottleneck Location</span>
                  <span className="text-sm font-extrabold text-amber-700 block">Tindivanam Highway Toll</span>
                </div>
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    unit=" mins"
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700 font-sans">
                            <p className="font-extrabold text-yellow-400">{data.name}</p>
                            <p className="text-slate-300">
                              Average Delay: <strong className="text-white font-mono">{data.avgDelayMins} mins</strong>
                            </p>
                            <p className="text-slate-300">
                              Peak Delay: <strong className="text-red-400 font-mono">{data.maxDelayMins} mins</strong>
                            </p>
                            <p className="text-slate-300">
                              On-time Arrival: <strong className="text-emerald-400 font-mono">{data.onTimePercent}%</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Bar
                    dataKey="avgDelayMins"
                    name="Average Delay (Minutes)"
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="maxDelayMins"
                    name="Peak Recorded Delay (Minutes)"
                    fill="#f43f5e"
                    radius={[8, 8, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Informational Advisory Footnote */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
              <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <p>
                <strong>Route Delay Insight:</strong> School Bus (Route 3) experiences higher average delays due to Tindivanam highway toll gate rush during peak morning hours (07:30 AM - 08:00 AM). AI Route Optimization recommends dispatching Route 3 10 minutes earlier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ALERT THRESHOLD & SYSTEM CONFIGURATION */}
      {showAlertConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Automated Delay Alert Settings</h3>
                  <p className="text-xs text-slate-400">Configure delay alert threshold and automated notification rules</p>
                </div>
              </div>

              <button
                onClick={() => setShowAlertConfigModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs sm:text-sm text-slate-800">
              {/* Threshold Selection */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 text-xs block uppercase tracking-wider">
                  Scheduled Delay Alert Threshold: <span className="text-amber-600 font-mono text-sm">+{delayThresholdMins} Minutes</span>
                </label>
                <p className="text-xs text-slate-500">
                  Admins will receive an automated banner alert whenever any school vehicle's delay meets or exceeds this threshold.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {[5, 10, 12, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDelayThresholdMins(m)}
                      className={`p-2.5 rounded-xl text-center font-black transition cursor-pointer font-mono text-xs ${
                        delayThresholdMins === m
                          ? "bg-slate-900 text-amber-400 ring-2 ring-amber-400 shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {m} Mins
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={delayThresholdMins}
                    onChange={(e) => setDelayThresholdMins(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                    <span>3 Mins (High Sensitivity)</span>
                    <span>15 Mins (Standard)</span>
                    <span>30 Mins (Low Sensitivity)</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Delays Fleet Overview & Edit */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Current Fleet Telemetry Delay Status ({vehicles.length} Vehicles)
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {vehiclesWithDelayData.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{v.registrationNumber}</span>
                          <span className="text-[10px] text-slate-500">({v.routeName})</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{v.delayReason}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                            v.currentDelayMins >= delayThresholdMins
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          +{v.currentDelayMins}m
                        </span>

                        <button
                          onClick={() => {
                            setShowAlertConfigModal(false);
                            setEditingVehicleDelay({ id: v.id, delayMins: v.currentDelayMins, reason: v.delayReason });
                          }}
                          className="px-2 py-1 bg-slate-900 text-white rounded-lg font-bold text-[10px] hover:bg-slate-800 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setShowAlertConfigModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer shadow"
              >
                Save & Apply Threshold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SPECIFIC VEHICLE SCHEDULED DELAY */}
      {editingVehicleDelay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">Edit Vehicle Scheduled Delay</h3>
              </div>

              <button
                onClick={() => setEditingVehicleDelay(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block text-xs">Vehicle Registration ID:</label>
                <input
                  type="text"
                  readOnly
                  value={editingVehicleDelay.id}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block text-xs">Current Scheduled Delay (Minutes):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={editingVehicleDelay.delayMins}
                    onChange={(e) =>
                      setEditingVehicleDelay({ ...editingVehicleDelay, delayMins: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-black text-slate-900 text-base"
                  />
                  <span className="font-mono font-bold text-slate-500 text-xs flex-shrink-0">mins</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block text-xs">Reason for Scheduled Delay:</label>
                <input
                  type="text"
                  value={editingVehicleDelay.reason}
                  onChange={(e) => setEditingVehicleDelay({ ...editingVehicleDelay, reason: e.target.value })}
                  placeholder="e.g. Railway crossing, roadwork, traffic bottleneck"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                <p className="font-bold">Automated Alert Trigger Preview:</p>
                <p className="text-[11px]">
                  Setting delay to <strong>+{editingVehicleDelay.delayMins} mins</strong> will{" "}
                  {editingVehicleDelay.delayMins >= delayThresholdMins ? (
                    <span className="text-red-700 font-black">TRIGGER the top automated admin alert banner</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">stay under the +{delayThresholdMins} mins alert threshold</span>
                  )}.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingVehicleDelay(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVehicleDelay}
                className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-2 px-5 rounded-xl text-xs transition cursor-pointer shadow"
              >
                Update Delay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

