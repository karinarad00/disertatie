import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-8">
      <p>
        &copy; {new Date().getFullYear()} JobFinder. Toate drepturile rezervate.
      </p>
    </footer>
  );
}
