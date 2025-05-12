/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from 'react';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, LogOut, Menu, X, Bell, Search, 
  Plus, Trash2, Save, ChevronDown
} from 'lucide-react';

export default function OrdersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    items: [{ product: '', quantity: 1, price: 0 }],
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Sample data for orders
  const [orders, setOrders] = useState([
    { 
      id: "ORD-7892", 
      customer: "John Smith", 
      date: "2025-05-10", 
      status: "Delivered", 
      amount: "$345.00",
      items: [
        { product: "Wireless Headphones", quantity: 1, price: 129.99 },
        { product: "Phone Case", quantity: 2, price: 24.99 }
      ],
      contactNumber: "555-123-4567",
      email: "john.smith@example.com",
      notes: "Leave package at the front door"
    },
    { 
      id: "ORD-7891", 
      customer: "Sarah Johnson", 
      date: "2025-05-10", 
      status: "Processing", 
      amount: "$1,290.00",
      items: [
        { product: "Gaming Monitor", quantity: 1, price: 899.99 },
        { product: "Keyboard", quantity: 1, price: 199.99 },
        { product: "Mouse", quantity: 1, price: 89.99 }
      ],
      contactNumber: "555-987-6543",
      email: "sarah.j@example.com",
      notes: "Call before delivery"
    },
    { 
      id: "ORD-7890", 
      customer: "Michael Brown", 
      date: "2025-05-09", 
      status: "Pending", 
      amount: "$780.50",
      items: [
        { product: "Desk Chair", quantity: 1, price: 349.99 },
        { product: "Desk Lamp", quantity: 2, price: 79.99 },
        { product: "Cable Management Kit", quantity: 1, price: 29.99 }
      ],
      contactNumber: "555-456-7890",
      email: "m.brown@example.com",
      notes: ""
    },
    { 
      id: "ORD-7889", 
      customer: "Emily Davis", 
      date: "2025-05-09", 
      status: "Delivered", 
      amount: "$120.75",
      items: [
        { product: "USB Hub", quantity: 1, price: 39.99 },
        { product: "HDMI Cable", quantity: 2, price: 19.99 },
        { product: "Webcam Cover", quantity: 3, price: 4.99 }
      ],
      contactNumber: "555-789-0123",
      email: "emily.d@example.com",
      notes: "Business address, delivery hours 9-5"
    },
  ]);
  
  // Sample product data
  const products = [
    { name: "Wireless Headphones", price: 129.99, stock: 45 },
    { name: "Phone Case", price: 24.99, stock: 120 },
    { name: "Gaming Monitor", price: 899.99, stock: 12 },
    { name: "Keyboard", price: 199.99, stock: 30 },
    { name: "Mouse", price: 89.99, stock: 42 },
    { name: "Desk Chair", price: 349.99, stock: 8 },
    { name: "Desk Lamp", price: 79.99, stock: 25 },
    { name: "Cable Management Kit", price: 29.99, stock: 55 },
    { name: "USB Hub", price: 39.99, stock: 60 },
    { name: "HDMI Cable", price: 19.99, stock: 80 },
    { name: "Webcam Cover", price: 4.99, stock: 150 },
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

  const addItemToOrder = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { product: '', quantity: 1, price: 0 }]
    });
  };
  
  const removeItemFromOrder = (index: number) => {
    const updatedItems = [...orderForm.items];
    updatedItems.splice(index, 1);
    setOrderForm({
      ...orderForm,
      items: updatedItems
    });
  };
  
  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...orderForm.items];
    
    if (field === 'product') {
      // Find selected product price
      const selectedProduct = products.find(p => p.name === value);
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: String(value),
        price: selectedProduct ? selectedProduct.price : 0
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }
    
    setOrderForm({
      ...orderForm,
      items: updatedItems
    });
  };    const calculateTotal = () => {    return orderForm.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0).toFixed(2);
  };
  
  const handleSubmitOrder = () => {
    // Generate a new order ID
    const newOrderId = `ORD-${7893 + orders.length}`;
    
    // Create new order
    const newOrder = {
      id: newOrderId,
      customer: orderForm.customerName,
      date: new Date().toISOString().slice(0, 10),
      status: "Pending",
      amount: `$${calculateTotal()}`,
      items: orderForm.items,
      contactNumber: orderForm.contactNumber,
      email: orderForm.email,
      notes: orderForm.notes
    };
    
    // Add new order to list
    setOrders([newOrder, ...orders]);
    
    // Reset form
    setOrderForm({
      customerName: '',
      contactNumber: '',
      email: '',
      items: [{ product: '', quantity: 1, price: 0 }],
      notes: ''
    });
    
    // Close form
    setIsAddingOrder(false);
  };
  
  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };
  
  const filteredOrders = orders.filter(order => {
    return order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
                  className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                    item.name === 'Orders' ? 'bg-gray-800 text-white' : ''
                  }`}
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
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center bg-gray-100 rounded-md w-64">
              <Search size={18} className="ml-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                className="bg-transparent border-none py-1 px-3 focus:outline-none w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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

        {/* Orders Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Orders</h2>
              <p className="text-gray-600">Manage and create customer orders</p>
            </div>
            <button 
              onClick={() => setIsAddingOrder(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus size={18} className="mr-1" /> New Order
            </button>
          </div>
          
          {/* Order Form */}
          {isAddingOrder && (
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Order</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    value={orderForm.contactNumber}
                    onChange={(e) => setOrderForm({...orderForm, contactNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    value={orderForm.email}
                    onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Order Items</h4>
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={addItemToOrder}
                  >
                    <Plus size={16} className="mr-1" /> Add Item
                  </button>
                </div>
                
                {orderForm.items.map((item, index) => (
                  <div key={index} className="flex items-end space-x-4 mb-2">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                          <option key={product.name} value={product.name}>
                            {product.name} - ${product.price} (Stock: {product.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-700">
                        ${item.price}
                      </div>
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                      <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-700">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItemFromOrder(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      disabled={orderForm.items.length === 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                <div className="flex justify-end mt-4">
                  <div className="text-lg font-semibold">
                    Total: ${calculateTotal()}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={2}
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  onClick={() => setIsAddingOrder(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  onClick={handleSubmitOrder}
                  disabled={!orderForm.customerName || orderForm.items.some(item => !item.product)}
                >
                  <Save size={18} className="mr-1" /> Save Order
                </button>
              </div>
            </div>
          )}
          
          {/* Orders List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Order List</h3>
            </div>
            {filteredOrders.length > 0 ? (
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
                    {filteredOrders.map((order) => (
                      <>
                        <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center">
                            <a href="#" className="text-blue-600 hover:text-blue-900 mr-3">View</a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 mr-3">Edit</a>
                            <ChevronDown 
                              size={16} 
                              className={`transform transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} 
                            />
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Contact Number</p>
                                  <p className="text-sm text-gray-900">{order.contactNumber}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Email</p>
                                  <p className="text-sm text-gray-900">{order.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Notes</p>
                                  <p className="text-sm text-gray-900">{order.notes || 'No notes'}</p>
                                </div>
                              </div>
                              
                              <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {order.items.map((item, index) => (
                                      <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{item.product}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">${item.price}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No orders found matching your search.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}