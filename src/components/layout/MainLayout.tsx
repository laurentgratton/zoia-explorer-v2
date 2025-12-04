import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function MainLayout({ children, sidebar }: MainLayoutProps) {
    const [showLibrary, setShowLibrary] = React.useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-900 text-white">
        {showLibrary && (
            <aside className="border-r border-gray-700 flex-shrink-0 flex flex-col bg-gray-800 w-80">
                {sidebar}
            </aside>
        )}
            <button
                onClick={() => setShowLibrary(!showLibrary)}
                className="absolute top-0 w-10 h-10 bg-gray-800 z-20 border-y border-r border-gray-700 rounded-r-md flex items-center justify-center text-yellow-500 hover:text-yellow-400 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] focus:outline-none cursor-pointer"
                title={showLibrary ? "Close Signal Path" : "Open Signal Path"}
            >
            <span className="text-lg leading-none">
                <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true"
                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 22 21">
                    <path stroke="#F0B100" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 17V2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12M5 15V1m8 18v-4"/>
                </svg>
            </span>
            </button>



        <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
