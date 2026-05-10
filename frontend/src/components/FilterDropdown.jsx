import React from "react";

const FilterDropdown = ({ options, value, onChange, placeholder, icon: Icon }) => {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <Icon className="absolute left-3 size-4 text-gray-500 pointer-events-none" />
      )}
      <select
        className={`
          appearance-none
          ${Icon ? "pl-9" : "px-4"}
          py-2
          pr-10
          bg-white
          border
          border-gray-300
          rounded-lg
          text-gray-700
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-500
          cursor-pointer
          text-sm
          min-w-[140px]
          transition-all
          hover:border-gray-400
        `}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};

export default FilterDropdown;
