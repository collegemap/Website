import React from "react";

export function Input({ className, ...props }) {
  return <input className={`border p-2 rounded-md ${className}`} {...props} />;
}

export default Input;
