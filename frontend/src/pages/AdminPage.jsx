import { useState, useEffect } from "react";
import axios from "../axiosClient";

import {
  Users,
  Briefcase,
  Building2,
  FileText,
  Shield,
  Search,
  MoreVertical,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalCompanies: 0,
    totalApps: 0,
    usersByType: [],
    jobsByCategory: [],
    companiesByCity: [],
  });

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const ROLE_COLORS = {
    Administrator: "#f59e0b",
    Candidat: "#3b82f6",
    Companie: "#10b981",
  };

  useEffect(() => {
    axios.get("/api/users/admin/stats").then((res) => {
      setStats(res.data);
    });

    axios.get("/api/users/admin/users").then((res) => {
      setUsers(res.data);
      setLoading(false);
    });
  }, []);

  const filteredUsers = users.filter((u) =>
    (u.USERNAME ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const chartData = stats.usersByType.map((u) => ({
    type: u.TYPE,
    count: u.COUNT,
  }));

  const jobCategoryData = stats.jobsByCategory.map((j) => ({
    category: j.CATEGORY,
    count: j.COUNT,
  }));

  const companiesCityData = stats.companiesByCity.map((c) => ({
    city: c.CITY,
    count: c.COUNT,
  }));

  if (loading)
    return <div className="p-6 text-gray-600">Se încarcă datele...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-100 rounded-xl">
          <Shield className="w-8 h-8 text-amber-600" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">
            Monitorizează utilizatorii și platforma
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 lg:col-span-2">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm lg:text-lg">
                Utilizatori
              </span>
              <Users className="text-blue-500 w-5 h-5" />
            </div>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm lg:text-lg">Joburi</span>
              <Briefcase className="text-green-500 w-5 h-5" />
            </div>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm lg:text-lg">Companii</span>
              <Building2 className="text-purple-500 w-5 h-5" />
            </div>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm lg:text-lg">
                Aplicații
              </span>
              <FileText className="text-orange-500 w-5 h-5" />
            </div>
            <div className="text-2xl font-bold">{stats.totalApps}</div>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-4">
            Distribuție utilizatori
          </h2>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  labelLine={false}
                  dataKey="count"
                  nameKey="type"
                  outerRadius={100}
                  label={({ type, percent }) =>
                    `${type}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {stats.usersByType.map((u, i) => (
                    <Cell key={i} fill={ROLE_COLORS[u.TYPE] || "#999"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Joburi pe categorii</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={jobCategoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {jobCategoryData.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][
                      i % 5
                    ]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Companii pe orașe</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={companiesCityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="city" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          className="w-full border rounded-lg p-2 bg-white"
          placeholder="Caută utilizator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Utilizatori</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Nume</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Status</th>
              <th className="text-right p-3">Acțiuni</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{user.USERNAME}</td>

                <td>{user.EMAIL}</td>

                <td>
                  <span className="px-2 py-1 text-xs rounded bg-gray-200">
                    {user.ROLE}
                  </span>
                </td>

                <td>
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">
                    Active
                  </span>
                </td>

                <td className="text-right p-3">
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
