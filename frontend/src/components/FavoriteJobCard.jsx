import { MapPin, Briefcase, Trash2 } from "lucide-react";

export function FavoriteJobCard({ job, onDelete, onView, onNavigate }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow flex items-start justify-between cursor-pointer">
      <div className="flex-1" onClick={onNavigate}>
        <h3 className="font-semibold text-gray-900 mb-1">{job.TITLU}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {job.DENUMIRE_COMPANIE && (
            <div className="flex items-center gap-1">
              <Briefcase className="size-4" />
              <span>{job.DENUMIRE_COMPANIE}</span>
            </div>
          )}
          {job.LOCATIE && (
            <div className="flex items-center gap-1">
              <MapPin className="size-4" />
              <span>{job.LOCATIE}</span>
            </div>
          )}
          {job.DATA_POSTARII && (
            <span>
              Posted:{" "}
              {new Date(job.DATA_POSTARII).toLocaleDateString("ro-RO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={onView}
        >
          Vezi
        </button>
        <button
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
          onClick={onDelete}
        >
          <Trash2 className="size-4" /> Șterge
        </button>
      </div>
    </div>
  );
}
