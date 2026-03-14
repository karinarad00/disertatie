import React from "react";
import { MapPin, Clock, DollarSign, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";

// Optional: simple Image fallback component
const ImageWithFallback = ({ src, alt, className }) => {
  const fallback =
    "https://www.adaptivewfs.com/wp-content/uploads/2020/07/logo-placeholder-image-6-1024x1024.png";
  return <img src={src || fallback} alt={alt} className={className} />;
};

const JobCard = ({ job }) => {
  return (
    <Link
      to={`/job/${job.ID_JOB}`}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex gap-4 cursor-pointer"
    >
      <div className="flex-shrink-0">
        <ImageWithFallback
          src={job.LOGO}
          alt={job.DENUMIRE_COMPANIE || "Companie nedefinită"}
          className="w-20 h-20 rounded-lg"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {job.TITLU}
              </h3>
              <p className="text-gray-600">
                {job.DENUMIRE_COMPANIE || "Companie nedefinită"}
              </p>
            </div>
            <button className="text-gray-400 hover:text-blue-600 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
            {job.LOCATIE && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{job.LOCATIE}</span>
              </div>
            )}
            {job.TIP_JOB && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{job.TIP_JOB}</span>
              </div>
            )}
            {job.SALARIU && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{job.SALARIU}</span>
              </div>
            )}
          </div>

          {job.DESCRIERE && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {job.DESCRIERE}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {job.DATA_POSTARII
              ? new Date(job.DATA_POSTARII).toLocaleDateString("ro-RO")
              : "Dată nedefinită"}
          </span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Aplică
          </button>
        </div>
      </div>
    </Link>
  );
};

const JobList = ({ jobs, loading = false }) => {
  if (loading) {
    return (
      <ul className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <li
              key={i}
              className="animate-pulse bg-gray-200 p-6 rounded-lg flex gap-4"
            >
              <div className="w-20 h-20 bg-gray-300 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <li key={job.ID_JOB}>
          <JobCard job={job} />
        </li>
      ))}
    </ul>
  );
};

export default JobList;
