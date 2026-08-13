import React, { useState } from "react";
import {
  Printer,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Wifi,
  Usb,
  Bluetooth,
  HardDrive,
  QrCode,
  Radio,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Sliders,
  Check,
  MapPin,
  Search,
  User,
  Hash,
  Filter,
  Download,
  Globe,
  Compass,
  Wrench,
  Calendar,
  Clock,
  ClipboardList,
  UserCheck
} from "lucide-react";
import { PrintedDevice, DeviceType, MaintenanceRecord } from "../types";
import { SCHOOL_INFO } from "../data/mockData";
import { printFormattedContent } from "../utils/printHelper";
import { DeviceLocationMap } from "./DeviceLocationMap";

interface DeviceManagementProps {
  devices: PrintedDevice[];
  onAddDevice: (device: PrintedDevice) => void;
  onEditDevice: (device: PrintedDevice) => void;
  onDeleteDevice: (deviceId: string) => void;
}

export const DeviceManagement: React.FC<DeviceManagementProps> = ({
  devices,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<PrintedDevice | null>(null);
  const [testingDevice, setTestingDevice] = useState<PrintedDevice | null>(null);
  const [testPrintSuccess, setTestPrintSuccess] = useState<string | null>(null);

  // Map & View Mode state
  const [selectedDeviceIdForMap, setSelectedDeviceIdForMap] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"split" | "cards" | "map">("split");

  // Schedule Maintenance Modal State
  const [schedulingMaintenanceDevice, setSchedulingMaintenanceDevice] = useState<PrintedDevice | null>(null);
  const [maintDate, setMaintDate] = useState<string>("");
  const [maintNotes, setMaintNotes] = useState<string>("");
  const [maintTechnician, setMaintTechnician] = useState<string>("");
  const [maintCategory, setMaintCategory] = useState<string>("Routine Hardware Inspection");
  const [maintenanceSuccessMessage, setMaintenanceSuccessMessage] = useState<string | null>(null);

  const openScheduleMaintenanceModal = (dev: PrintedDevice) => {
    setSchedulingMaintenanceDevice(dev);
    if (dev.nextMaintenanceDate) {
      setMaintDate(dev.nextMaintenanceDate);
    } else {
      const future = new Date();
      future.setDate(future.getDate() + 14);
      setMaintDate(future.toISOString().slice(0, 10));
    }
    setMaintNotes(dev.maintenanceNotes || "");
    setMaintTechnician(dev.maintenanceTechnician || dev.assignedDriverName || "School Hardware Support Staff");
    setMaintCategory(dev.maintenanceCategory || "Routine Hardware Inspection");
  };

  const setQuickDateDaysFromNow = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setMaintDate(target.toISOString().slice(0, 10));
  };

  const handleSaveMaintenanceSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingMaintenanceDevice || !maintDate) return;

    const newRecord: MaintenanceRecord = {
      id: `MAINT-${Date.now()}`,
      nextCheckupDate: maintDate,
      notes: maintNotes.trim() || "Routine hardware checkup scheduled for school staff.",
      technicianName: maintTechnician.trim() || "School Staff",
      category: maintCategory,
      scheduledBy: "School Administration",
      scheduledAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: "Scheduled",
    };

    const existingHistory = schedulingMaintenanceDevice.maintenanceHistory || [];

    const updatedDevice: PrintedDevice = {
      ...schedulingMaintenanceDevice,
      nextMaintenanceDate: maintDate,
      maintenanceNotes: maintNotes.trim() || "Routine checkup scheduled for school staff.",
      maintenanceTechnician: maintTechnician.trim() || "School Staff",
      maintenanceCategory: maintCategory,
      maintenanceHistory: [newRecord, ...existingHistory.filter((h) => h.id !== newRecord.id)],
    };

    onEditDevice(updatedDevice);
    setMaintenanceSuccessMessage(
      `Maintenance check-up date & staff notes recorded for '${updatedDevice.name}' on ${maintDate}!`
    );
    setSchedulingMaintenanceDevice(null);
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "In-Transit">("All");

  // Add / Edit Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<DeviceType>("POS Thermal Receipt Printer");
  const [model, setModel] = useState("");
  const [connectionType, setConnectionType] = useState<
    "USB / OTG" | "Bluetooth Wireless" | "Network IP / Wi-Fi" | "Built-in Hardware"
  >("USB / OTG");
  const [portOrAddress, setPortOrAddress] = useState("");
  const [paperWidthMm, setPaperWidthMm] = useState<number>(80);
  const [status, setStatus] = useState<"Online & Ready" | "Printing / Active" | "Offline / Disconnected">("Online & Ready");
  const [isDefaultPrinter, setIsDefaultPrinter] = useState<boolean>(false);
  const [lastKnownLocation, setLastKnownLocation] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assignedDriverName, setAssignedDriverName] = useState("");

  const resetForm = () => {
    setName("");
    setType("POS Thermal Receipt Printer");
    setModel("");
    setConnectionType("USB / OTG");
    setPortOrAddress("");
    setPaperWidthMm(80);
    setStatus("Online & Ready");
    setIsDefaultPrinter(false);
    setLastKnownLocation("");
    setLatitude("");
    setLongitude("");
    setSerialNumber("");
    setAssignedDriverName("");
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (dev: PrintedDevice) => {
    setEditingDevice(dev);
    setName(dev.name);
    setType(dev.type);
    setModel(dev.model);
    setConnectionType(dev.connectionType);
    setPortOrAddress(dev.portOrAddress);
    setPaperWidthMm(dev.paperWidthMm || 80);
    setStatus(dev.status);
    setIsDefaultPrinter(!!dev.isDefaultPrinter);
    setLastKnownLocation(dev.lastKnownLocation || "");
    setLatitude(dev.latitude ? String(dev.latitude) : "");
    setLongitude(dev.longitude ? String(dev.longitude) : "");
    setSerialNumber(dev.serialNumber || "");
    setAssignedDriverName(dev.assignedDriverName || "");
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const deviceData: PrintedDevice = {
      id: editingDevice ? editingDevice.id : `DEV-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      type,
      model: model.trim() || "Generic Hardware Device",
      connectionType,
      portOrAddress: portOrAddress.trim() || "USB001",
      paperWidthMm: type === "POS Thermal Receipt Printer" ? paperWidthMm : undefined,
      status,
      lastTestedTime: "Just Now",
      isDefaultPrinter: type === "POS Thermal Receipt Printer" ? isDefaultPrinter : false,
      lastKnownLocation: lastKnownLocation.trim() || "Main School Administrative Block",
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      serialNumber: serialNumber.trim() || `SN-${Math.floor(1000 + Math.random() * 9000)}`,
      assignedDriverName: assignedDriverName.trim() || "Unassigned",
    };

    if (editingDevice) {
      onEditDevice(deviceData);
      setEditingDevice(null);
    } else {
      onAddDevice(deviceData);
      setShowAddModal(false);
    }
    resetForm();
  };

  const handleRunTestPrint = (dev: PrintedDevice) => {
    setTestingDevice(dev);
    setTestPrintSuccess(null);

    setTimeout(() => {
      setTestPrintSuccess(`Hardware print ping test sent to '${dev.name}' (${dev.portOrAddress})! Test slip compiled successfully.`);
    }, 800);
  };

  const getDeviceIcon = (devType: DeviceType) => {
    switch (devType) {
      case "POS Thermal Receipt Printer":
        return <Printer className="w-5 h-5 text-emerald-600" />;
      case "Van GPS Tracker":
        return <Radio className="w-5 h-5 text-blue-600" />;
      case "Camera QR Scanner":
        return <QrCode className="w-5 h-5 text-amber-600" />;
      case "RFID Student Card Reader":
        return <Zap className="w-5 h-5 text-purple-600" />;
    }
  };

  // Filtered devices array based on search query and status/mobility toggle
  const filteredDevices = devices.filter((dev) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      dev.name.toLowerCase().includes(query) ||
      dev.model.toLowerCase().includes(query) ||
      dev.portOrAddress.toLowerCase().includes(query) ||
      (dev.serialNumber && dev.serialNumber.toLowerCase().includes(query)) ||
      (dev.assignedDriverName && dev.assignedDriverName.toLowerCase().includes(query)) ||
      (dev.lastKnownLocation && dev.lastKnownLocation.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (statusFilter === "Active") {
      return dev.status === "Online & Ready" || dev.status === "Printing / Active";
    }
    if (statusFilter === "In-Transit") {
      return (
        dev.connectionType === "Bluetooth Wireless" ||
        dev.type === "Van GPS Tracker" ||
        (dev.lastKnownLocation && dev.lastKnownLocation.toLowerCase().includes("van"))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredDevices.length === 0) return;

    const headers = [
      "Device ID",
      "Device Name",
      "Device Type",
      "Model",
      "Connection Type",
      "Port / Address",
      "Paper Width (mm)",
      "Status",
      "Last Tested Time",
      "Is Default Printer",
      "Last Known Location",
      "Serial Number",
      "Assigned Operator / Driver"
    ];

    const rows = filteredDevices.map((dev) => [
      dev.id,
      dev.name,
      dev.type,
      dev.model,
      dev.connectionType,
      dev.portOrAddress,
      dev.paperWidthMm || "",
      dev.status,
      dev.lastTestedTime,
      dev.isDefaultPrinter ? "Yes" : "No",
      dev.lastKnownLocation || "",
      dev.serialNumber || "",
      dev.assignedDriverName || ""
    ]);

    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Wisdom_School_Devices_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-400/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-amber-400/30">
              Hardware & Printing Hub
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {devices.length} Devices Configured
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Printed Devices & POS Hardware Management
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
            Register thermal receipt printers, USB/Bluetooth slip printers, van GPS trackers, and RFID card scanners for {SCHOOL_INFO.name}.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          Add New Device / Printer
        </button>
      </div>

      {testPrintSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{testPrintSuccess}</span>
          </div>
          <button
            onClick={() => setTestPrintSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {maintenanceSuccessMessage && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>{maintenanceSuccessMessage}</span>
          </div>
          <button
            onClick={() => setMaintenanceSuccessMessage(null)}
            className="text-amber-800 hover:text-amber-950 font-bold p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Toggle Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by driver name, serial number, device model, port..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Buttons & Export CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setStatusFilter("All")}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === "All"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({devices.length})
            </button>
            <button
              onClick={() => setStatusFilter("Active")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                statusFilter === "Active"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Only
            </button>
            <button
              onClick={() => setStatusFilter("In-Transit")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                statusFilter === "In-Transit"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Radio className="w-3 h-3 text-amber-300" />
              In-Transit / Mobile
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredDevices.length === 0}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
            title="Export filtered hardware devices list to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            Export CSV ({filteredDevices.length})
          </button>
        </div>
      </div>

      {/* View Mode Mode Selection Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold text-xs tracking-wide">Interactive Device GPS Map View:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-2xl border border-slate-700 text-xs font-bold">
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              viewMode === "split"
                ? "bg-amber-400 text-slate-950 font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Split View (Map + Cards)
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              viewMode === "map"
                ? "bg-amber-400 text-slate-950 font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Map View Only
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              viewMode === "cards"
                ? "bg-amber-400 text-slate-950 font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Cards List Only
          </button>
        </div>
      </div>

      {/* INTEGRATED LEAFLET MAP VIEW (In Split or Map Mode) */}
      {(viewMode === "split" || viewMode === "map") && (
        <div className="animate-in fade-in duration-300">
          <DeviceLocationMap
            devices={filteredDevices}
            selectedDeviceId={selectedDeviceIdForMap || (filteredDevices[0]?.id || null)}
            onSelectDevice={(id) => setSelectedDeviceIdForMap(id)}
            onRunTestPrint={(dev) => handleRunTestPrint(dev)}
          />
        </div>
      )}

      {/* Devices Grid List (In Split or Cards Mode) */}
      {(viewMode === "split" || viewMode === "cards") && (
        <>
          {filteredDevices.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">No Matching Hardware Devices Found</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                No devices matched your search filter query "{searchQuery}". Try clearing your search or register a new device.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                }}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredDevices.map((dev) => {
                const isMapSelected = dev.id === selectedDeviceIdForMap;

                return (
                  <div
                    key={dev.id}
                    className={`bg-white rounded-3xl p-5 border shadow-sm transition hover:shadow-md flex flex-col justify-between space-y-4 ${
                      isMapSelected
                        ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/10"
                        : dev.isDefaultPrinter
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
                            {getDeviceIcon(dev.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                                {dev.name}
                              </h3>
                              {dev.isDefaultPrinter && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                                  Default Printer
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{dev.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(dev)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            title="Edit Device Configuration"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete '${dev.name}'?`)) {
                                onDeleteDevice(dev.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Delete Device"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Driver and Serial Tags */}
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        {dev.assignedDriverName && (
                          <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-100 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-[8px] uppercase text-blue-500 font-bold block">Assigned Operator</span>
                              <span className="text-blue-950 font-bold text-xs truncate block">{dev.assignedDriverName}</span>
                            </div>
                          </div>
                        )}

                        {dev.serialNumber && (
                          <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-100 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-[8px] uppercase text-amber-600 font-bold block">Serial No.</span>
                              <span className="text-amber-950 font-mono font-bold text-xs truncate block">{dev.serialNumber}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hardware Specs */}
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[9px] uppercase text-slate-400 font-bold block">
                            Model
                          </span>
                          <span className="text-slate-800 font-bold truncate block">{dev.model}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[9px] uppercase text-slate-400 font-bold block">
                            Connection Port
                          </span>
                          <span className="text-slate-800 font-bold truncate block">{dev.portOrAddress}</span>
                        </div>
                      </div>

                      {/* Last Known Location Tracking with Interactive Leaflet Map Trigger */}
                      {dev.lastKnownLocation && (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 mt-2 text-xs shadow-inner">
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
                            <div className="truncate">
                              <span className="text-[9px] uppercase text-slate-400 font-bold block">
                                Last Known Physical Location
                              </span>
                              <span className="text-amber-300 font-extrabold truncate block text-xs">
                                {dev.lastKnownLocation}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedDeviceIdForMap(dev.id);
                              if (viewMode === "cards") {
                                setViewMode("split");
                              }
                            }}
                            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-[10px] flex items-center gap-1 transition flex-shrink-0 cursor-pointer shadow"
                            title="View Last Known Location on Leaflet GPS Map"
                          >
                            <Compass className="w-3 h-3 text-slate-950" />
                            Locate on Map
                          </button>
                        </div>
                      )}

                      {/* Maintenance Check-up Status & Staff Notes Banner */}
                      <div className="mt-3">
                        {dev.nextMaintenanceDate ? (
                          <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 text-xs space-y-1.5 shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                                <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span>Check-up Date:</span>
                                <span className="bg-amber-200/80 text-amber-950 font-mono font-black px-2 py-0.5 rounded-lg text-[11px]">
                                  {dev.nextMaintenanceDate}
                                </span>
                              </div>

                              <span className="bg-amber-500/20 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-400/30">
                                {dev.maintenanceCategory || "Scheduled"}
                              </span>
                            </div>

                            {dev.maintenanceTechnician && (
                              <div className="text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                                <span>Staff / Tech: <strong>{dev.maintenanceTechnician}</strong></span>
                              </div>
                            )}

                            {dev.maintenanceNotes && (
                              <div className="bg-white/80 p-2 rounded-xl border border-amber-200/80 text-[11px] text-slate-700 font-normal leading-relaxed">
                                <span className="font-bold text-amber-900 block text-[10px] uppercase mb-0.5">Staff Inspection Notes:</span>
                                {dev.maintenanceNotes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-2.5 text-xs text-slate-500 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-[11px] font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              No future maintenance date scheduled
                            </span>
                            <button
                              type="button"
                              onClick={() => openScheduleMaintenanceModal(dev)}
                              className="text-amber-700 hover:text-amber-950 font-black text-[11px] hover:underline cursor-pointer"
                            >
                              + Schedule Date
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status and Paper Width */}
                      <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              dev.status === "Online & Ready"
                                ? "bg-emerald-500 animate-pulse"
                                : dev.status === "Printing / Active"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span className="text-slate-700">{dev.status}</span>
                        </div>

                        {dev.paperWidthMm && (
                          <span className="text-slate-500 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                            Paper: {dev.paperWidthMm}mm
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action & Maintenance Toolbar */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">Tested: {dev.lastTestedTime}</span>

                      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => openScheduleMaintenanceModal(dev)}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                          title="Schedule future maintenance check-up date & record staff notes"
                        >
                          <Wrench className="w-3.5 h-3.5 text-slate-950" />
                          Schedule Maintenance
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeviceIdForMap(dev.id);
                            setShowMapModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Open Map Modal View"
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          View Map
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRunTestPrint(dev)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-sm"
                          title="Run Hardware Ping Test / Thermal Print Slip"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-300" />
                          Test Print
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingDevice) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveDevice}
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingDevice ? "Edit Hardware Device" : "Register New Printed Device"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDevice(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Device Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cashier Counter Thermal Receipt Printer"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Driver / Operator</label>
                  <input
                    type="text"
                    value={assignedDriverName}
                    onChange={(e) => setAssignedDriverName(e.target.value)}
                    placeholder="e.g. M. Elumalai (Van 1)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Device Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-ZEB-8831-BT"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Device Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DeviceType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="POS Thermal Receipt Printer">POS Thermal Receipt Printer</option>
                    <option value="Van GPS Tracker">Van GPS Tracker</option>
                    <option value="Camera QR Scanner">Camera QR Scanner</option>
                    <option value="RFID Student Card Reader">RFID Student Card Reader</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Connection Type</label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="USB / OTG">USB / OTG Direct</option>
                    <option value="Bluetooth Wireless">Bluetooth Wireless</option>
                    <option value="Network IP / Wi-Fi">Network IP / Wi-Fi</option>
                    <option value="Built-in Hardware">Built-in Hardware</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hardware Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Epson TM-T88VI"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Port / Address</label>
                  <input
                    type="text"
                    value={portOrAddress}
                    onChange={(e) => setPortOrAddress(e.target.value)}
                    placeholder="e.g. COM3 / USB001 / 192.168.1.50"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Known Physical Location</label>
                <div className="relative mb-2">
                  <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={lastKnownLocation}
                    onChange={(e) => setLastKnownLocation(e.target.value)}
                    placeholder="e.g. Main Cashier Counter, Block A or Van TN 21 AV 4092"
                    className="w-full pl-9 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-xs"
                  />
                </div>

                {/* Location Presets */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className="text-slate-400 font-bold self-center">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLastKnownLocation("Main Cashier Counter, Administrative Block A");
                      setLatitude("12.3038");
                      setLongitude("79.8618");
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                  >
                    🏫 Admin Block
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLastKnownLocation("Transport Office / Van 1 Driver Kit");
                      setLatitude("12.3034");
                      setLongitude("79.8612");
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                  >
                    🚌 Transport Office
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLastKnownLocation("Wisdom School Entrance Gate #1");
                      setLatitude("12.3037");
                      setLongitude("79.8616");
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                  >
                    🚧 Gate #1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLastKnownLocation("Van TN 21 AV 4092 (Near Essur Bus Stop)");
                      setLatitude("12.3069");
                      setLongitude("79.8562");
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                  >
                    📍 Essur Stop
                  </button>
                </div>
              </div>

              {/* Explicit GPS Coordinates (Lat / Lng) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GPS Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 12.6492"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GPS Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. 79.5545"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold font-mono text-xs"
                  />
                </div>
              </div>

              {type === "POS Thermal Receipt Printer" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Thermal Paper Width</label>
                    <select
                      value={paperWidthMm}
                      onChange={(e) => setPaperWidthMm(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      <option value={80}>80mm Standard POS Paper</option>
                      <option value={58}>58mm Mini Portable Paper</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Set Default Printer</label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={isDefaultPrinter}
                        onChange={(e) => setIsDefaultPrinter(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      Default Receipt Printer
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDevice(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow"
              >
                {editingDevice ? "Save Changes" : "Register Device"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Test Print Slip Modal Simulation */}
      {testingDevice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-slate-900 text-sm">Thermal Test Slip Preview</span>
              <button onClick={() => setTestingDevice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Paper Card */}
            <div id="thermal-test-slip-card" className="bg-[#fef3c7]/40 border border-amber-200 p-4 rounded-2xl text-left font-mono text-[11px] text-slate-800 space-y-2 shadow-inner">
              <div className="text-center font-bold border-b border-dashed border-slate-400 pb-2">
                <p className="text-xs">{SCHOOL_INFO.name}</p>
                <p className="text-[9px] font-normal text-slate-600">{SCHOOL_INFO.location}</p>
                <p className="text-[10px] text-emerald-800 font-bold mt-1">*** HARDWARE TEST SLIP ***</p>
              </div>

              <div className="space-y-1 text-[10px]">
                <p>Device: {testingDevice.name}</p>
                <p>Serial: {testingDevice.serialNumber || "N/A"}</p>
                <p>Operator: {testingDevice.assignedDriverName || "N/A"}</p>
                <p>Port: {testingDevice.portOrAddress}</p>
                <p>Width: {testingDevice.paperWidthMm || 80}mm</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-400 py-1.5 text-center font-bold text-slate-900">
                PRINTER HARDWARE STATUS: OK
              </div>

              <p className="text-[9px] text-center text-slate-500 pt-1">
                Wisdom School POS Printer Subsystem Active
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const slipElement = document.getElementById("thermal-test-slip-card");
                  if (slipElement) {
                    printFormattedContent(
                      `Thermal_Test_Slip_${testingDevice.id}`,
                      `<div style="max-width: 300px; margin: 0 auto;">${slipElement.innerHTML}</div>`
                    );
                  } else {
                    window.focus();
                    window.print();
                  }
                  setTestPrintSuccess(`Test slip sent to ${testingDevice.name} at ${new Date().toLocaleTimeString()}`);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                Send Real Print Command
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {schedulingMaintenanceDevice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveMaintenanceSchedule}
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl border border-amber-200">
                  <Wrench className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    Schedule Device Maintenance
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
                    {schedulingMaintenanceDevice.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingMaintenanceDevice(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Device Context Summary */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Hardware ID: {schedulingMaintenanceDevice.id}</span>
                <span className="text-amber-400 font-bold text-[10px] uppercase">{schedulingMaintenanceDevice.type}</span>
              </div>
              <div className="font-bold text-amber-200">{schedulingMaintenanceDevice.model}</div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>📍 Location: <strong>{schedulingMaintenanceDevice.lastKnownLocation || "School Campus"}</strong></span>
                <span>👤 Operator: <strong>{schedulingMaintenanceDevice.assignedDriverName || "Unassigned"}</strong></span>
              </div>
            </div>

            {/* Form Controls */}
            <div className="space-y-3.5 text-xs">
              {/* Next Checkup Date & Quick Selectors */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-900 font-extrabold">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Future Check-up Date *
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Select date for routine inspection</span>
                </label>

                <input
                  type="date"
                  required
                  value={maintDate}
                  onChange={(e) => setMaintDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 bg-slate-50 text-sm"
                />

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDateDaysFromNow(7)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateDaysFromNow(14)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    +2 Weeks
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateDaysFromNow(30)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    +1 Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateDaysFromNow(90)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
                  >
                    +3 Months
                  </button>
                </div>
              </div>

              {/* Maintenance Category & Assigned Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maintenance Type / Category</label>
                  <select
                    value={maintCategory}
                    onChange={(e) => setMaintCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800"
                  >
                    <option value="Routine Hardware Inspection">Routine Hardware Inspection</option>
                    <option value="Thermal Head & Cutter Servicing">Thermal Head & Cutter Servicing</option>
                    <option value="Battery Calibration & Bluetooth Test">Battery Calibration & Bluetooth Test</option>
                    <option value="GPS Module & NavIC Telematics Test">GPS Module & NavIC Telematics Test</option>
                    <option value="RFID Reader & Waterproof Enclosure Test">RFID Reader & Waterproof Enclosure Test</option>
                    <option value="Firmware & Network Connectivity Sync">Firmware & Network Connectivity Sync</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Technician / Staff</label>
                  <input
                    type="text"
                    value={maintTechnician}
                    onChange={(e) => setMaintTechnician(e.target.value)}
                    placeholder="e.g. Mr. Rajesh (School IT Desk)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Staff Instructions & Maintenance Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                  Notes & Guidelines for School Staff
                </label>
                <textarea
                  rows={3}
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  placeholder="Record detailed instructions, required replacement spare parts (e.g. thermal paper rolls, Li-ion batteries), known issues, or guidelines for school staff during check-up..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-xs leading-relaxed text-slate-800"
                />
              </div>

              {/* Historical Maintenance Log List */}
              {schedulingMaintenanceDevice.maintenanceHistory && schedulingMaintenanceDevice.maintenanceHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-slate-800 text-xs block mb-1.5">
                    Previous Maintenance Log History ({schedulingMaintenanceDevice.maintenanceHistory.length})
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {schedulingMaintenanceDevice.maintenanceHistory.map((log) => (
                      <div key={log.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>📅 {log.nextCheckupDate} • {log.category || "Inspection"}</span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono font-bold">
                            {log.status || "Completed"}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium line-clamp-2">{log.notes}</p>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          Tech: {log.technicianName} ({log.scheduledAt})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSchedulingMaintenanceDevice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition shadow cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-slate-950" />
                Save Maintenance Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Standalone Map Modal Popup */}
      {showMapModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 w-full max-w-5xl max-h-[90vh] flex flex-col space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400 animate-spin-slow" />
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg">
                    Live Hardware GPS Location Map
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Real-time spatial visualization and telemetry overlay for hardware fleet
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMapModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-[400px] overflow-hidden rounded-2xl">
              <DeviceLocationMap
                devices={filteredDevices}
                selectedDeviceId={selectedDeviceIdForMap || (filteredDevices[0]?.id || null)}
                onSelectDevice={(id) => setSelectedDeviceIdForMap(id)}
                onRunTestPrint={(dev) => {
                  setShowMapModal(false);
                  handleRunTestPrint(dev);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
