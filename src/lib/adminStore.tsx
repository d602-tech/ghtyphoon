import { createContext, useContext, useState, ReactNode } from "react";
import { SiteRecord, OfficeRecord, siteRecords as initialSites, officeRecords as initialOffices } from "./mockData";

/* ===================== PERSONNEL TYPES ===================== */
export interface Personnel {
  id: string;
  name: string;
  role: "contractor" | "dept_manager" | "admin";
  department: string;
  phone: string;
  email: string;
  assignedProjects: string[]; // project ids
}

export interface DataEntry {
  id: string;
  projectId: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  data: Partial<SiteRecord>;
}

/* ===================== INITIAL DATA ===================== */
const initialPersonnel: Personnel[] = [
  { id: "p1", name: "王大明", role: "dept_manager", department: "北區工程處", phone: "0912-345-678", email: "wang@example.com", assignedProjects: ["1", "4"] },
  { id: "p2", name: "張美玲", role: "dept_manager", department: "南區工程處", phone: "0923-456-789", email: "zhang@example.com", assignedProjects: ["2"] },
  { id: "p3", name: "李承恩", role: "dept_manager", department: "中區工程處", phone: "0934-567-890", email: "li@example.com", assignedProjects: ["3"] },
  { id: "p4", name: "大陸工程公司", role: "contractor", department: "北區工程處", phone: "02-2345-6789", email: "contractor1@example.com", assignedProjects: ["1"] },
  { id: "p5", name: "榮工工程公司", role: "contractor", department: "南區工程處", phone: "07-3456-7890", email: "contractor2@example.com", assignedProjects: ["2"] },
  { id: "p6", name: "系統管理員", role: "admin", department: "總部行政處", phone: "02-1234-5678", email: "admin@example.com", assignedProjects: [] },
];

const initialEntries: DataEntry[] = [
  { id: "e1", projectId: "1", submittedBy: "p4", submittedAt: new Date(Date.now() - 2 * 3600000).toISOString(), status: "approved", reviewedBy: "p1", reviewedAt: new Date(Date.now() - 1 * 3600000).toISOString(), data: {} },
  { id: "e2", projectId: "2", submittedBy: "p5", submittedAt: new Date(Date.now() - 30 * 3600000).toISOString(), status: "pending", data: {} },
];

/* ===================== STORE CONTEXT ===================== */
interface AdminStore {
  sites: SiteRecord[];
  setSites: React.Dispatch<React.SetStateAction<SiteRecord[]>>;
  offices: OfficeRecord[];
  setOffices: React.Dispatch<React.SetStateAction<OfficeRecord[]>>;
  personnel: Personnel[];
  setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
  entries: DataEntry[];
  setEntries: React.Dispatch<React.SetStateAction<DataEntry[]>>;
}

const AdminContext = createContext<AdminStore | null>(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be inside AdminProvider");
  return ctx;
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [sites, setSites] = useState<SiteRecord[]>([...initialSites]);
  const [offices, setOffices] = useState<OfficeRecord[]>([...initialOffices]);
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [entries, setEntries] = useState<DataEntry[]>(initialEntries);

  return (
    <AdminContext.Provider value={{ sites, setSites, offices, setOffices, personnel, setPersonnel, entries, setEntries }}>
      {children}
    </AdminContext.Provider>
  );
};
