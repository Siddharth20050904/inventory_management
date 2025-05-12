"use client";

import { useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, LogOut, Menu, X, Bell, 
  TrendingUp, DollarSign, Box, AlertTriangle
} from 'lucide-react';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Sample data for dashboard stats
  const stats = [
    { title: "Total Revenue", value: "$24,780", icon: <DollarSign className="h-8 w-8 text-blue-500" />, change: "+12%" },
    { title: "Pending Orders", value: "45", icon: <ShoppingCart className="h-8 w-8 text-yellow-500" />, change: "+5%" },
    { title: "Low Stock Items", value: "8", icon: <AlertTriangle className="h-8 w-8 text-red-500" />, change: "-3%" },
    { title: "Total Products", value: "256", icon: <Box className="h-8 w-8 text-green-500" />, change: "+2%" },
  ];
  
  // Sample data for recent orders
  const recentOrders = [
    { id: "ORD-7892", customer: "John Smith", date: "2025-05-10", status: "Delivered", amount: "$345.00" },
    { id: "ORD-7891", customer: "Sarah Johnson", date: "2025-05-10", status: "Processing", amount: "$1,290.00" },
    { id: "ORD-7890", customer: "Michael Brown", date: "2025-05-09", status: "Pending", amount: "$780.50" },
    { id: "ORD-7889", customer: "Emily Davis", date: "2025-05-09", status: "Delivered", amount: "$120.75" },
  ];
  
  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold">Inventory Pro</h1>
          )}
          <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-gray-800">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="mt-5">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.name}>
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
        <div className="absolute bottom-0 w-full p-4">
          <a
            href="/logout"
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            {isSidebarOpen && <span>Logout</span>}
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-end px-6 py-4">
            <div className="flex items-center">
              <button className="p-2 mr-2 text-gray-400 hover:text-gray-600">
                <Bell size={20} />
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  AT
                </div>
                {isSidebarOpen && (
                  <span className="ml-2 font-medium text-gray-700">Admin</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            <p className="text-gray-600">Welcome back to your inventory management system.</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl text-black font-bold mt-1">{stat.value}</h3>
                    <p className="text-green-500 flex items-center mt-1">
                      <TrendingUp size={16} className="mr-1" />
                      {stat.change}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'Delivered' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'Processing' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900 mr-3">View</a>
                        <a href="#" className="text-gray-600 hover:text-gray-900">Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <a href="/orders" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View all orders →</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}