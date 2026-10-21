import React from "react";

export function RadioGroup({ children, className }) {
  return <div className={`flex space-x-4 ${className}`}>{children}</div>;
}

export function RadioGroupItem({ id, value, name }) {
  return (
    <input type="radio" id={id} name={name} value={value} className="hidden peer" />
  );
}

export default RadioGroup;
