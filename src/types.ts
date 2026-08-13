export interface SchoolInfo {
  name: string;
  location: string;
  motto: string;
  contactPerson: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  upiName: string;
  upiId: string;
  establishedYear: string;
  totalStudents: number;
  transportFleetCount: number;
}

export type VehicleType = "Van (14-Seater)" | "Force Traveller (20-Seater)" | "Mini Bus (26-Seater)" | "School Bus (40-Seater)";

export type AttendanceStatus = "Boarded Pickup" | "Dropped at School" | "Boarded Return" | "Dropped Home" | "Absent";

export type PaymentStatus = "Paid" | "Pending" | "Partially Paid" | "Overdue";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  experienceYears: number;
  rating: number;
  status: "Active" | "On Break" | "Off Duty";
  assignedVehicleId: string;
}

export interface RouteStop {
  id: string;
  stopName: string;
  landmark: string;
  scheduledTimeMorning: string;
  scheduledTimeEvening: string;
  distanceFromSchoolKm: number;
  latitude: number;
  longitude: number;
  studentsCount: number;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  capacity: number;
  currentOccupancy: number;
  driverId: string;
  driverName: string;
  driverPhone: string;
  routeName: string;
  currentStopIndex: number;
  speedKmH: number;
  fuelLevelPercent: number;
  status: "In Transit" | "At School" | "At Stop" | "Maintenance" | "Idle";
  currentLat: number;
  currentLng: number;
  stops: RouteStop[];
  baseFeePerKm: number;
  multiplier: number;
}

export type StudentDocumentCategory = "Transport ID Card" | "Medical Record / Fitness" | "Vaccination / Allergy Form" | "Aadhaar / Birth Certificate" | "Emergency Form";

export interface StudentDocument {
  id: string;
  title: string;
  category: StudentDocumentCategory;
  dataUrl: string;
  capturedAt: string;
  notes?: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  grade: string; // e.g. LKG, UKG, Grade I, Grade II
  parentName: string;
  parentPhone: string;
  address: string;
  pickupStopName: string;
  distanceKm: number;
  assignedVehicleId: string;
  assignedRouteName: string;
  tuitionFeePerTerm: number;
  transportFeePerMonth: number;
  paymentStatus: PaymentStatus;
  lastPaymentDate?: string;
  dueDate?: string;
  balanceRemaining?: number;
  lastUtrNumber?: string;
  attendanceStatus: AttendanceStatus;
  lastStatusTime: string;
  rfidTagId: string;
  latitude?: number;
  longitude?: number;
  documents?: StudentDocument[];
}

export interface NotificationLog {
  id: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  message: string;
  timestamp: string;
  type: "SMS" | "WhatsApp";
  status: "Delivered" | "Sent" | "Failed" | "Pending";
  failureReason?: string;
  category?: "Fee Reminder" | "Boarding Alert" | "Attendance" | "Emergency" | "General Broadcast";
  channelCost?: number;
  carrierName?: string;
  deliveredAt?: string;
  grade?: string;
  routeName?: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  schoolName: string;
  address: string;
  motto: string;
  contactPerson: string;
  upiId: string;
  studentId: string;
  studentName: string;
  grade: string;
  parentName: string;
  amountPaid: number;
  tuitionFeePart: number;
  transportFeePart: number;
  utrNumber: string;
  paymentMethod: string;
  feeType: string;
  paymentDate: string;
  status: string;
}

export interface FeeSlab {
  minKm: number;
  maxKm: number;
  monthlyFee: number;
}

export type DeviceType = "POS Thermal Receipt Printer" | "Van GPS Tracker" | "Camera QR Scanner" | "RFID Student Card Reader";

export interface MaintenanceRecord {
  id: string;
  nextCheckupDate: string;
  notes: string;
  technicianName?: string;
  category?: string;
  scheduledBy?: string;
  scheduledAt: string;
  status?: "Scheduled" | "Completed" | "Pending";
}

export type FeedbackCategory =
  | "Safety & Driving"
  | "Punctuality"
  | "Vehicle Cleanliness"
  | "Staff Courtesy"
  | "General Feedback";

export interface TransportFeedback {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  vehicleId: string;
  routeName: string;
  driverName: string;
  rating: number; // 1 to 5
  category: FeedbackCategory;
  comments: string;
  submittedAt: string;
}

export interface PrintedDevice {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  connectionType: "USB / OTG" | "Bluetooth Wireless" | "Network IP / Wi-Fi" | "Built-in Hardware";
  portOrAddress: string;
  paperWidthMm?: number;
  status: "Online & Ready" | "Printing / Active" | "Offline / Disconnected";
  lastTestedTime: string;
  isDefaultPrinter?: boolean;
  lastKnownLocation?: string;
  latitude?: number;
  longitude?: number;
  serialNumber?: string;
  assignedDriverName?: string;
  nextMaintenanceDate?: string;
  maintenanceNotes?: string;
  maintenanceTechnician?: string;
  maintenanceCategory?: string;
  maintenanceHistory?: MaintenanceRecord[];
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  registrationNumber: string;
  date: string;
  odometerKm: number;
  fuelLiters: number;
  totalCostRs: number;
  kmDrivenSinceLastFill: number;
  calculatedKmpl: number;
  fuelType: "Diesel" | "CNG" | "Petrol";
  loggedByDriver: string;
  fuelStationName: string;
  notes?: string;
}
