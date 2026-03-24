import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  TrendingUp,
  Users,
  Briefcase,
  MapPin,
  Globe,
  Mail,
  Phone,
} from "lucide-react";

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeJobs = [
    {
      id: 1,
      title: "Senior Software Engineer",
      applicants: 45,
      posted: "2 days ago",
    },
    { id: 2, title: "Product Manager", applicants: 32, posted: "1 week ago" },
    { id: 3, title: "UX Designer", applicants: 28, posted: "3 days ago" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header replacement */}
      <header className="bg-white shadow p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Placeholder company logo */}
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-xs">Logo</span>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                TechCorp Inc.
              </h1>
              <p className="text-gray-600 mb-4">
                Leading technology company building innovative solutions for the
                modern world
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4" />
                  <span>500-1000 employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="size-4" />
                  <a href="#" className="text-blue-600 hover:underline">
                    www.techcorp.com
                  </a>
                </div>
              </div>
            </div>

            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Edit Company Info
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex flex-col items-center gap-3 p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="size-8" />
                  <span className="font-semibold">Create New Job</span>
                </button>

                <button
                  onClick={() => navigate("/promote-job")}
                  className="flex flex-col items-center gap-3 p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <TrendingUp className="size-8" />
                  <span className="font-semibold">Promote a Job</span>
                </button>

                <button
                  onClick={() => navigate("/candidate-match")}
                  className="flex flex-col items-center gap-3 p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Users className="size-8" />
                  <span className="font-semibold">Get Candidate Match</span>
                </button>
              </div>
            </div>

            {/* Active Job Postings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Active Job Postings
                </h2>
                <span className="text-sm text-gray-500">
                  {activeJobs.length} active
                </span>
              </div>
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="size-4" />
                            <span>{job.applicants} applicants</span>
                          </div>
                          <span>Posted {job.posted}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                          Edit
                        </button>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About Us</h2>
              <p className="text-gray-700 mb-4">
                TechCorp Inc. is a pioneering technology company dedicated to
                creating innovative solutions that shape the future. With over a
                decade of experience, we've built a reputation for excellence in
                software development, cloud computing, and artificial
                intelligence.
              </p>
              <p className="text-gray-700">
                Our team of talented professionals works collaboratively to
                deliver cutting-edge products and services to clients worldwide.
                We believe in fostering a culture of innovation, continuous
                learning, and work-life balance.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Company Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">Total Jobs Posted</span>
                    <span className="font-semibold text-blue-600">24</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: "80%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">Total Applicants</span>
                    <span className="font-semibold text-blue-600">328</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">Hires This Month</span>
                    <span className="font-semibold text-blue-600">8</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: "40%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="size-5 text-gray-400" />
                  <span className="text-sm">careers@techcorp.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="size-5 text-gray-400" />
                  <span className="text-sm">+1 (555) 987-6543</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="size-5 text-gray-400" />
                  <span className="text-sm">
                    123 Tech Street, San Francisco, CA 94105
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple modal placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create Job (Placeholder)</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
