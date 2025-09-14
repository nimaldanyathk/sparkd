import { createContext, useContext, useState } from 'react';
import React from "react";
const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, className = '', ...props }) => (
  <aside className={`w-64 bg-white border-r ${className}`} {...props}>
    {children}
  </aside>
);

export const SidebarHeader = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-b ${className}`} {...props}>
    {children}
  </div>
);

export const SidebarContent = ({ children, className = '', ...props }) => (
  <div className={`flex-1 overflow-auto ${className}`} {...props}>
    {children}
  </div>
);

export const SidebarFooter = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-t ${className}`} {...props}>
    {children}
  </div>
);

export const SidebarGroup = ({ children, className = '', ...props }) => (
  <div className={`px-3 py-2 ${className}`} {...props}>
    {children}
  </div>
);

export const SidebarGroupLabel = ({ children, className = '', ...props }) => (
  <h4 className={`px-2 py-1 text-xs font-semibold text-gray-500 ${className}`} {...props}>
    {children}
  </h4>
);

export const SidebarGroupContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const SidebarMenu = ({ children, className = '', ...props }) => (
  <nav className={`space-y-1 ${className}`} {...props}>
    {children}
  </nav>
);

export const SidebarMenuItem = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const SidebarMenuButton = ({ children, asChild, className = '', ...props }) => {
  if (asChild) {
    return React.cloneElement(children, {
      className: `${children.props.className || ''} ${className}`
    });
  }
  return (
    <button className={`w-full text-left ${className}`} {...props}>
      {children}
    </button>
  );
};

export const SidebarTrigger = ({ className = '', ...props }) => (
  <button className={`p-2 ${className}`} {...props}>
    ☰
  </button>
);