import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function MainLayout({ children, sidebar }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-900 text-white">
      <aside className="w-80 border-r border-gray-700 flex-shrink-0 flex flex-col bg-gray-800">
        {sidebar}
      </aside>
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
