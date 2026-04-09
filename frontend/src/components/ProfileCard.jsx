import { Mail, Phone, MapPin, Briefcase } from "lucide-react";
import ImageWithFallback from "./ImageWithFallback";

export function ProfileCard({ user, favoriteJobsCount, onEdit }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <ImageWithFallback
          src={user.imagine_profil || "https://via.placeholder.com/150"}
          alt="Imagine profil"
          className="w-40 h-40 object-cover rounded-full mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
        <p className="text-gray-600">{user.email}</p>
        <p className="text-gray-600">{user.role}</p>

        <div className="space-y-3 border-t mt-4 pt-4 text-gray-700">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-gray-400" />
            <span className="text-sm">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3">
              <Phone className="size-5 text-gray-400" />
              <span className="text-sm">{user.phone}</span>
            </div>
          )}
          {user.location && (
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-gray-400" />
              <span className="text-sm">{user.location}</span>
            </div>
          )}
          {user.experience && (
            <div className="flex items-center gap-3">
              <Briefcase className="size-5 text-gray-400" />
              <span className="text-sm">{user.experience} experience</span>
            </div>
          )}
        </div>

        <button
          className="w-full mt-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          onClick={onEdit}
        >
          Editează Profil
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Profile Views</span>
            <span className="font-semibold text-blue-600">
              {user.views || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Applications</span>
            <span className="font-semibold text-blue-600">
              {user.applications || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Saved Jobs</span>
            <span className="font-semibold text-blue-600">
              {favoriteJobsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
