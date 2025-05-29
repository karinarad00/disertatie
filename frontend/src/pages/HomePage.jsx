import React, { useEffect, useState } from "react";
import JobSlider from "../components/JobSlider";
import JobList from "../components/JobList";

export default function HomePage() {
  const [paidJobs, setPaidJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/paid")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch active jobs");
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setPaidJobs(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/jobs/all")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch all jobs");
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setAllJobs(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Anunțuri promovate</h2>
      <JobSlider jobs={paidJobs} />

      <h2 className="text-2xl font-bold mt-10 mb-4">Toate anunțurile</h2>
      <JobList jobs={allJobs} />
    </div>
  );
}
