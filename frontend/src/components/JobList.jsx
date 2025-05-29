import React from "react";
import { Link } from "react-router-dom";

export default function JobList({ jobs }) {
  console.log("JobList component rendered with jobs:", jobs);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Dată invalidă"
      : date.toLocaleDateString("ro-RO", options);
  };

  return (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <li key={job.ID_JOB}>
          <Link
            to={`/job/${job.ID_JOB}`}
            className="relative flex items-start p-6 border rounded shadow hover:shadow-lg transition group cursor-pointer"
          >
            {job.LOGO && (
              <img
                src={job.LOGO}
                alt="Logo companie"
                className="w-20 h-20 object-contain mr-8"
              />
            )}

            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1">{job.TITLU}</h3>

              <p className="text-gray-600 mb-1">
                {job.DENUMIRE_COMPANIE || "Companie nedefinită"}
              </p>
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
