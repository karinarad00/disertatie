import React from "react";
import { Link } from "react-router-dom";

export default function JobSlider({ jobs }) {
  return (
    <div className="flex overflow-x-auto space-x-4 pb-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="min-w-[250px] bg-blue-100 p-4 rounded shadow flex-shrink-0"
        >
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <p>{job.company}</p>
          <Link to={`/job/${job.id}`} className="text-blue-700 underline">
            Vezi detalii
          </Link>
        </div>
      ))}
    </div>
  );
}
