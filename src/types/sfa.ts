export type MasterItemRecord = {
  _id: string;
  type: string;
  name: string;
  code: string;
  description: string;
  value: number | null;
  parent: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date | string;
};

export type DoctorRecord = {
  _id: string;
  doctorCode: string;
  prefix: string;
  name: string;
  hospitalName: string;
  gender: "male" | "female" | "other" | "";
  contactNo: string;
  email: string;
  dateOfBirth: string;
  anniversary: string;
  maritalStatus: string;
  qualification: string;
  registrationNumber: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  clinicAddress: string;
  division: string;
  zone: string;
  speciality: string;
  category: string;
  doctorType: string;
  approxBusiness: string;
  assignedEmployees: string[];
  firms: string[];
  isActive: boolean;
  createdAt?: Date | string;
};

export type EmployeeRecord = {
  _id: string;
  code: string;
  name: string;
  email: string;
  contactNo: string;
  workType: string;
  assignTo: string;
  city: string;
  state: string;
  address: string;
  division: string;
  zone: string;
  designation: string;
  dateOfBirth: string;
  dateOfJoin: string;
  dateOfResignation: string;
  reportingTo: string;
  inactiveDate: string;
  inactiveReason: string;
  isActive: boolean;
  createdAt?: Date | string;
};

export type FirmRecord = {
  _id: string;
  firmCode: string;
  name: string;
  firmType: string;
  firmCategory: string;
  contactPerson: string;
  contactNo: string;
  email: string;
  city: string;
  district: string;
  state: string;
  zone: string;
  division: string;
  additionalDivisions: string[];
  address: string;
  pincode: string;
  assignedEmployees: string[];
  firstLevelManager: string;
  secondLevelManager: string;
  thirdLevelManager: string;
  dateOfBirth: string;
  approxBusiness: string;
  transportType: string;
  distributorCode: string;
  stockistCode: string;
  customerCode: string;
  gstin: string;
  panNumber: string;
  drugLicenseNumber: string;
  foodLicenseNumber: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifsc: string;
  isActive: boolean;
  createdAt?: Date | string;
};

export type VisitStatus = "planned" | "closed" | "skipped" | "open";

export type VisitRecord = {
  _id: string;
  visitCode: string;
  visitType: "doctor" | "firm";
  doctor: string;
  firm: string;
  clinicAddress: string;
  city: string;
  zone: string;
  division: string;
  employeeName: string;
  visitDate: string;
  callObjective: string;
  postCallInfo: string;
  remarks: string;
  products: string[];
  samples: string[];
  gifts: string[];
  pobValue: number | null;
  skippedReason: string;
  status: VisitStatus;
  createdAt?: Date | string;
};

export type ExpenseStatus = "pending" | "approved" | "rejected";

export type ExpenseRecord = {
  _id: string;
  employeeName: string;
  zone: string;
  division: string;
  expenseDate: string;
  head: string;
  modeOfTravel: string;
  fromCity: string;
  toCity: string;
  distanceKm: number | null;
  fare: number | null;
  otherAmount: number | null;
  totalAmount: number;
  remarks: string;
  status: ExpenseStatus;
  reviewedBy: string;
  reviewedAt?: Date | string;
  createdAt?: Date | string;
};

export type LeaveStatus = "pending" | "approved" | "rejected";

export type LeaveRecord = {
  _id: string;
  employeeName: string;
  zone: string;
  leaveType: string;
  reason: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: LeaveStatus;
  reviewedBy: string;
  reviewedAt?: Date | string;
  createdAt?: Date | string;
};

export type HolidayRecord = {
  _id: string;
  calendarType: "holiday" | "work" | "restricted";
  zone: string;
  employeeName: string;
  date: string;
  occasion: string;
  createdAt?: Date | string;
};

export type OrderStatus = "draft" | "placed" | "approved" | "dispatched" | "cancelled";

export type OrderLine = {
  product: string;
  quantity: number;
  rate: number;
  discount: number;
  amount: number;
};

export type OrderRecord = {
  _id: string;
  orderNo: string;
  orderDate: string;
  firm: string;
  doctor: string;
  employeeName: string;
  zone: string;
  division: string;
  lines: OrderLine[];
  totalQuantity: number;
  totalAmount: number;
  status: OrderStatus;
  remarks: string;
  createdAt?: Date | string;
};

export type TargetRecord = {
  _id: string;
  targetType:
    | "employee"
    | "hq"
    | "product"
    | "doctor"
    | "firm"
    | "product-group"
    | "yearly";
  subject: string;
  employeeName: string;
  frequency: "monthly" | "quarterly" | "yearly";
  month: string;
  quarter: string;
  year: string;
  pobValue: number | null;
  secondarySales: number | null;
  doctorVisits: number | null;
  chemistVisits: number | null;
  newDoctorAddition: number | null;
  newChemistAddition: number | null;
  primarySalesValue: number | null;
  primarySalesQty: number | null;
  createdAt?: Date | string;
};

export type ReminderRecord = {
  _id: string;
  title: string;
  date: string;
  assignedTo: string;
  notes: string;
  status: "open" | "done";
  createdAt?: Date | string;
};

export type SupportTicketRecord = {
  _id: string;
  ticketNo: string;
  subject: string;
  description: string;
  raisedBy: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "resolved" | "closed";
  response: string;
  createdAt?: Date | string;
};

export type FareChartRecord = {
  _id: string;
  routeName: string;
  citiesInRoute: string;
  zone: string;
  division: string;
  routeFor: string;
  designation: string;
  mode: string;
  distanceKm: number | null;
  fare: number | null;
  isApproved: boolean;
  createdAt?: Date | string;
};
