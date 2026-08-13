import React, { useState, useMemo } from "react";
import {
  Bus,
  Gauge,
  Fuel,
  Users,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Zap,
  Calculator,
  Search,
  CheckCircle2,
  Navigation,
  Award,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Star,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  BellRing,
  AlertOctagon,
  Eye,
  FileText,
  X,
  Send,
  MessageSquare,
  Plus,
  PlusCircle,
  Edit2,
  Trash2,
  DollarSign,
  Droplets,
  TrendingDown
} from "lucide-react";
import { Vehicle, VehicleType, FuelLog } from "../types";
import { calculateMonthlyTransportFee } from "../utils/feeCalculator";
import { InteractiveFleetMap } from "./InteractiveFleetMap";

interface DriverSafetyMetric {
  id: string;
  driverName: string;
  driverPhone: string;
  licenseNumber: string;
  vehicleReg: string;
  routeName: string;
  safetyScore: number;
  tripsCompleted: number;
  totalTripsScheduled: number;
  completionRate: number;
  onTimePickupRate: number;
  speedingIncidents: number;
  harshBrakingIncidents: number;
  rating: number;
  statusBadge: "Top Performer" | "Fully Compliant" | "Good Standing" | "Needs Audit";
  recentLogs?: { date: string; time: string; event: string; severity: "High" | "Medium" | "Low" }[];
}

interface FleetTrackerProps {
  vehicles: Vehicle[];
  onAddVehicle?: (vehicle: Vehicle) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export const FleetTracker: React.FC<FleetTrackerProps> = ({
  vehicles,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || "");
  const [mapViewMode, setMapViewMode] = useState<"map" | "stops">("map");
  const [calcDistance, setCalcDistance] = useState<number>(8.5);
  const [calcVehicleType, setCalcVehicleType] = useState<VehicleType>("Van (14-Seater)");
  const [driverSearchQuery, setDriverSearchQuery] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("July 2026 (Current)");
  const [reportGeneratedMsg, setReportGeneratedMsg] = useState<boolean>(false);
  const [filterLowSafetyOnly, setFilterLowSafetyOnly] = useState<boolean>(false);
  const [reviewingDriverLogs, setReviewingDriverLogs] = useState<DriverSafetyMetric | null>(null);
  const [adminWarningSent, setAdminWarningSent] = useState<boolean>(false);

  // Active Tab/Section Mode in Fleet Tracker ("all" | "gps" | "fuel" | "safety")
  const [fleetSectionTab, setFleetSectionTab] = useState<"all" | "gps" | "fuel" | "safety">("all");

  // Fuel Efficiency Tracker & Refueling Log State
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([
    {
      id: "FUEL-101",
      vehicleId: vehicles[0]?.id || "TN-25-AW-1024",
      registrationNumber: vehicles[0]?.registrationNumber || "TN 25 AW 1024",
      date: "2026-07-25",
      odometerKm: 42150,
      fuelLiters: 35.0,
      totalCostRs: 3430,
      kmDrivenSinceLastFill: 298,
      calculatedKmpl: 8.51,
      fuelType: "Diesel",
      loggedByDriver: vehicles[0]?.driverName || "Mr. S. Kumar",
      fuelStationName: "HP Auto Fuel Station, Cheyyar Town",
      notes: "Full tank fill-up before morning school pickup trip."
    },
    {
      id: "FUEL-102",
      vehicleId: vehicles[1]?.id || "TN-25-BZ-4092",
      registrationNumber: vehicles[1]?.registrationNumber || "TN 25 BZ 4092",
      date: "2026-07-24",
      odometerKm: 31800,
      fuelLiters: 42.5,
      totalCostRs: 4165,
      kmDrivenSinceLastFill: 330,
      calculatedKmpl: 7.76,
      fuelType: "Diesel",
      loggedByDriver: vehicles[1]?.driverName || "Mr. M. Rajan",
      fuelStationName: "Indian Oil Bunk, Bypass Junction",
      notes: "Routine refueling after evening return route."
    },
    {
      id: "FUEL-103",
      vehicleId: vehicles[2]?.id || "TN-25-CX-8812",
      registrationNumber: vehicles[2]?.registrationNumber || "TN 25 CX 8812",
      date: "2026-07-23",
      odometerKm: 18920,
      fuelLiters: 50.0,
      totalCostRs: 4900,
      kmDrivenSinceLastFill: 310,
      calculatedKmpl: 6.20,
      fuelType: "Diesel",
      loggedByDriver: vehicles[2]?.driverName || "Mr. V. Elango",
      fuelStationName: "Bharat Petroleum, Cheyyar Ring Road",
      notes: "Heavy mini-bus passenger load during morning pickup."
    },
    {
      id: "FUEL-104",
      vehicleId: vehicles[0]?.id || "TN-25-AW-1024",
      registrationNumber: vehicles[0]?.registrationNumber || "TN 25 AW 1024",
      date: "2026-07-18",
      odometerKm: 41852,
      fuelLiters: 34.0,
      totalCostRs: 3332,
      kmDrivenSinceLastFill: 289,
      calculatedKmpl: 8.50,
      fuelType: "Diesel",
      loggedByDriver: vehicles[0]?.driverName || "Mr. S. Kumar",
      fuelStationName: "HP Auto Fuel Station, Cheyyar Town",
      notes: "Mid-week tank refill."
    },
    {
      id: "FUEL-105",
      vehicleId: vehicles[1]?.id || "TN-25-BZ-4092",
      registrationNumber: vehicles[1]?.registrationNumber || "TN 25 BZ 4092",
      date: "2026-07-17",
      odometerKm: 31470,
      fuelLiters: 40.0,
      totalCostRs: 3920,
      kmDrivenSinceLastFill: 312,
      calculatedKmpl: 7.80,
      fuelType: "Diesel",
      loggedByDriver: vehicles[1]?.driverName || "Mr. M. Rajan",
      fuelStationName: "Indian Oil Bunk, Bypass Junction",
      notes: "Regular scheduled fuel refill."
    }
  ]);

  const [showAddFuelModal, setShowAddFuelModal] = useState<boolean>(false);
  const [fuelSuccessMsg, setFuelSuccessMsg] = useState<string | null>(null);
  const [fuelSearchQuery, setFuelSearchQuery] = useState<string>("");
  const [selectedFuelVehicleFilter, setSelectedFuelVehicleFilter] = useState<string>("All");

  const [fuelFormData, setFuelFormData] = useState({
    vehicleId: vehicles[0]?.id || "",
    date: new Date().toISOString().split("T")[0],
    odometerKm: 42500,
    fuelLiters: 35,
    totalCostRs: 3430,
    kmDrivenSinceLastFill: 280,
    fuelType: "Diesel" as "Diesel" | "CNG" | "Petrol",
    loggedByDriver: vehicles[0]?.driverName || "",
    fuelStationName: "HP Auto Fuel Station, Cheyyar Town",
    notes: "",
  });

  const handleOpenAddFuelModal = (vId?: string) => {
    const targetVeh = vehicles.find((v) => v.id === vId) || vehicles[0];
    const targetId = targetVeh?.id || "";
    const vLogs = fuelLogs.filter((l) => l.vehicleId === targetId || l.registrationNumber === targetVeh?.registrationNumber);
    const lastOdo = vLogs.length > 0 ? vLogs[0].odometerKm + 280 : 42500;

    setFuelFormData({
      vehicleId: targetId,
      date: new Date().toISOString().split("T")[0],
      odometerKm: lastOdo,
      fuelLiters: 35,
      totalCostRs: 3430,
      kmDrivenSinceLastFill: 280,
      fuelType: "Diesel",
      loggedByDriver: targetVeh?.driverName || "",
      fuelStationName: "HP Auto Fuel Station, Cheyyar Town",
      notes: "Full tank fill-up.",
    });
    setShowAddFuelModal(true);
  };

  const handleAddFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVehicle = vehicles.find((v) => v.id === fuelFormData.vehicleId);
    const calculatedKmpl =
      fuelFormData.fuelLiters > 0
        ? parseFloat((fuelFormData.kmDrivenSinceLastFill / fuelFormData.fuelLiters).toFixed(2))
        : 0;

    const newLog: FuelLog = {
      id: "FUEL-" + (100 + fuelLogs.length + 1),
      vehicleId: fuelFormData.vehicleId,
      registrationNumber: selectedVehicle?.registrationNumber || "TN 25 Fleet",
      date: fuelFormData.date,
      odometerKm: Number(fuelFormData.odometerKm),
      fuelLiters: Number(fuelFormData.fuelLiters),
      totalCostRs: Number(fuelFormData.totalCostRs),
      kmDrivenSinceLastFill: Number(fuelFormData.kmDrivenSinceLastFill),
      calculatedKmpl,
      fuelType: fuelFormData.fuelType,
      loggedByDriver: fuelFormData.loggedByDriver || selectedVehicle?.driverName || "Fleet Driver",
      fuelStationName: fuelFormData.fuelStationName || "Local Fuel Station",
      notes: fuelFormData.notes,
    };

    setFuelLogs([newLog, ...fuelLogs]);
    setShowAddFuelModal(false);
    setFuelSuccessMsg(`Refueling event logged for ${newLog.registrationNumber}! Calculated KMPL: ${calculatedKmpl} km/l`);
    setTimeout(() => setFuelSuccessMsg(null), 4500);
  };

  const handleDeleteFuelLog = (logId: string) => {
    if (confirm("Are you sure you want to delete this refueling log entry?")) {
      setFuelLogs(fuelLogs.filter((l) => l.id !== logId));
    }
  };

  // Compute per-vehicle KMPL and fuel stats
  const vehicleFuelStats = useMemo(() => {
    return vehicles.map((v) => {
      const vLogs = fuelLogs.filter((l) => l.vehicleId === v.id || l.registrationNumber === v.registrationNumber);
      const totalLiters = vLogs.reduce((acc, curr) => acc + curr.fuelLiters, 0);
      const totalCost = vLogs.reduce((acc, curr) => acc + curr.totalCostRs, 0);
      const totalKm = vLogs.reduce((acc, curr) => acc + curr.kmDrivenSinceLastFill, 0);

      const avgKmpl = totalLiters > 0 ? parseFloat((totalKm / totalLiters).toFixed(2)) : 8.0;
      const costPerKm = totalKm > 0 ? parseFloat((totalCost / totalKm).toFixed(2)) : 12.0;

      const targetKmpl = v.type.includes("Bus") ? 6.0 : v.type.includes("Traveller") ? 7.5 : 8.5;

      let status: "Excellent" | "Normal" | "High Consumption" = "Normal";
      if (avgKmpl >= targetKmpl) status = "Excellent";
      else if (avgKmpl < targetKmpl - 1.0) status = "High Consumption";

      return {
        vehicle: v,
        logsCount: vLogs.length,
        totalLiters,
        totalCost,
        totalKm,
        avgKmpl,
        targetKmpl,
        costPerKm,
        status,
        latestLog: vLogs[0] || null,
      };
    });
  }, [vehicles, fuelLogs]);

  // Compute overall fleet fuel totals
  const fleetFuelTotals = useMemo(() => {
    const totalLiters = fuelLogs.reduce((acc, curr) => acc + curr.fuelLiters, 0);
    const totalCost = fuelLogs.reduce((acc, curr) => acc + curr.totalCostRs, 0);
    const totalKm = fuelLogs.reduce((acc, curr) => acc + curr.kmDrivenSinceLastFill, 0);
    const fleetAvgKmpl = totalLiters > 0 ? parseFloat((totalKm / totalLiters).toFixed(2)) : 7.8;
    const fleetAvgCostPerKm = totalKm > 0 ? parseFloat((totalCost / totalKm).toFixed(2)) : 12.2;

    return {
      totalLiters,
      totalCost,
      totalKm,
      fleetAvgKmpl,
      fleetAvgCostPerKm,
      totalRefuels: fuelLogs.length,
    };
  }, [fuelLogs]);

  // Filtered refueling logs
  const filteredFuelLogs = useMemo(() => {
    return fuelLogs.filter((log) => {
      const matchesVeh =
        selectedFuelVehicleFilter === "All" ||
        log.vehicleId === selectedFuelVehicleFilter ||
        log.registrationNumber === selectedFuelVehicleFilter;

      const matchesSearch =
        log.registrationNumber.toLowerCase().includes(fuelSearchQuery.toLowerCase()) ||
        log.loggedByDriver.toLowerCase().includes(fuelSearchQuery.toLowerCase()) ||
        log.fuelStationName.toLowerCase().includes(fuelSearchQuery.toLowerCase());

      return matchesVeh && matchesSearch;
    });
  }, [fuelLogs, selectedFuelVehicleFilter, fuelSearchQuery]);

  // Compute total student pick-up points & total students on routes
  const totalPickupStopsCount = useMemo(() => {
    return vehicles.reduce(
      (acc, v) => acc + (v.stops ? v.stops.filter((s) => s.distanceFromSchoolKm > 0).length : 0),
      0
    );
  }, [vehicles]);

  const totalStudentsOnRoutes = useMemo(() => {
    return vehicles.reduce(
      (acc, v) =>
        acc +
        (v.stops && v.stops.length > 0
          ? v.stops.reduce((sAcc, st) => sAcc + st.studentsCount, 0)
          : v.currentOccupancy),
      0
    );
  }, [vehicles]);

  // Vehicle CRUD Modal States
  const [showAddVehicleModal, setShowAddVehicleModal] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);


  const [vehicleFormData, setVehicleFormData] = useState({
    registrationNumber: "",
    type: "Van (14-Seater)" as VehicleType,
    capacity: 14,
    currentOccupancy: 10,
    driverName: "",
    driverPhone: "",
    routeName: "",
    status: "At School" as "In Transit" | "At School" | "At Stop" | "Maintenance" | "Idle",
    speedKmH: 0,
    fuelLevelPercent: 90,
  });

  const handleOpenAddVehicle = () => {
    setVehicleFormData({
      registrationNumber: "TN 25 " + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + " " + Math.floor(1000 + Math.random() * 9000),
      type: "Van (14-Seater)",
      capacity: 14,
      currentOccupancy: 8,
      driverName: "Mr. R. Saravanan",
      driverPhone: "9176593129",
      routeName: "Route " + (vehicles.length + 1) + ": Cheyyar Line",
      status: "At School",
      speedKmH: 0,
      fuelLevelPercent: 95,
    });
    setShowAddVehicleModal(true);
  };

  const handleOpenEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleFormData({
      registrationNumber: v.registrationNumber,
      type: v.type,
      capacity: v.capacity,
      currentOccupancy: v.currentOccupancy,
      driverName: v.driverName,
      driverPhone: v.driverPhone,
      routeName: v.routeName,
      status: v.status,
      speedKmH: v.speedKmH,
      fuelLevelPercent: v.fuelLevelPercent,
    });
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleFormData.registrationNumber || !vehicleFormData.driverName) return;

    const newVehicle: Vehicle = {
      id: "TN-25-" + vehicleFormData.registrationNumber.replace(/\s+/g, "-"),
      registrationNumber: vehicleFormData.registrationNumber,
      type: vehicleFormData.type,
      capacity: Number(vehicleFormData.capacity) || 14,
      currentOccupancy: Number(vehicleFormData.currentOccupancy) || 0,
      driverId: "DRV-" + Math.floor(10 + Math.random() * 90),
      driverName: vehicleFormData.driverName,
      driverPhone: vehicleFormData.driverPhone || "9176593129",
      routeName: vehicleFormData.routeName || "School Transport Route",
      currentStopIndex: 0,
      speedKmH: Number(vehicleFormData.speedKmH) || 0,
      fuelLevelPercent: Number(vehicleFormData.fuelLevelPercent) || 100,
      status: vehicleFormData.status,
      currentLat: 12.6512 + (Math.random() * 0.02 - 0.01),
      currentLng: 79.5412 + (Math.random() * 0.02 - 0.01),
      baseFeePerKm: 160,
      multiplier: vehicleFormData.type.includes("Bus") ? 1.35 : vehicleFormData.type.includes("Traveller") ? 1.15 : 1.0,
      stops: [
        {
          id: "STP-" + Date.now() + "-1",
          stopName: "Cheyyar Town Stop",
          landmark: "Near Bus Depot Arch",
          scheduledTimeMorning: "07:45 AM",
          scheduledTimeEvening: "04:15 PM",
          distanceFromSchoolKm: 6.5,
          latitude: 12.655,
          longitude: 79.538,
          studentsCount: 5,
        },
        {
          id: "STP-" + Date.now() + "-2",
          stopName: "Wisdom School Entrance",
          landmark: "School Gate 1",
          scheduledTimeMorning: "08:15 AM",
          scheduledTimeEvening: "03:45 PM",
          distanceFromSchoolKm: 0.1,
          latitude: 12.651,
          longitude: 79.541,
          studentsCount: 9,
        },
      ],
    };

    if (onAddVehicle) {
      onAddVehicle(newVehicle);
    }
    setSelectedVehicleId(newVehicle.id);
    setShowAddVehicleModal(false);
  };

  const handleEditVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !vehicleFormData.registrationNumber) return;

    const updated: Vehicle = {
      ...editingVehicle,
      registrationNumber: vehicleFormData.registrationNumber,
      type: vehicleFormData.type,
      capacity: Number(vehicleFormData.capacity) || editingVehicle.capacity,
      currentOccupancy: Number(vehicleFormData.currentOccupancy) || 0,
      driverName: vehicleFormData.driverName,
      driverPhone: vehicleFormData.driverPhone,
      routeName: vehicleFormData.routeName,
      status: vehicleFormData.status,
      speedKmH: Number(vehicleFormData.speedKmH) || 0,
      fuelLevelPercent: Number(vehicleFormData.fuelLevelPercent) || 100,
    };

    if (onEditVehicle) {
      onEditVehicle(updated);
    }
    setEditingVehicle(null);
  };

  const handleConfirmDeleteVehicle = () => {
    if (deletingVehicleId) {
      if (onDeleteVehicle) {
        onDeleteVehicle(deletingVehicleId);
      }
      if (selectedVehicleId === deletingVehicleId) {
        const remaining = vehicles.filter((v) => v.id !== deletingVehicleId);
        if (remaining[0]) setSelectedVehicleId(remaining[0].id);
      }
      setDeletingVehicleId(null);
    }
  };

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const estimatedMonthlyFee = calculateMonthlyTransportFee(calcDistance, calcVehicleType);

  // Driver Safety Scores and Monthly Completion Rates data (includes low score driver <70%)
  const driverSafetyData: DriverSafetyMetric[] = [
    {
      id: "DRV-01",
      driverName: "Mr. S. Kumar",
      driverPhone: "9842103841",
      licenseNumber: "TN-25-201800412",
      vehicleReg: "TN 25 AW 1024",
      routeName: "Route 1: Essur - Cheyyar Junction",
      safetyScore: 98,
      tripsCompleted: 44,
      totalTripsScheduled: 44,
      completionRate: 100,
      onTimePickupRate: 98.2,
      speedingIncidents: 0,
      harshBrakingIncidents: 1,
      rating: 4.9,
      statusBadge: "Top Performer",
      recentLogs: [
        { date: "Jul 22, 2026", time: "07:45 AM", event: "Smooth stop at Cheyyar Bus Stand", severity: "Low" },
        { date: "Jul 19, 2026", time: "08:10 AM", event: "Minor harsh braking near railway gate", severity: "Low" },
      ]
    },
    {
      id: "DRV-02",
      driverName: "Mr. P. Murugan",
      driverPhone: "9789312045",
      licenseNumber: "TN-25-201500891",
      vehicleReg: "TN 25 BX 4098",
      routeName: "Route 2: Vandavasi Line",
      safetyScore: 95,
      tripsCompleted: 43,
      totalTripsScheduled: 44,
      completionRate: 97.7,
      onTimePickupRate: 95.0,
      speedingIncidents: 0,
      harshBrakingIncidents: 2,
      rating: 4.8,
      statusBadge: "Fully Compliant",
      recentLogs: [
        { date: "Jul 21, 2026", time: "07:55 AM", event: "On-time arrival at Vandavasi Market", severity: "Low" },
        { date: "Jul 18, 2026", time: "08:02 AM", event: "Harsh braking recorded due to stray cattle", severity: "Medium" },
      ]
    },
    {
      id: "DRV-03",
      driverName: "Mr. K. Elumalai",
      driverPhone: "9600451829",
      licenseNumber: "TN-25-202000319",
      vehicleReg: "TN 25 CY 7712",
      routeName: "Route 3: Tindivanam Highway",
      safetyScore: 92,
      tripsCompleted: 42,
      totalTripsScheduled: 44,
      completionRate: 95.5,
      onTimePickupRate: 91.8,
      speedingIncidents: 1,
      harshBrakingIncidents: 3,
      rating: 4.7,
      statusBadge: "Good Standing",
      recentLogs: [
        { date: "Jul 20, 2026", time: "07:40 AM", event: "Minor speed warning (48 km/h in 40 km/h zone)", severity: "Medium" },
        { date: "Jul 15, 2026", time: "08:15 AM", event: "Harsh deceleration near toll plaza", severity: "Medium" },
      ]
    },
    {
      id: "DRV-04",
      driverName: "Mr. R. Vijay",
      driverPhone: "9176598821",
      licenseNumber: "TN-25-202200912",
      vehicleReg: "TN 25 DZ 9012",
      routeName: "Route 4: Cheyyar Bypass Relief Van",
      safetyScore: 65, // < 70% Safety Score triggers Admin Alert!
      tripsCompleted: 38,
      totalTripsScheduled: 44,
      completionRate: 86.3,
      onTimePickupRate: 81.5,
      speedingIncidents: 5,
      harshBrakingIncidents: 7,
      rating: 3.8,
      statusBadge: "Needs Audit",
      recentLogs: [
        { date: "Jul 23, 2026", time: "07:42 AM", event: "CRITICAL: Exceeded 55 km/h on school zone road (Limit: 35 km/h)", severity: "High" },
        { date: "Jul 22, 2026", time: "08:05 AM", event: "Harsh braking event detected near Cheyyar bypass corner", severity: "High" },
        { date: "Jul 20, 2026", time: "07:50 AM", event: "Rapid acceleration log near student pickup point #3", severity: "High" },
        { date: "Jul 17, 2026", time: "08:12 AM", event: "Late departure from school gate by 14 minutes", severity: "Medium" },
      ]
    }
  ];

  // Detect drivers with low safety score (< 70%)
  const lowSafetyDrivers = driverSafetyData.filter((d) => d.safetyScore < 70);

  const filteredDriverSafety = driverSafetyData.filter((d) => {
    const matchesSearch =
      d.driverName.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
      d.vehicleReg.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
      d.routeName.toLowerCase().includes(driverSearchQuery.toLowerCase());

    const matchesLowScoreFilter = !filterLowSafetyOnly || d.safetyScore < 70;

    return matchesSearch && matchesLowScoreFilter;
  });

  const handleDownloadSafetyReport = () => {
    setReportGeneratedMsg(true);
    setTimeout(() => setReportGeneratedMsg(false), 4000);
  };

  const handleSendAdminWarningSMS = (driver: DriverSafetyMetric) => {
    setAdminWarningSent(true);
    setTimeout(() => setAdminWarningSent(false), 4000);
  };

  const handleDownloadFleetCSV = () => {
    const reportDate = new Date().toISOString().split("T")[0];
    const csvRows: string[] = [];

    // Header section
    csvRows.push("SCHOOL FLEET DAILY ROUTES & FUEL EFFICIENCY SUMMARY REPORT");
    csvRows.push(`Report Generated Date: ${reportDate}`);
    csvRows.push("");

    // Section 1: Vehicle Routes & Efficiency Benchmark
    csvRows.push("--- VEHICLE ROUTES & EFFICIENCY BENCHMARKS ---");
    csvRows.push(
      [
        "Vehicle Reg No",
        "Vehicle Type",
        "Driver Name",
        "Driver Contact",
        "Route Name",
        "Total Route Stops",
        "One-Way Distance (Km)",
        "Est. Daily Distance Covered (Km)",
        "Calculated KMPL (km/L)",
        "Target KMPL",
        "Fuel Status",
        "Total Fuel Consumed (L)",
        "Total Fuel Spend (Rs)",
        "Cost Per Km (Rs)",
        "Safety Score"
      ].join(",")
    );

    vehicleFuelStats.forEach((stat) => {
      const v = stat.vehicle;
      const dailyDistance = v.distanceKm * 2;
      csvRows.push(
        [
          `"${v.registrationNumber}"`,
          `"${v.type}"`,
          `"${v.driverName}"`,
          `"${v.driverPhone || 'N/A'}"`,
          `"${v.routeName}"`,
          v.totalStops,
          v.distanceKm,
          dailyDistance,
          stat.avgKmpl,
          stat.targetKmpl,
          `"${stat.status}"`,
          stat.totalLiters,
          stat.totalCost,
          stat.costPerKm,
          `"${v.driverScore || '90%'}"`
        ].join(",")
      );
    });

    csvRows.push("");
    csvRows.push("--- DETAILED REFUELING LOGS HISTORY ---");
    csvRows.push(
      [
        "Log ID",
        "Refuel Date",
        "Vehicle Reg No",
        "Driver Name",
        "Fuel Station Name",
        "Fuel Type",
        "Odometer (Km)",
        "Km Driven Since Fill",
        "Liters Added",
        "Total Cost (Rs)",
        "Calculated KMPL",
        "Notes"
      ].join(",")
    );

    fuelLogs.forEach((log) => {
      csvRows.push(
        [
          `"${log.id}"`,
          `"${log.date}"`,
          `"${log.registrationNumber}"`,
          `"${log.loggedByDriver}"`,
          `"${log.fuelStationName.replace(/"/g, '""')}"`,
          `"${log.fuelType}"`,
          log.odometerKm,
          log.kmDrivenSinceLastFill,
          log.fuelLiters,
          log.totalCostRs,
          log.calculatedKmpl,
          `"${(log.notes || '').replace(/"/g, '""')}"`
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `School_Fleet_Routes_And_Fuel_Summary_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFuelSuccessMsg(`Fleet Routes & Fuel Efficiency CSV Summary downloaded successfully!`);
    setTimeout(() => setFuelSuccessMsg(null), 4500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-blue-600 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            Fleet Telemetry & Tracking
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Van & Bus Live Locations</h2>
          <p className="text-xs text-slate-400">
            Real-time GPS tracking, driver rosters, fuel efficiency telemetry (KMPL), and automated distance fee calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadFleetCSV}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
            title="Download CSV summary of daily routes, distances, and KMPL fuel metrics"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            Export Routes & Fuel (CSV)
          </button>

          <button
            onClick={() => handleOpenAddFuelModal()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Fuel className="w-4 h-4 text-slate-950" />
            Log Refueling Event
          </button>

          <button
            onClick={handleOpenAddVehicle}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            Add New Fleet Vehicle
          </button>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              {vehicles.length} Active Fleets
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-200 font-medium">GPS Signal: 100%</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <button
            onClick={() => setFleetSectionTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              fleetSectionTab === "all"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bus className="w-4 h-4 text-amber-400" />
            Show Overview
          </button>

          <button
            onClick={() => setFleetSectionTab("gps")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              fleetSectionTab === "gps"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Navigation className="w-4 h-4" />
            GPS Radar & Live Map
          </button>

          <button
            onClick={() => setFleetSectionTab("fuel")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              fleetSectionTab === "fuel"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Fuel className="w-4 h-4 text-amber-600" />
            Fuel Efficiency Tracker (KMPL)
          </button>

          <button
            onClick={() => setFleetSectionTab("safety")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              fleetSectionTab === "safety"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Driver Safety & Scores
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFleetCSV}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-3.5 py-2 rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
            title="Download CSV summary of daily routes, total distances, and KMPL"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            Export Routes & Fuel CSV
          </button>

          <button
            onClick={() => handleOpenAddFuelModal()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Fuel className="w-4 h-4" />
            Log Refueling Event
          </button>
        </div>
      </div>

      {/* Fuel Refueling Success Notification Toast */}
      {fuelSuccessMsg && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between font-extrabold text-xs animate-bounce-short">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <span>{fuelSuccessMsg}</span>
          </div>
          <button onClick={() => setFuelSuccessMsg(null)} className="text-white hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Fleet Cards & Live Map Telemetry */}
      {(fleetSectionTab === "all" || fleetSectionTab === "gps") && (
        <div className="space-y-4">
          {/* Live Map Telemetry KPIs Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-lg grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 block flex items-center gap-1">
                🏫 School Campus Hub
              </span>
              <strong className="text-white text-xs block font-bold truncate">Wisdom Primary School</strong>
              <span className="text-[10px] text-slate-400 block font-mono">Essur • Gate 1 Depot</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-400 block flex items-center gap-1">
                📡 GPS Vehicles Mapped
              </span>
              <strong className="text-white text-sm block font-black">{vehicles.length} Active Fleets</strong>
              <span className="text-[10px] text-emerald-400 block font-mono font-bold">● 100% Signal Online</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 block flex items-center gap-1">
                🚏 Mapped Pick-Up Points
              </span>
              <strong className="text-amber-300 text-sm block font-black">{totalPickupStopsCount} Student Stops</strong>
              <span className="text-[10px] text-slate-400 block font-mono">Morning & Evening</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block flex items-center gap-1">
                ������ Students On Routes
              </span>
              <strong className="text-emerald-300 text-sm block font-black">{totalStudentsOnRoutes} Students</strong>
              <span className="text-[10px] text-slate-400 block font-mono">Assigned Transport</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1 col-span-2 sm:col-span-4 lg:col-span-1">
              <span className="text-[10px] font-bold uppercase text-cyan-400 block flex items-center gap-1">
                🛡️ Geofence Safety Zone
              </span>
              <strong className="text-cyan-300 text-sm block font-black">15 km Safe Zone</strong>
              <span className="text-[10px] text-slate-400 block font-mono">Cheyyar-Essur Corridor</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (5 cols): Vehicle Selection List */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-between">
            <span>School Fleet Roster ({vehicles.length})</span>
            <button
              onClick={handleOpenAddVehicle}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Fleet
            </button>
          </h3>

          <div className="space-y-3">
            {vehicles.map((v) => {
              const isSelected = v.id === activeVehicle?.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-4 rounded-2xl transition cursor-pointer border shadow-sm ${
                    isSelected
                      ? "bg-slate-900 text-white border-yellow-400 ring-2 ring-yellow-400/30"
                      : "bg-white text-slate-900 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isSelected ? "bg-yellow-400 text-slate-950 font-bold" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <Bus className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-base">{v.registrationNumber}</h4>
                        <p className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {v.type} | {v.routeName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          v.status === "In Transit"
                            ? "bg-emerald-500 text-white"
                            : v.status === "At School"
                            ? "bg-blue-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {v.status}
                      </span>

                      {/* Edit & Delete Action Buttons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditVehicle(v);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-slate-700"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                        }`}
                        title="Edit Fleet Vehicle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingVehicleId(v.id);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-red-950 hover:bg-red-900 text-red-300 border border-red-800"
                            : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                        }`}
                        title="Delete Fleet Vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/30 text-xs">
                    <div>
                      <span className={`text-[10px] uppercase block ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                        Driver
                      </span>
                      <span className="font-bold truncate block">{v.driverName}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] uppercase block ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                        Occupancy
                      </span>
                      <span className="font-bold">{v.currentOccupancy} / {v.capacity}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] uppercase block ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                        Speed
                      </span>
                      <span className="font-bold text-emerald-400">{v.speedKmH} km/h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Automated Distance Fee Calculation Tool Box */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Automated Distance Fee Estimator</h4>
                <p className="text-[11px] text-slate-500">Calculate monthly transport fee per student</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Pickup Distance from Wisdom School (km): <span className="text-indigo-600 font-mono text-sm">{calcDistance} km</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 km</span>
                  <span>10 km</span>
                  <span>25 km</span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Vehicle Category Tier:</label>
                <select
                  value={calcVehicleType}
                  onChange={(e) => setCalcVehicleType(e.target.value as VehicleType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-semibold text-slate-900"
                >
                  <option value="Van (14-Seater)">Van (14-Seater) - 1.0x Base</option>
                  <option value="Force Traveller (20-Seater)">Force Traveller - 1.1x Tier</option>
                  <option value="Mini Bus (26-Seater)">Mini Bus (26-Seater) - 1.25x Tier</option>
                  <option value="School Bus (40-Seater)">School Bus (40-Seater) - 1.35x Tier</option>
                </select>
              </div>

              <div className="bg-indigo-900 text-white rounded-xl p-3 flex items-center justify-between font-bold">
                <span className="text-indigo-200">Calculated Monthly Transport Fee</span>
                <span className="text-yellow-400 text-lg font-mono">₹{estimatedMonthlyFee.toLocaleString("en-IN")} / mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Interactive Live Route Map & Telemetry Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Vehicle Detailed Telemetry & Interactive Map Container */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Selected Telemetry View
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-1">
                  {activeVehicle?.registrationNumber} ({activeVehicle?.type})
                </h3>
                <p className="text-xs text-slate-500">{activeVehicle?.routeName}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setMapViewMode("map")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      mapViewMode === "map"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🗺️ GPS Radar Map
                  </button>
                  <button
                    onClick={() => setMapViewMode("stops")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      mapViewMode === "stops"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🚏 Stop List
                  </button>
                </div>

                <a
                  href={`tel:${activeVehicle?.driverPhone}`}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow"
                >
                  <Phone className="w-4 h-4" />
                  Call ({activeVehicle?.driverName})
                </a>
              </div>
            </div>

            {/* View Switcher: Interactive GIS Map or Stop Sequence List */}
            {mapViewMode === "map" ? (
              <InteractiveFleetMap
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={(id) => setSelectedVehicleId(id)}
              />
            ) : (
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-4 text-white min-h-[320px] flex flex-col justify-between shadow-inner">
                {/* Map Canvas Visual Simulation */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                {/* Top Map HUD Overlay */}
                <div className="relative z-10 flex items-center justify-between text-xs font-semibold bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    Route Stop Sequence: {activeVehicle?.routeName}
                  </span>
                  <span className="text-emerald-400 font-mono">Lat: {activeVehicle?.currentLat}, Lng: {activeVehicle?.currentLng}</span>
                </div>

                {/* Simulated Vehicle Movement Graphics */}
                <div className="relative z-10 my-8 space-y-6">
                  <div className="relative border-l-2 border-dashed border-blue-500/60 ml-6 pl-6 space-y-6">
                    {activeVehicle?.stops.map((stop, idx) => {
                      const isCurrent = idx === activeVehicle.currentStopIndex;
                      const isPassed = idx < activeVehicle.currentStopIndex;

                      return (
                        <div key={stop.id} className="relative flex items-start justify-between text-xs">
                          {/* Stop Icon Bullet */}
                          <div
                            className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isCurrent
                                ? "bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/30 font-black animate-pulse"
                                : isPassed
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {idx + 1}
                          </div>

                          <div>
                            <p className={`font-bold text-sm ${isCurrent ? "text-yellow-400" : isPassed ? "text-slate-300 line-through" : "text-white"}`}>
                              {stop.stopName}
                            </p>
                            <p className="text-[11px] text-slate-400">{stop.landmark} ({stop.distanceFromSchoolKm} km from school)</p>
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-slate-300 font-bold block">{stop.scheduledTimeMorning}</span>
                            <span className="text-[10px] text-slate-500">{stop.studentsCount} Students Pickup</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom HUD Bar */}
                <div className="relative z-10 grid grid-cols-3 gap-2 text-center text-xs bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Speed Gauge</span>
                    <span className="text-yellow-400 font-black text-sm">{activeVehicle?.speedKmH} km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Fuel Level</span>
                    <span className="text-emerald-400 font-black text-sm">{activeVehicle?.fuelLevelPercent}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Driver Contact</span>
                    <span className="text-slate-200 font-bold">{activeVehicle?.driverPhone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Technical Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Vehicle Type</span>
                <span className="font-extrabold text-slate-900">{activeVehicle?.type}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Seating Capacity</span>
                <span className="font-extrabold text-slate-900">{activeVehicle?.capacity} Seats</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Route</span>
                <span className="font-extrabold text-slate-900 truncate block">{activeVehicle?.routeName}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Driver License</span>
                <span className="font-extrabold text-slate-900 font-mono text-[11px]">TN-25-201800412</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* SECTION 2: FUEL EFFICIENCY & KMPL TRACKER */}
      {(fleetSectionTab === "all" || fleetSectionTab === "fuel") && (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  Fleet Fuel Telemetry & Efficiency Engine
                </span>
                <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {fuelLogs.length} Refuels Logged
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Van Fuel Efficiency & KMPL Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Log refueling events, track average kilometers per liter (KMPL) per van, monitor fuel spend, and benchmark fleet performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadFleetCSV}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
                title="Download full CSV report with routes, distance covered, and fuel KMPL metrics"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                Download Fleet CSV Report
              </button>

              <button
                onClick={() => handleOpenAddFuelModal()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-950" />
                Log New Refueling Event
              </button>
            </div>
          </div>

          {/* Top Fleet-Wide Fuel KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
            {/* Average Fleet KMPL */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-amber-900 text-[10px] uppercase font-bold block">Fleet Avg Fuel Efficiency</span>
                <span className="text-2xl font-black text-amber-950 font-mono mt-0.5 block">
                  {fleetFuelTotals.fleetAvgKmpl} <span className="text-xs font-sans text-amber-700">km/l</span>
                </span>
                <span className="text-[10px] text-amber-800 font-bold mt-1 inline-flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-600" /> Target: ~8.0 KMPL Target
                </span>
              </div>
              <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow">
                <Fuel className="w-6 h-6" />
              </div>
            </div>

            {/* Total Fuel Expenditure */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-emerald-800 text-[10px] uppercase font-bold block">Total Fuel Spend</span>
                <span className="text-2xl font-black text-emerald-950 font-mono mt-0.5 block">
                  ₹{fleetFuelTotals.totalCost.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
                  Across {fleetFuelTotals.totalRefuels} Refueling Events
                </span>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Total Fuel Consumed (Liters) */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 p-4 rounded-2xl border border-blue-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-blue-800 text-[10px] uppercase font-bold block">Total Fuel Consumed</span>
                <span className="text-2xl font-black text-blue-950 font-mono mt-0.5 block">
                  {fleetFuelTotals.totalLiters} <span className="text-xs font-sans text-blue-700">Liters</span>
                </span>
                <span className="text-[10px] text-blue-700 font-bold mt-1 inline-block">
                  {fleetFuelTotals.totalKm} Total Km Tracked
                </span>
              </div>
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow">
                <Droplets className="w-6 h-6" />
              </div>
            </div>

            {/* Average Cost per Kilometer */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 p-4 rounded-2xl border border-purple-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-purple-800 text-[10px] uppercase font-bold block">Avg Fleet Running Cost</span>
                <span className="text-2xl font-black text-purple-950 font-mono mt-0.5 block">
                  ₹{fleetFuelTotals.fleetAvgCostPerKm} <span className="text-xs font-sans text-purple-700">/ km</span>
                </span>
                <span className="text-[10px] text-purple-700 font-bold mt-1 inline-block">
                  Diesel Avg ₹98 / Liter
                </span>
              </div>
              <div className="p-3 bg-purple-600 text-white rounded-2xl shadow">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Vehicle-by-Vehicle KMPL Efficiency Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-600" />
                School Van Efficiency & KMPL Benchmarks ({vehicles.length} Vans)
              </h4>
              <span className="text-xs text-slate-500 font-medium">Updated per refueling event</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicleFuelStats.map((stat) => {
                const v = stat.vehicle;
                const kmplPercent = Math.min(100, Math.round((stat.avgKmpl / (stat.targetKmpl * 1.25)) * 100));

                return (
                  <div
                    key={v.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 hover:shadow-md transition"
                  >
                    {/* Van Header & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-base">{v.registrationNumber}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {v.type.split(" ")[0]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{v.routeName}</p>
                        <p className="text-[11px] text-slate-600 font-semibold mt-0.5">Driver: {v.driverName}</p>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          stat.status === "Excellent"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : stat.status === "Normal"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                        }`}
                      >
                        {stat.status === "Excellent" ? "✓ High Efficiency" : stat.status === "Normal" ? "Optimal" : "⚠️ Low KMPL"}
                      </span>
                    </div>

                    {/* KMPL Gauge Metric Box */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-bold uppercase">Average KMPL</span>
                        <div className="text-right">
                          <span className="text-xl font-black text-slate-900 font-mono">{stat.avgKmpl}</span>
                          <span className="text-xs font-bold text-slate-500 ml-1">km/L</span>
                        </div>
                      </div>

                      {/* Visual KMPL Progress Bar */}
                      <div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${kmplPercent}%` }}
                            className={`h-full transition-all duration-500 ${
                              stat.avgKmpl >= stat.targetKmpl
                                ? "bg-emerald-500"
                                : stat.avgKmpl >= stat.targetKmpl - 1.0
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                          <span>0 km/L</span>
                          <span className="text-amber-600 font-bold">Target: {stat.targetKmpl} KMPL</span>
                          <span>12 km/L</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Summary Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold bg-white/60 p-2 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase block font-bold">Total Dist</span>
                        <span className="text-slate-900 font-mono font-bold">{stat.totalKm} km</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase block font-bold">Fuel Used</span>
                        <span className="text-slate-900 font-mono font-bold">{stat.totalLiters} L</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase block font-bold">Cost / Km</span>
                        <span className="text-emerald-700 font-mono font-bold">₹{stat.costPerKm}</span>
                      </div>
                    </div>

                    {/* Footer Action Button */}
                    <button
                      onClick={() => handleOpenAddFuelModal(v.id)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      Log Refueling for {v.registrationNumber}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refueling Logs History Table & Search */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Recent Van Refueling Logs ({filteredFuelLogs.length} Entries)
                </h4>
                <p className="text-xs text-slate-500">Historical fuel logs submitted by school transport drivers</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search van, driver, fuel station..."
                    value={fuelSearchQuery}
                    onChange={(e) => setFuelSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Filter Vehicle Dropdown */}
                <select
                  value={selectedFuelVehicleFilter}
                  onChange={(e) => setSelectedFuelVehicleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="All">All School Fleet Vans</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.driverName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Refuel Date</th>
                    <th className="p-3">Van Reg #</th>
                    <th className="p-3">Driver Name</th>
                    <th className="p-3">Fuel Bunk / Station</th>
                    <th className="p-3 text-right">Liters (L)</th>
                    <th className="p-3 text-right">Total Cost (₹)</th>
                    <th className="p-3 text-right">Km Driven</th>
                    <th className="p-3 text-right">Calculated KMPL</th>
                    <th className="p-3 text-center">Type</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                  {filteredFuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No refueling logs match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredFuelLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono text-slate-600 font-bold whitespace-nowrap">{log.date}</td>
                        <td className="p-3 font-black text-slate-900 whitespace-nowrap">{log.registrationNumber}</td>
                        <td className="p-3 font-semibold text-slate-800">{log.loggedByDriver}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[180px]">{log.fuelStationName}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{log.fuelLiters} L</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{log.totalCostRs.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-700">{log.kmDrivenSinceLastFill} km</td>
                        <td className="p-3 text-right">
                          <span
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                              log.calculatedKmpl >= 8.0
                                ? "bg-emerald-100 text-emerald-800"
                                : log.calculatedKmpl >= 7.0
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {log.calculatedKmpl} km/l
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] bg-slate-100 font-bold uppercase text-slate-700 px-2 py-0.5 rounded">
                            {log.fuelType}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteFuelLog(log.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Refuel Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Driver Safety Scores & Completion Rates Summary Table */}
      {(fleetSectionTab === "all" || fleetSectionTab === "safety") && (
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">

        {/* Low Safety Score Admin Alert Notification Badge System */}
        {lowSafetyDrivers.length > 0 && (
          <div className="bg-gradient-to-r from-red-900 via-red-800 to-rose-950 text-white p-4 sm:p-5 rounded-2xl border-2 border-red-500 shadow-xl relative overflow-hidden animate-pulse-slow">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-red-600/90 text-white rounded-2xl shadow-lg ring-4 ring-red-400/30 flex-shrink-0 mt-0.5">
                  <BellRing className="w-6 h-6 text-yellow-300 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-sm">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      ADMIN SAFETY ALERT BADGE
                    </span>
                    <span className="bg-yellow-400 text-slate-950 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                      {lowSafetyDrivers.length} Driver(s) &lt; 70% Score
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-white mt-1 leading-tight">
                    Critical Safety Review Needed: Safety Score Below Threshold (&lt;70%)
                  </h4>
                  <p className="text-xs text-red-100/90 mt-1 max-w-3xl leading-relaxed">
                    Automated telemetry detected <strong>{lowSafetyDrivers.map(d => `${d.driverName} (${d.routeName} - ${d.safetyScore}%)`).join(", ")}</strong> with safety score below acceptable school transport standard (70%). Immediate admin audit of recent speed and braking logs is required.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-center flex-shrink-0">
                <button
                  onClick={() => {
                    setFilterLowSafetyOnly(true);
                    if (lowSafetyDrivers[0]) setReviewingDriverLogs(lowSafetyDrivers[0]);
                  }}
                  className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-950" />
                  Review Recent Safety Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Title & Actions Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 w-max">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Monthly Telemetry Audit & Safety Roster
              </span>
              {lowSafetyDrivers.length > 0 && (
                <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  {lowSafetyDrivers.length} High-Risk Alert
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Driver Safety Scores & Trip Completion Rates
            </h3>
            <p className="text-xs text-slate-500">
              Comprehensive telemetry analysis tracking safety compliance, speed adherence, and monthly route completion performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month Filter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none pr-2 py-1 cursor-pointer"
              >
                <option value="July 2026 (Current)">July 2026 (Current)</option>
                <option value="June 2026">June 2026</option>
                <option value="May 2026">May 2026</option>
              </select>
            </div>

            {/* Export Audit Report Button */}
            <button
              onClick={handleDownloadSafetyReport}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-yellow-400" />
              Export Safety Log (CSV)
            </button>
          </div>
        </div>

        {/* Report Download Notification Banner */}
        {reportGeneratedMsg && (
          <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl text-emerald-950 font-extrabold text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Official Driver Safety & Completion Rate Audit Log ({selectedMonth}) generated successfully!</span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">PDF / CSV Ready</span>
          </div>
        )}

        {/* Top KPI Cards Grid for Safety & Completion Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-emerald-800 text-[10px] uppercase font-bold block">Fleet Average Safety Score</span>
              <span className="text-2xl font-black text-emerald-950 font-mono mt-0.5 block">87.5 / 100</span>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">4 Driver Telemetry Logs</span>
            </div>
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-200 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-blue-800 text-[10px] uppercase font-bold block">Trip Completion Rate</span>
              <span className="text-2xl font-black text-blue-950 font-mono mt-0.5 block">94.8%</span>
              <span className="text-[10px] text-blue-700 font-bold mt-1 inline-block">167 / 176 Trips Completed</span>
            </div>
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-amber-800 text-[10px] uppercase font-bold block">On-Time Pickup Rate</span>
              <span className="text-2xl font-black text-amber-950 font-mono mt-0.5 block">91.6%</span>
              <span className="text-[10px] text-amber-700 font-bold mt-1 inline-block">Avg Delay &lt; 5.0 Mins</span>
            </div>
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Low Safety Score Alert KPI Card */}
          <div className="bg-gradient-to-br from-red-900 to-rose-950 p-4 rounded-2xl border border-red-700 text-white flex items-center justify-between shadow-sm relative overflow-hidden">
            <div>
              <span className="text-red-200 text-[10px] uppercase font-extrabold block tracking-wider">High Risk Alerts (&lt;70%)</span>
              <span className="text-2xl font-black text-yellow-300 font-mono mt-0.5 block">
                {lowSafetyDrivers.length} Driver(s)
              </span>
              <button
                onClick={() => setFilterLowSafetyOnly(!filterLowSafetyOnly)}
                className="text-[10px] bg-red-800 hover:bg-red-700 text-white px-2 py-0.5 rounded font-bold mt-1 inline-flex items-center gap-1 cursor-pointer transition border border-red-600"
              >
                {filterLowSafetyOnly ? "Show All Drivers" : "Filter Low Score (<70%)"}
              </button>
            </div>
            <div className="p-3 bg-red-600 text-yellow-300 rounded-2xl border border-red-500 shadow animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter / Search Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search driver name, vehicle reg, or route..."
              value={driverSearchQuery}
              onChange={(e) => setDriverSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-center justify-between sm:justify-end w-full sm:w-auto">
            {/* Low Score Filter Toggle Button */}
            <button
              onClick={() => setFilterLowSafetyOnly(!filterLowSafetyOnly)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 cursor-pointer border ${
                filterLowSafetyOnly
                  ? "bg-red-600 text-white border-red-700 shadow"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <AlertOctagon className={`w-3.5 h-3.5 ${filterLowSafetyOnly ? "text-yellow-300" : "text-red-500"}`} />
              <span>Show Low Scores (&lt;70%) [{lowSafetyDrivers.length}]</span>
            </button>

            <span className="text-slate-500 font-bold text-[11px]">
              Showing <strong>{filteredDriverSafety.length}</strong> of <strong>{driverSafetyData.length}</strong> Driver Records
            </span>
          </div>
        </div>

        {/* Driver Safety & Completion Summary Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-900 text-slate-200 text-[11px] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Driver & License Info</th>
                <th className="py-3.5 px-4">Assigned Route & Fleet</th>
                <th className="py-3.5 px-4 text-center">Safety Score</th>
                <th className="py-3.5 px-4 text-center">Completion Rate</th>
                <th className="py-3.5 px-4 text-center">On-Time %</th>
                <th className="py-3.5 px-4 text-center">Safety Telemetry Incidents</th>
                <th className="py-3.5 px-4 text-center">Performance Standing</th>
                <th className="py-3.5 px-4 text-center">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
              {filteredDriverSafety.map((driver) => {
                const isLowScore = driver.safetyScore < 70;

                const scoreColor =
                  driver.safetyScore >= 95
                    ? "bg-emerald-500"
                    : driver.safetyScore >= 90
                    ? "bg-blue-500"
                    : driver.safetyScore >= 70
                    ? "bg-amber-500"
                    : "bg-red-600";

                const scoreTextColor =
                  driver.safetyScore >= 95
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : driver.safetyScore >= 90
                    ? "text-blue-700 bg-blue-50 border-blue-200"
                    : driver.safetyScore >= 70
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-red-800 bg-red-100 border-red-300 font-black animate-pulse";

                return (
                  <tr
                    key={driver.id}
                    className={`transition ${
                      isLowScore ? "bg-red-50/70 hover:bg-red-100/80 border-l-4 border-l-red-600" : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Driver Name & License */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-sm shadow-sm flex-shrink-0 ${
                            isLowScore
                              ? "bg-red-600 text-white ring-2 ring-red-400"
                              : "bg-slate-900 text-yellow-400"
                          }`}
                        >
                          {driver.driverName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-extrabold text-slate-900 text-sm">{driver.driverName}</p>
                            {isLowScore && (
                              <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono">
                                AUDIT REQD
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono font-semibold">
                            Lic: {driver.licenseNumber} | Ph: {driver.driverPhone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Route & Fleet */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-extrabold text-indigo-900 text-xs flex items-center gap-1">
                          <Bus className="w-3.5 h-3.5 text-indigo-600" />
                          {driver.vehicleReg}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">{driver.routeName}</p>
                      </div>
                    </td>

                    {/* Safety Score with Progress Bar */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-xs border ${scoreTextColor}`}>
                          {driver.safetyScore} / 100
                        </span>
                        {/* Visual Progress Bar */}
                        <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scoreColor}`}
                            style={{ width: `${driver.safetyScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Completion Rate & Trips Ratio */}
                    <td className="py-3.5 px-4 text-center">
                      <div>
                        <span className={`font-black text-sm font-mono block ${isLowScore ? "text-red-900" : "text-slate-900"}`}>
                          {driver.completionRate}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          {driver.tripsCompleted} / {driver.totalTripsScheduled} Trips
                        </span>
                      </div>
                    </td>

                    {/* On-Time Pickup Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-black text-xs font-mono px-2 py-0.5 rounded border ${
                          isLowScore
                            ? "text-red-800 bg-red-100 border-red-300"
                            : "text-emerald-800 bg-emerald-50 border-emerald-200"
                        }`}
                      >
                        {driver.onTimePickupRate}%
                      </span>
                    </td>

                    {/* Safety Telemetry Incidents */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            driver.speedingIncidents === 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800 font-black"
                          }`}
                          title="Speed Limit Violations"
                        >
                          Speeding: {driver.speedingIncidents}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            driver.harshBrakingIncidents > 4
                              ? "bg-amber-100 text-amber-900 font-black"
                              : "bg-slate-100 text-slate-700"
                          }`}
                          title="Harsh Braking Events"
                        >
                          Braking: {driver.harshBrakingIncidents}
                        </span>
                      </div>
                    </td>

                    {/* Performance Standing Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            driver.statusBadge === "Top Performer"
                              ? "bg-yellow-100 text-yellow-950 border border-yellow-300"
                              : driver.statusBadge === "Fully Compliant"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : driver.statusBadge === "Needs Audit"
                              ? "bg-red-600 text-white border border-red-700 shadow animate-pulse"
                              : "bg-slate-100 text-slate-800 border border-slate-300"
                          }`}
                        >
                          {driver.statusBadge === "Top Performer" && <Star className="w-3 h-3 fill-yellow-500 text-yellow-600" />}
                          {driver.statusBadge === "Fully Compliant" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {driver.statusBadge === "Needs Audit" && <AlertTriangle className="w-3 h-3 text-yellow-300" />}
                          {driver.statusBadge}
                        </span>

                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                          Rating: <strong className="text-slate-900">{driver.rating}</strong> / 5.0
                        </span>
                      </div>
                    </td>

                    {/* Admin Review Action Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setReviewingDriverLogs(driver)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition shadow flex items-center justify-center gap-1.5 mx-auto cursor-pointer ${
                          isLowScore
                            ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-yellow-400" />
                        {isLowScore ? "Review Logs" : "View Logs"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Safety Policy Footnote Banner */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <p>
              <strong>Wisdom Transport Safety Protocol:</strong> Drivers maintaining a monthly safety score above 95/100 and completion rate &gt;98% qualify for the quarterly school safety incentive bonus. Scores below 70% automatically flag for mandatory chief officer review.
            </p>
          </div>

          <span className="text-[10px] font-mono font-extrabold text-slate-500 uppercase bg-slate-200 px-2.5 py-1 rounded-lg">
            ISO 39001 Road Safety Standard
          </span>
        </div>
      </div>
      )}

      {/* ADMIN DRIVER SAFETY LOG AUDIT MODAL */}
      {reviewingDriverLogs && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in duration-200">
            {/* Close Modal Button */}
            <button
              onClick={() => setReviewingDriverLogs(null)}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    reviewingDriverLogs.safetyScore < 70
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  Telemetry Audit Log
                </span>
                {reviewingDriverLogs.safetyScore < 70 && (
                  <span className="bg-yellow-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                    Score: {reviewingDriverLogs.safetyScore}% (&lt; 70% Alert)
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                {reviewingDriverLogs.driverName}
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {reviewingDriverLogs.vehicleReg}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Route: <strong>{reviewingDriverLogs.routeName}</strong> | Lic: <strong>{reviewingDriverLogs.licenseNumber}</strong>
              </p>
            </div>

            {/* Admin SMS Alert Banner Notification */}
            {adminWarningSent && (
              <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl text-emerald-950 font-bold text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Official Safety Audit Notice & Speed Warning SMS dispatched to {reviewingDriverLogs.driverPhone}!</span>
              </div>
            )}

            {/* Summary Metrics Banner */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Safety Score</span>
                <span
                  className={`text-xl font-black font-mono block ${
                    reviewingDriverLogs.safetyScore < 70 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {reviewingDriverLogs.safetyScore} / 100
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Speeding Incidents</span>
                <span className="text-xl font-black text-slate-900 font-mono block">
                  {reviewingDriverLogs.speedingIncidents}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Harsh Braking</span>
                <span className="text-xl font-black text-slate-900 font-mono block">
                  {reviewingDriverLogs.harshBrakingIncidents}
                </span>
              </div>
            </div>

            {/* Telemetry Logs List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Automated Telemetry Logs ({selectedMonth})</span>
                <span className="text-[10px] font-mono font-bold text-slate-400">GPS & Accelerometer Sensor Data</span>
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {reviewingDriverLogs.recentLogs && reviewingDriverLogs.recentLogs.length > 0 ? (
                  reviewingDriverLogs.recentLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                        log.severity === "High"
                          ? "bg-red-50 border-red-200 text-red-950"
                          : log.severity === "Medium"
                          ? "bg-amber-50 border-amber-200 text-amber-950"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {log.severity === "High" ? (
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-extrabold leading-snug">{log.event}</p>
                          <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                            {log.date} at {log.time}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                          log.severity === "High"
                            ? "bg-red-600 text-white"
                            : log.severity === "Medium"
                            ? "bg-amber-200 text-amber-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No telemetry incidents logged for this period.</p>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={`tel:${reviewingDriverLogs.driverPhone}`}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Driver ({reviewingDriverLogs.driverPhone})
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {reviewingDriverLogs.safetyScore < 70 && (
                  <button
                    onClick={() => handleSendAdminWarningSMS(reviewingDriverLogs)}
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-yellow-300" />
                    Issue Formal Safety Warning SMS
                  </button>
                )}

                <button
                  onClick={() => setReviewingDriverLogs(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD FLEET VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-400 text-slate-950 rounded-xl font-bold">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Add New Assigned Fleet Vehicle</h3>
                  <p className="text-xs text-slate-500">Register van, bus, or Traveller to school transport fleet</p>
                </div>
              </div>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TN 25 CZ 9012"
                    value={vehicleFormData.registrationNumber}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, registrationNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-mono text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Type Category</label>
                  <select
                    value={vehicleFormData.type}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, type: e.target.value as VehicleType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="Van (14-Seater)">Van (14-Seater)</option>
                    <option value="Force Traveller (20-Seater)">Force Traveller (20-Seater)</option>
                    <option value="Mini Bus (26-Seater)">Mini Bus (26-Seater)</option>
                    <option value="School Bus (40-Seater)">School Bus (40-Seater)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. R. Saravanan"
                    value={vehicleFormData.driverName}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, driverName: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9176593129"
                    value={vehicleFormData.driverPhone}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, driverPhone: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Transport Route Name</label>
                <input
                  type="text"
                  placeholder="e.g. Route 4: Cheyyar - Vandavasi Bypass"
                  value={vehicleFormData.routeName}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, routeName: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={vehicleFormData.capacity}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Occupancy</label>
                  <input
                    type="number"
                    value={vehicleFormData.currentOccupancy}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, currentOccupancy: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Status</label>
                  <select
                    value={vehicleFormData.status}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="At School">At School</option>
                    <option value="In Transit">In Transit</option>
                    <option value="At Stop">At Stop</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Idle">Idle</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Save Fleet Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FLEET VEHICLE MODAL */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white rounded-xl font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Edit Vehicle: {editingVehicle.registrationNumber}</h3>
                  <p className="text-xs text-slate-500">Update capacity, route, assigned driver, or telemetry status</p>
                </div>
              </div>
              <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditVehicleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={vehicleFormData.registrationNumber}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, registrationNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-mono text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Type Category</label>
                  <select
                    value={vehicleFormData.type}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, type: e.target.value as VehicleType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="Van (14-Seater)">Van (14-Seater)</option>
                    <option value="Force Traveller (20-Seater)">Force Traveller (20-Seater)</option>
                    <option value="Mini Bus (26-Seater)">Mini Bus (26-Seater)</option>
                    <option value="School Bus (40-Seater)">School Bus (40-Seater)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={vehicleFormData.driverName}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, driverName: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Phone</label>
                  <input
                    type="tel"
                    value={vehicleFormData.driverPhone}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, driverPhone: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Route Name</label>
                <input
                  type="text"
                  value={vehicleFormData.routeName}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, routeName: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={vehicleFormData.capacity}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Occupancy</label>
                  <input
                    type="number"
                    value={vehicleFormData.currentOccupancy}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, currentOccupancy: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duty Status</label>
                  <select
                    value={vehicleFormData.status}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="At School">At School</option>
                    <option value="In Transit">In Transit</option>
                    <option value="At Stop">At Stop</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Idle">Idle</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  Update Vehicle Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE VEHICLE CONFIRMATION MODAL */}
      {deletingVehicleId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center text-slate-900">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Confirm Delete Fleet Vehicle?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this vehicle from the active school transport roster?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingVehicleId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDeleteVehicle}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow cursor-pointer"
              >
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG REFUELING EVENT MODAL */}
      {showAddFuelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-slate-900 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Fuel className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Log Van Refueling Event</h3>
                  <p className="text-xs text-slate-500">Record fuel added & compute average KMPL</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddFuelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFuelSubmit} className="space-y-4 text-xs">
              {/* Select Fleet Vehicle */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select School Van / Bus:</label>
                <select
                  value={fuelFormData.vehicleId}
                  onChange={(e) => {
                    const targetV = vehicles.find((v) => v.id === e.target.value);
                    setFuelFormData({
                      ...fuelFormData,
                      vehicleId: e.target.value,
                      loggedByDriver: targetV?.driverName || fuelFormData.loggedByDriver,
                    });
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.type} ({v.driverName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Refueling Date</label>
                  <input
                    type="date"
                    value={fuelFormData.date}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, date: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fuel Type</label>
                  <select
                    value={fuelFormData.fuelType}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, fuelType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Odometer Reading (km)</label>
                  <input
                    type="number"
                    value={fuelFormData.odometerKm}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, odometerKm: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Km Driven Since Last Tank</label>
                  <input
                    type="number"
                    step="1"
                    value={fuelFormData.kmDrivenSinceLastFill}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, kmDrivenSinceLastFill: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fuel Added (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fuelFormData.fuelLiters}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, fuelLiters: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Refueling Cost (₹)</label>
                  <input
                    type="number"
                    value={fuelFormData.totalCostRs}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, totalCostRs: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Dynamic KMPL Calculation Live Preview Box */}
              <div className="bg-amber-950 text-white rounded-xl p-3.5 flex items-center justify-between border border-amber-800">
                <div>
                  <span className="text-[10px] text-amber-300 uppercase font-bold block">Automated KMPL Calculation</span>
                  <span className="text-xs text-slate-300">
                    {fuelFormData.kmDrivenSinceLastFill} km ÷ {fuelFormData.fuelLiters || 1} L
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-yellow-400 font-mono">
                    {fuelFormData.fuelLiters > 0
                      ? (fuelFormData.kmDrivenSinceLastFill / fuelFormData.fuelLiters).toFixed(2)
                      : "0.00"}{" "}
                    <span className="text-xs font-sans text-amber-200">KMPL</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={fuelFormData.loggedByDriver}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, loggedByDriver: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fuel Bunk / Station</label>
                  <input
                    type="text"
                    value={fuelFormData.fuelStationName}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, fuelStationName: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Notes / Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Full tank filled before morning trip..."
                  value={fuelFormData.notes}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFuelModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Fuel className="w-4 h-4 text-slate-950" />
                  Save Refueling Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
