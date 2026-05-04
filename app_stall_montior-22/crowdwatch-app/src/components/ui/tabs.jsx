import React, { useState } from "react";

export const Tabs = ({ children, defaultValue, className = '', ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className} {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab, className = '', ...props }) => (
  <div
    className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}
    {...props}
  >
    {React.Children.map(children, child => 
      React.cloneElement(child, { activeTab, setActiveTab })
    )}
  </div>
);

export const TabsTrigger = ({ children, value, activeTab, setActiveTab, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
      activeTab === value ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'
    } ${className}`}
    onClick={() => setActiveTab(value)}
    {...props}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, value, activeTab, className = '', ...props }) => (
  activeTab === value ? (
    <div className={`mt-2 ${className}`} {...props}>
      {children}
    </div>
  ) : null
);