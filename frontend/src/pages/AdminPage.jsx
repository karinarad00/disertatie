import { useState } from "react";
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  FileText,
  Shield,
  Search,
  MoreVertical,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const monthlyData = [
  { month: "Jan", users: 120, jobs: 45, applications: 340 },
  { month: "Feb", users: 180, jobs: 67, applications: 520 },
  { month: "Mar", users: 250, jobs: 89, applications: 780 },
  { month: "Apr", users: 310, jobs: 112, applications: 950 },
  { month: "May", users: 420, jobs: 145, applications: 1240 },
  { month: "Jun", users: 530, jobs: 178, applications: 1580 },
];

const userTypeData = [
  { name: "Job Seekers", value: 1850, color: "#3b82f6" },
  { name: "Companies", value: 425, color: "#10b981" },
  { name: "Admins", value: 12, color: "#f59e0b" },
];

const jobCategoryData = [
  { category: "Technology", count: 245 },
  { category: "Healthcare", count: 189 },
  { category: "Finance", count: 156 },
  { category: "Education", count: 134 },
  { category: "Marketing", count: 98 },
  { category: "Other", count: 87 },
];

const mockUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    type: "Job Seeker",
    registeredDate: "2025-12-15",
    status: "Active",
    applications: 12,
  },
  {
    id: 2,
    name: "Tech Corp Inc.",
    email: "hr@techcorp.com",
    type: "Company",
    registeredDate: "2025-11-20",
    status: "Active",
    jobsPosted: 8,
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "m.chen@email.com",
    type: "Job Seeker",
    registeredDate: "2026-01-05",
    status: "Active",
    applications: 5,
  },
  {
    id: 4,
    name: "Global Solutions Ltd",
    email: "contact@globalsolutions.com",
    type: "Company",
    registeredDate: "2025-10-12",
    status: "Active",
    jobsPosted: 15,
  },
  {
    id: 5,
    name: "Emma Williams",
    email: "emma.w@email.com",
    type: "Job Seeker",
    registeredDate: "2026-02-14",
    status: "Inactive",
    applications: 0,
  },
  {
    id: 6,
    name: "Innovation Hub",
    email: "jobs@innovationhub.com",
    type: "Company",
    registeredDate: "2025-09-08",
    status: "Active",
    jobsPosted: 23,
  },
  {
    id: 7,
    name: "David Martinez",
    email: "d.martinez@email.com",
    type: "Job Seeker",
    registeredDate: "2026-01-22",
    status: "Active",
    applications: 18,
  },
  {
    id: 8,
    name: "Healthcare Plus",
    email: "hr@healthcareplus.com",
    type: "Company",
    registeredDate: "2025-12-03",
    status: "Active",
    jobsPosted: 11,
  },
];

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("all");

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedUserType === "all" || user.type === selectedUserType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Admin Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 rounded-lg">
          <Shield className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage users, monitor statistics, and oversee platform activity
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Total Users",
            value: "2,287",
            icon: <Users className="w-4 h-4 text-blue-600" />,
            growth: "+12.5%",
          },
          {
            title: "Active Jobs",
            value: "636",
            icon: <Briefcase className="w-4 h-4 text-green-600" />,
            growth: "+8.2%",
          },
          {
            title: "Companies",
            value: "425",
            icon: <Building2 className="w-4 h-4 text-purple-600" />,
            growth: "+5.7%",
          },
          {
            title: "Applications",
            value: "5,413",
            icon: <FileText className="w-4 h-4 text-orange-600" />,
            growth: "+15.3%",
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{card.title}</span>
              {card.icon}
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {card.growth} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold mb-2">Growth Overview</h2>
          <p className="text-gray-600 mb-4">
            Monthly user and job growth trends
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" />
              <Line type="monotone" dataKey="jobs" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold mb-2">User Distribution</h2>
          <p className="text-gray-600 mb-4">Breakdown by user type</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userTypeData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {userTypeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">User Management</h2>
          <span className="bg-gray-200 px-3 py-1 rounded">
            {mockUsers.length} Users
          </span>
        </div>

        <div className="flex justify-between mb-2">
          <select
            value={selectedUserType}
            onChange={(e) => setSelectedUserType(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="all">All Users</option>
            <option value="Job Seeker">Job Seekers</option>
            <option value="Company">Companies</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border pl-8 px-2 py-1 rounded"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-1">Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Activity</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-1 font-medium">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.type}</td>
                <td>{user.registeredDate}</td>
                <td>{user.status}</td>
                <td>
                  {user.type === "Job Seeker"
                    ? `${user.applications} applications`
                    : `${user.jobsPosted} jobs posted`}
                </td>
                <td className="text-right">
                  <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100">
                    Actions
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
