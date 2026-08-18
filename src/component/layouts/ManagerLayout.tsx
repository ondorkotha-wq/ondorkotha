'use client';

import ProtectedRoute from '@/component/ProtectedRoute';

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['superadmin', 'manager']}>
      <div className="manager-layout">
        <nav className="bg-blue-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Manager Dashboard</h1>
            <div className="space-x-4">
              <a href="/manager/dashboard" className="hover:text-blue-300">Dashboard</a>
              <a href="/manager/team" className="hover:text-blue-300">My Team</a>
              <a href="/manager/reports" className="hover:text-blue-300">Reports</a>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}