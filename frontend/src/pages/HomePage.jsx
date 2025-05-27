import React, { useEffect, useState } from "react";
import JobSlider from "../components/JobSlider";
import JobList from "../components/JobList";

export default function HomePage() {
  const [paidJobs, setPaidJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);

  // Simulare apel API pentru joburile care au plătit subscripția (pentru slider)
  useEffect(() => {
    fetch("/api/jobs/paid")
      .then((res) => res.json())
      .then((data) => setPaidJobs(data))
      .catch(console.error);
  }, []);

  // Simulare apel API pentru toate joburile
  useEffect(() => {
    fetch("/api/jobs/all")
      .then((res) => res.json())
      .then((data) => setAllJobs(data))
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
