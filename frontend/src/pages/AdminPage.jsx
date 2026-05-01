import { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  FileText,
  Shield,
  Search,
} from "lucide-react";
import axios from "../axiosClient";

export default function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalCompanies: 0,
    totalApps: 0,
    usersByType: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/users/admin/stats")
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading) return <div className="p-6">Se încarcă datele...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Admin Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 rounded-lg">
          <Shield className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panou Administrare</h1>
          <p className="text-gray-600">
            Monitorizează activitatea platformei și gestionează statisticile
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total Utilizatori", value: stats.totalUsers, icon: <Users className="w-4 h-4 text-blue-600" /> },
          { title: "Joburi Active", value: stats.totalJobs, icon: <Briefcase className="w-4 h-4 text-green-600" /> },
          { title: "Companii", value: stats.totalCompanies, icon: <Building2 className="w-4 h-4 text-purple-600" /> },
          { title: "Total Aplicații", value: stats.totalApps, icon: <FileText className="w-4 h-4 text-orange-600" /> },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{card.title}</span>
              {card.icon}
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
