"use client";

import React from 'react';
import { useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, Search, Plus, Edit, Trash2, X
} from 'lucide-react';
import Sidebar from '../../components/sidebar';

import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../../../server_actions/handleCustomers';
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentPending?: number;
}

export default function CustomersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample customers data
  const defaultCustomers: Customer[] = [];
  const [customers, setCustomers] = useState(defaultCustomers);

  // Form state for adding/editing customer
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
  ];

  const fetchCustomers = async () => {
    const customersData = await getCustomers();
    setCustomers(customersData.map(customer => ({
      ...customer,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      address: customer.address ?? undefined,
      paymentPending: customer.paymentPending ?? undefined,
    })));
  }

  React.useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setFormData({name: '', email: '', phone: '', address: ''});
    setIsAddModalOpen(true);
  };

  const openEditModal = (customer: { id: string; name: string; email: string; phone: string; address: string;}) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
    setSelectedCustomer(customer);
    setIsAddModalOpen(true);
  };  
  const openDeleteModal = (customer: { id: string; name: string; email: string; phone: string; address: string;}) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };
  const handleSubmit = async () => {
    if (selectedCustomer) {
      // Edit existing customer
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("id", selectedCustomer.id);
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("email", formData.email);
      formDataToSubmit.append("phone", formData.phone);
      formDataToSubmit.append("address", formData.address);
      
      const editedCustomer = await updateCustomer(formDataToSubmit);
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? {
        ...editedCustomer,
        email: editedCustomer.email ?? undefined,
        phone: editedCustomer.phone ?? undefined,
        address: editedCustomer.address ?? undefined,
      } : c));
      setFormData({name: '', email: '', phone: '', address: ''});
      setSelectedCustomer(null);
      setIsAddModalOpen(false);
      fetchCustomers();
      closeModals();
    } else {
      // Add new customer
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("email", formData.email);
      formDataToSubmit.append("phone", formData.phone);
      formDataToSubmit.append("address", formData.address);
      const newCustomer = await addCustomer(formDataToSubmit);
      setCustomers([...customers, {
        ...newCustomer,
        email: newCustomer.email ?? undefined,
        phone: newCustomer.phone ?? undefined,
        address: newCustomer.address ?? undefined,
        paymentPending: newCustomer.paymentPending ?? undefined,
      }]);
      setFormData({name: '', email: '', phone: '', address: ''});
      setSelectedCustomer(null);
      setIsAddModalOpen(false);
      closeModals();
      fetchCustomers();
    }
    
    closeModals();
  };

  const handleDelete = async (id: string) => {
    const deletedCustomer = await deleteCustomer(id);
    setCustomers(customers.filter(c => c.id !== deletedCustomer?.id));
    closeModals();
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        navigationItems={navigationItems}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
          </div>
        </header>

        {/* Customers Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white rounded-md w-64 shadow">
              <Search size={18} className="ml-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                className="bg-transparent border-none py-2 px-3 focus:outline-none w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={openAddModal}
              className="flex items-center bg-blue-600 text-white w-30 h-10 px-1 py-2 text-sm ml-5 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-1" />
              Add Customer
            </button>
          </div>
          
          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Pending</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.email}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.paymentPending}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openEditModal({ 
                              ...customer, 
                              email: customer.email ?? '', 
                              phone: customer.phone ?? '', 
                              address: customer.address ?? '' 
                            })}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal({ 
                              ...customer, 
                              email: customer.email ?? '', 
                              phone: customer.phone ?? '', 
                              address: customer.address ?? '' 
                            })}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 text-black bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModals}
                  className="bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {selectedCustomer ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete {selectedCustomer.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end">
              <button
                onClick={closeModals}
                className="bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedCustomer.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}