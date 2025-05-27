import React from "react";
import { Link } from "react-router-dom";

export default function JobList({ jobs }) {
  return (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <li key={job.id} className="p-4 border rounded shadow">
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <p>{job.company}</p>
          <Link to={`/job/${job.id}`} className="text-blue-600 underline">
            Vezi detalii
          </Link>
        </li>
      ))}
    </ul>
  );
}
