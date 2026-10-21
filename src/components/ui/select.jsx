import React, { useState } from "react";

export function Select({ children, className, onValueChange, ...props }) {
  const [selectedValue, setSelectedValue] = useState("");

  const handleChange = (e) => {
    setSelectedValue(e.target.value);
    if (onValueChange) {
      onValueChange(e.target.value);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <select
        value={selectedValue}
        onChange={handleChange}
        className="w-full border p-2 rounded-md"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function SelectTrigger({ children, className }) {
  return <div className={`border p-2 rounded-md cursor-pointer ${className}`}>{children}</div>;
}

export function SelectValue({ placeholder, value }) {
  return <span>{value || placeholder}</span>;
}

export function SelectContent({ children, className }) {
  return <div className={`absolute z-10 mt-1 bg-white shadow-md rounded-md ${className}`}>{children}</div>;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}

export default Select;
