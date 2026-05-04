import { useState } from 'react';
import React from "react";
export const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <div className="relative">
      {React.Children.map(children, child => 
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  );
};

export const SelectTrigger = ({ children, value, className = '', ...props }) => (
  <button className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} {...props}>
    {children}
  </button>
);

export const SelectValue = ({ placeholder, value }) => (
  <span>{value || placeholder}</span>
);

export const SelectContent = ({ children, value, onValueChange }) => (
  <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md">
    {React.Children.map(children, child => 
      React.cloneElement(child, { value, onValueChange })
    )}
  </div>
);

export const SelectItem = ({ children, value: itemValue, value, onValueChange, ...props }) => (
  <div 
    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
    onClick={() => onValueChange(itemValue)}
    {...props}
  >
    {children}
  </div>
);