import { FavoriteJobCard } from "./FavoriteJobCard";

export function FavoriteJobsList({ jobs, handleDelete, navigate }) {
  if (jobs.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Joburi Salvate</h2>
      <div className="space-y-4">
        {jobs.map((job) => (
          <FavoriteJobCard
            key={job.ID_JOB}
            job={job}
            onDelete={() => handleDelete(job.ID_JOB)}
            onView={() => navigate(`/job/${job.ID_JOB}`)}
            onNavigate={() => navigate(`/all/${job.ID_JOB}`)}
          />
        ))}
      </div>
    </div>
  );
}
