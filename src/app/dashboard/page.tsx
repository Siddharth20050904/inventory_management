"use client";

import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, Bell, DollarSign, Box, TrendingUp,
} from 'lucide-react';
import Sidebar from '../../components/sidebar';
import { Order as PrismaOrder } from '@prisma/client';

import { getRecentOrders, getTotalRevenueThisMonth, getUnfulfilledOrders } from '../../../server_actions/handleOrders';
import { getTotalProducts } from '../../../server_actions/handleGodown';
import React from 'react';

// Define an OrderItem type
type OrderItem = {
  productName: string;
  quantity: number;
  price: number;
};

// Extend the Order type to include items
type Order = PrismaOrder & {
  items?: OrderItem[];
};

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [unfulfilledOrders, setUnfulfilledOrders] = useState<number>(0);
  
  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };
  
  // Sample data for dashboard stats
  const stats = [
    { title: "Total Revenue this Month", value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign className="h-8 w-8 text-blue-500" /> },
    { title: "Pending Orders", value: `${unfulfilledOrders}`, icon: <ShoppingCart className="h-8 w-8 text-yellow-500" />},
    { title: "Total Products", value: `${totalProducts}`, icon: <Box className="h-8 w-8 text-green-500" />},
  ];
  
  // Sample data for recent orders
  const [recentOrders, setRecentOrders]= useState<Order[]>([]);
  
  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
    { name: "Sales", href: "/sales", icon: <TrendingUp size={20} /> },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getOrders = async () => {
    try {
      const orders = await getRecentOrders();
      setRecentOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };

  useEffect(() => {
    getOrders();
    getTotalRevenueThisMonth().then(setTotalRevenue);
    getTotalProducts().then(setTotalProducts);
    getUnfulfilledOrders().then(setUnfulfilledOrders);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        navigationItems={navigationItems}
      />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl text-black font-bold mt-1">{stat.value}</h3>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : ''}
                        </td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.totalCost}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => toggleOrderDetails(order.id)}
                          >
                            {expandedOrder === order.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-700">Contact Number</h4>
                                <p className="text-gray-500">{order.contactNumber}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700">Email</h4>
                                <p className="text-gray-500">{order.email}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700">Notes</h4>
                                <p className="text-gray-500">{order.notes || 'No notes provided'}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700">Order Items</h4>
                                <ul className="list-disc pl-5">
                                  {order.items?.map((item, idx) => (
                                    <li key={idx} className="text-gray-500">
                                      {item.productName} - {item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700">Total Amount</h4>
                                <p className="text-gray-500">{order.totalCost}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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