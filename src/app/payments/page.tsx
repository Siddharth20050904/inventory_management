/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from 'react';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, Search, CheckCircle, Calendar, 
  DollarSign, ChevronDown, X, Filter
} from 'lucide-react';
import Sidebar from '@/components/sidebar';

import { getOrders } from '../../../server_actions/handleOrders';
import { Order } from '@prisma/client';

export default function PendingPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string;
    customer: string;
    amount: string;
    dueDate: string;
    status: string;
    notes: string;
  } | null>(null);

  const Order: Order = {
    id: '',
    customerId: '',
    customerName: '',
    contactNumber: null,
    email: null,
    totalCost: 0,
    notes: null,
    status: '',
    deliveryDate: null,
    paymentStatus: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const orders = [Order];

  // Sample payments data
  const [payments, setPayments] = useState<Array<{
    id: string;
    customer: string;
    amount: string;
    dueDate: string;
    status: string;
    notes: string;
  }>>([]);

  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
  ];

  const toggleFilterMenu = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const openMarkPaidModal = (payment: { id: string; customer: string; amount: string; dueDate: string; status: string; notes: string; }) => {
    setSelectedPayment(payment);
    setIsMarkPaidOpen(true);
  };
  const closeMarkPaidModal = () => {
    setIsMarkPaidOpen(false);
    setSelectedPayment(null);
  };

  const handleMarkAsPaid = () => {
    setPayments(payments?.filter(p => p.id !== selectedPayment?.id));
    closeMarkPaidModal();
  };

  const handleSendReminder = (payment: { id: string; customer: string; amount: string; dueDate: string; status: string; notes: string; }) => {
    alert(`Reminder sent to ${payment.customer} for payment ${payment.id}`);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearchTerm = payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearchTerm && matchesStatus;
  });

  const getOrdersList = async () => {
    try {
      const orders = await getOrders();
      const paymentsData = orders.map((order) => ({
        id: order.id,
        customer: order.customerName,
        amount: order.totalCost.toString(),
        status: order.paymentStatus || 'Pending',
        dueDate: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A',
        notes: order.notes || '',
      }));
      setPayments([...paymentsData]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }
  useEffect(() => {
    getOrdersList();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Side Navigation */}
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
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Pending Payments</h2>
          </div>
        </header>

        {/* Payments Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-white rounded-md w-64 shadow">
                <Search size={18} className="ml-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  className="bg-transparent border-none py-2 px-3 focus:outline-none w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <button 
                  onClick={toggleFilterMenu}
                  className="flex items-center bg-white px-4 py-2 rounded-md shadow hover:bg-gray-50 transition-colors"
                >
                  <Filter size={18} className="mr-2 text-gray-500" />
                  <span>Filter</span>
                  <ChevronDown size={16} className="ml-1 text-gray-500" />
                </button>
                {isFilterOpen && (
                  <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <ul className="py-1">
                      <li>
                        <button
                          onClick={() => { setFilterStatus('all'); setIsFilterOpen(false); }}
                          className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterStatus === 'all' ? 'bg-gray-100' : ''}`}
                        >
                          All
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => { setFilterStatus('pending'); setIsFilterOpen(false); }}
                          className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterStatus === 'pending' ? 'bg-gray-100' : ''}`}
                        >
                          Pending
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => { setFilterStatus('overdue'); setIsFilterOpen(false); }}
                          className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${filterStatus === 'overdue' ? 'bg-gray-100' : ''}`}
                        >
                          Overdue
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2 sm:mt-0">
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
          </div>
          
          {/* Payments Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.customer}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{payment.amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar size={14} className="mr-1" />
                            {payment.dueDate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payment.status === 'Pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openMarkPaidModal(payment)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Mark Paid
                          </button>
                          <button 
                            onClick={() => handleSendReminder(payment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Send Reminder
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No payments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Payment Notes */}
          {selectedPayment && (
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900">Payment Notes</h3>
                <span className="text-sm text-gray-500">{selectedPayment.id}</span>
              </div>
              <p className="text-gray-700">
                {selectedPayment.notes || "No notes available for this payment."}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mark as Paid Modal */}
      {isMarkPaidOpen && selectedPayment && (
        <div className="text-black fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Mark Payment as Paid</h3>
              <button onClick={closeMarkPaidModal} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to mark the following payment as paid?
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Customer:</span>
                  <span className="text-sm font-medium">{selectedPayment.customer}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Amount:</span>
                  <span className="text-sm font-medium">{selectedPayment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Due Date:</span>
                  <span className="text-sm font-medium">{selectedPayment.dueDate}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeMarkPaidModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              >
                <CheckCircle size={16} className="mr-2" />
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
