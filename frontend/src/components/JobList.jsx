import React from "react";
import { Link } from "react-router-dom";

export default function JobList({ jobs, loading = false }) {
  console.log("JobList component rendered with jobs:", jobs);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Dată invalidă"
      : date.toLocaleDateString("ro-RO", options);
  };

  if (loading) {
    // afișează 5 skeleton items
    return (
      <ul className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <li
              key={i}
              className="relative flex items-start p-6 border rounded shadow animate-pulse bg-gray-200 cursor-wait"
              style={{ minHeight: "96px" }}
            >
              <div className="w-20 h-20 bg-gray-300 mr-8 rounded" />
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
          <Link
            to={`/job/${job.ID_JOB}`}
            className="relative flex items-start p-6 border rounded shadow hover:shadow-lg transition group cursor-pointer"
          >
            <img
              src={
                job.LOGO ||
                "https://www.adaptivewfs.com/wp-content/uploads/2020/07/logo-placeholder-image-6-1024x1024.png"
              }
              alt="Logo companie"
              className="w-20 h-20 object-contain mr-8"
            />

            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1">{job.TITLU}</h3>

              <p className="text-gray-600 mb-1">
                {job.DENUMIRE_COMPANIE || "Companie nedefinită"}
              </p>

              {job.LOCATIE && (
                <p className="text-sm text-gray-500 mb-1">
                  Locație: {job.LOCATIE}
                </p>
              )}

              <p className="text-sm text-gray-500">
                {job.DATA_POSTARII
                  ? `Postat pe ${formatDate(job.DATA_POSTARII)}`
                  : "Nu există data de postare"}
              </p>
            </div>

            <span className="absolute bottom-4 right-4 text-blue-600 opacity-0 group-hover:opacity-100 transition text-sm">
              Vezi detalii
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
