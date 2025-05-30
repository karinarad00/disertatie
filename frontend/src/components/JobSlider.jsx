import React from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Imagini de birouri
const officeBackgrounds = [
  "https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1572521165329-b197f9ea3da6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1685946973834-81f1c465ec0c?auto=format&fit=crop&w=800&q=80",
];

export default function JobSlider({ jobs, loading = false }) {
  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 3000,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className="w-full mb-10 px-2">
      {loading ? (
        <div className="space-y-4 animate-pulse">
            <div
              className="h-80 bg-gray-300 shadow-lg"
            ></div>
        </div>
      ) : (
        <Slider {...settings}>
          {jobs.map((job, index) => (
            <Link
              to={`/job/${job.id}`}
              key={job.id}
              className="block px-2 text-white"
            >
              <div
                className="h-80 shadow-lg rounded-xl overflow-hidden bg-cover bg-center"
                style={{
                  backgroundImage: `url(${
                    officeBackgrounds[index % officeBackgrounds.length]
                  })`,
                }}
              >
                <div className="h-full w-full bg-black bg-opacity-60 p-6 flex flex-col justify-end">
                  <h3 className="text-xl font-bold">{job.title}</h3>
                  <p className="text-sm">{job.company}</p>
                </div>
              </div>
            </Link>
          ))}
        </Slider>
      )}
    </div>
  );
}
