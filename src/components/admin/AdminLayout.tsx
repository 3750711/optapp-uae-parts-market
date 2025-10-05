import React from 'react';
import Header from "../layout/Header";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-grow p-4 md:p-6">
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
