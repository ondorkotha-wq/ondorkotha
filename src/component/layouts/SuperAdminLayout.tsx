'use client';

import ProtectedRoute from '@/component/ProtectedRoute';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['superadmin']}>
      <div className="superadmin-layout">
        <nav className="bg-gray-900 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Super Admin Dashboard</h1>
            <div className="space-x-4">
              <a href="/superadmin/dashboard" className="hover:text-blue-300">Dashboard</a>
              <a href="/superadmin/users" className="hover:text-blue-300">Manage Users</a>
              <a href="/superadmin/settings" className="hover:text-blue-300">Settings</a>
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