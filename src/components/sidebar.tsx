import { LogOut, Menu, X } from 'lucide-react';
import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  navigationItems: { name: string; href: string; icon: React.ReactNode }[];
}
const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar, navigationItems }) => {
  const { status } = useSession();
  const router = useRouter();
  
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Don't render anything while checking authentication status
  if (status === 'loading') {
    return null;
  }
  
  // If unauthenticated, don't render the sidebar
  if (status === 'unauthenticated') {
    return null;
  }
  return (
    <div className={`${isSidebarOpen ? 'w-64' : 'w-15'} bg-gray-900 text-white transition-all duration-300 ease-in-out h-screen relative`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {isSidebarOpen && <h1 className="text-xl font-bold">Inventory Pro</h1>}
        <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-gray-800">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <nav className="mt-5">
        <ul>
          {navigationItems.map((item, index) => (
            <li key={item.name || index}>
              <a
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <span className="mr-3">{item.icon}</span>
                {isSidebarOpen && <span>{item.name}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="absolute bottom-0 left-0 w-full p-4 h-16">
        <a
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          {isSidebarOpen && <span>Logout</span>}
        </a>
      </div>
    </div>
  );
};

export default Sidebar;