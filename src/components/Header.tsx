import React from "react";
import { Phone, MessageSquare, ShieldCheck, Bus, MapPin, Sparkles, Navigation } from "lucide-react";
import { SCHOOL_INFO } from "../data/mockData";
import { SchoolInfo } from "../types";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAIHelp: () => void;
  schoolInfo?: SchoolInfo;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenAIHelp, schoolInfo = SCHOOL_INFO }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner with Contact Person */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-4 py-2 border-b border-blue-800/40 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600/80 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] tracking-wide uppercase">
              Official Transport Portal
            </span>
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {schoolInfo.location}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-200 font-medium">
            <span className="hidden md:inline text-slate-300">
              Chief Officer: <strong className="text-white">{schoolInfo.contactPerson}</strong>
            </span>
            <a
              href={`tel:${schoolInfo.contactPhone}`}
              className="flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white px-3 py-1 rounded-md text-xs font-semibold transition shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              Call {schoolInfo.contactPerson} ({schoolInfo.contactPhone})
            </a>
            <a
              href={`https://wa.me/91${schoolInfo.contactPhone}?text=Hello%20${encodeURIComponent(schoolInfo.contactPerson)},%20I%20have%20a%20query%20regarding%20${encodeURIComponent(schoolInfo.name)}%20van%20transport.`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-green-600/90 hover:bg-green-500 text-white px-3 py-1 rounded-md text-xs font-semibold transition shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Crest Avatar Container */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-200 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-blue-950 rounded-full flex flex-col items-center justify-center text-center p-1 border border-yellow-400/50">
                <Bus className="w-6 h-6 text-yellow-400" />
                <span className="text-[8px] font-black tracking-widest text-white uppercase">ESSUR</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-slate-900 shadow">
              <ShieldCheck className="w-2.5 h-2.5" />
              Live
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none flex items-center gap-2">
              {schoolInfo.name}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-amber-400 tracking-wider mt-1 uppercase flex items-center gap-2">
              <span>"{schoolInfo.motto}"</span>
              <span className="text-slate-400 font-normal">| Fleet & Student Transport Management System</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons & AI Assistant Launcher */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={onOpenAIHelp}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-indigo-900/30 border border-indigo-400/30"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            Wisdom AI Helpdesk
          </button>

          <a
            href={`#parent-portal`}
            onClick={() => setActiveTab("parent")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-md"
          >
            <Navigation className="w-4 h-4" />
            Parent Mobile App
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800 pt-2 pb-1 text-xs sm:text-sm font-semibold min-w-max">
          <button
            onClick={() => setActiveTab("parent")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "parent"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>📱 Parent Mobile Dashboard</span>
            <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              Live Tracker
            </span>
          </button>

          <button
            onClick={() => setActiveTab("fleet")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "fleet"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>🚍 Fleet & Van Locations</span>
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "students"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>🎓 Student RFID Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "billing"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>💰 Automated Fees & UPI Billing</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "notifications"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>📱 Bulk SMS & WhatsApp Status</span>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              Meta/DLT
            </span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "analytics"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>📊 Attendance & Fee Analytics</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              6-Mo Trends
            </span>
          </button>

          <button
            onClick={() => setActiveTab("routes")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "routes"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>🗺️ Route Optimizer & Delay Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("drivers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "drivers"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>👨‍✈️ Driver Roster</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "profile"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>🏫 School Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === "devices"
                ? "bg-slate-800 text-yellow-400 border-yellow-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent"
            }`}
          >
            <span>🖨️ Hardware & Printed Devices</span>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              POS/GPS
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};

