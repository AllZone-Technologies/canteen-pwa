import { AdminProvider } from "../context/admin-context";

export default function AdminWrapper({ children }) {
  return <AdminProvider>{children}</AdminProvider>;
}
