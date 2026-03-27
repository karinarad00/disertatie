"use client";

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

// Static announcements
const announcements = [
  {
    id: "a1",
    title: "New Feature: AI-Powered Job Matching",
    description:
      "Get personalized job recommendations based on your skills and experience",
    type: "announcement",
  },
  {
    id: "a2",
    title: "1000+ New Jobs Added This Week",
    description:
      "Explore opportunities from top companies in tech, finance, and more",
    type: "announcement",
  },
  {
    id: "a3",
    title: "Career Fair Event - March 20th",
    description: "Connect with leading employers at our virtual career fair",
    type: "announcement",
  },
];

const JobSlider = ({ jobs = [], loading = false }) => {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: true,
    skipSnaps: false,
    dragFree: false,
  });

  const slides = [...announcements, ...jobs];

  // Optional: autoplay
  useEffect(() => {
    if (!embla) return;
    const autoplay = () => {
      if (embla.canScrollNext()) {
        embla.scrollNext();
      } else {
        embla.scrollTo(0);
      }
    };
    const interval = setInterval(autoplay, 3000);
    return () => clearInterval(interval);
  }, [embla]);

  return (
    <div className="w-full mb-10 overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-2">
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-48 bg-gray-300 rounded-lg"></div>
        </div>
      ) : (
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((item) => {
              if (item.type === "announcement") {
                return (
                  <div key={item.id} className="flex-shrink-0 w-full px-2">
                    <div className="rounded-lg p-6 bg-transparent text-white w-full h-full">
                      <h3 className="text-xl font-semibold mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm">{item.description}</p>
                    </div>
                  </div>
                );
              }

              // Jobs → add "Promoted" label
              return (
                <div key={item.ID_JOB} className="flex-shrink-0 w-full px-2">
                  <Link
                    to={`/job/${item.ID_JOB}`}
                    className="block w-full h-full"
                  >
                    <div className="rounded-lg p-6 bg-transparent text-white w-full h-full relative">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        {item.TITLU}{" "}
                        <span className="bg-yellow-400 text-blue-900 font-bold text-xs px-2 py-0.5 rounded-full">
                          Promovat
                        </span>
                      </h3>
                      <p className="text-sm">{item.DENUMIRE_COMPANIE}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSlider;
