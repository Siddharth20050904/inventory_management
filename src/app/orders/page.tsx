/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Sidebar from '../../components/sidebar';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, LogOut, Menu, X, Bell, Search, 
  Plus, Trash2, Save, ChevronDown, TrendingUp
} from 'lucide-react';

import React from 'react';
import { Customer, Order, Product } from '@prisma/client';

import { getOrders, createOrder, updateOrderStatus, updateOrder } from '../../../server_actions/handleOrders';
import { getCustomers } from '../../../server_actions/handleCustomers';
import { getProducts } from '../../../server_actions/handleGodown';

export default function OrdersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerId: '',
    customerName: '',
    contactNumber: '',
    email: '',
    items: [{ productName: '', quantity: 1, price: 0, productId: '' }],
    notes: '',
    deliveryDate: '',
    paymentDueDate: '',
    paymentStatus: 'Unpaid',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Sample data for orders
  const Order: (Order & { items: { productName: string; quantity: number; price: number; productId: string }[] })[] = [];
  const [orders, setOrders] = useState(Order);

  const Product: Product[] = [];
  
  // Sample product data
  const [productList, setProductList] = useState(Product); // Flatten the array to use it directly

  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
    { name: "Sales", href: "/sales", icon: <TrendingUp size={20} /> },
  ];

  const [customersList, setCustomersList] = useState<Customer[]>([]);

  const getCustomersList = async () => {
    try {
      const customers = await getCustomers();
      setCustomersList(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }

  const getProductsList = async () => {
    try {
      const products = await getProducts();
      setProductList(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  const getOrdersList = async () => {
    try {
      const orders = await getOrders();
      setOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  useEffect(() =>{
    getCustomersList();
    getProductsList();
    getOrdersList();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const addItemToOrder = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { productName: '', quantity: 1, price: 0, productId: '' }]
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
  
  const handleItemChange = (index: number, field: string, value: string | number | { productName: string; productId: string; price: number }) => {
    const updatedItems = [...orderForm.items];
    if (field === 'product') {
    // Update multiple fields (productName, productId, and price)
    updatedItems[index] = {
      ...updatedItems[index],
      productName: typeof value === 'object' && 'productName' in value ? value.productName : '',
      productId: typeof value === 'object' && 'productId' in value ? value.productId : '',
      price: typeof value === 'object' && 'price' in value ? value.price : 0,
    };
  } else {
    // Update a single field
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
  }
    setOrderForm({
      ...orderForm,
      items: updatedItems
    });

    console.log("Updated Items:", updatedItems);
  };

  const calculateTotal = () => {    
    return orderForm.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0).toFixed(2);
  };
  
const handleSubmitOrder = async () => {
  // Generate a new order ID
  if(editModalOpen){
    const updatedOrder = await updateOrder(selectedOrderId || '', {
      ...orderForm,
      id: selectedOrderId || '',
      totalCost: parseFloat(calculateTotal()),
      status: "Pending", // or fetch the current status if needed
      createdAt: new Date(), // or use the existing createdAt value
      updatedAt: new Date(),
      deliveryDate: orderForm.deliveryDate ? new Date(orderForm.deliveryDate) : null,
      paymentDueDate: orderForm.paymentDueDate ? new Date(orderForm.paymentDueDate) : null,
      paymentStatus: orders.find((order) => selectedOrderId === order.id)?.paymentStatus || "Unpaid", // or fetch the current payment status if needed
      items: orderForm.items.map((item, index) => ({
        id: `ITEM-${selectedOrderId || ''}-${index + 1}`, // Ensure unique IDs for items
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        productId: item.productId,
        orderId: selectedOrderId || '',
      })),
    });

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === selectedOrderId ? { ...order, ...updatedOrder } : order
      )
    );

    setOrderForm({
    customerId: "",
    customerName: "",
    contactNumber: "",
    email: "",
    items: [{ productName: "", quantity: 1, price: 0, productId: "" }],
    notes: "",
    deliveryDate: "",
    paymentDueDate: "",
    paymentStatus: "Unpaid",
    });
    setEditModalOpen(false);
    setIsAddingOrder(false);
    return;
  }
  const newOrderId = `ORD-${7893 + orders.length}`;

  // Calculate the total cost
  const totalCost = orderForm.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // Create new order
  const newOrder = {
    customerId: orderForm.customerId,
    customerName: orderForm.customerName,
    contactNumber: orderForm.contactNumber,
    email: orderForm.email,
    items: orderForm.items.map((item, index) => ({
      id: `ITEM-${newOrderId}-${index + 1}`, // Generate a unique ID for each item
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      productId: item.productId,
      orderId: newOrderId,
    })),
    totalCost: totalCost,
    notes: orderForm.notes,
    status: "Pending",
    deliveryDate: orderForm.deliveryDate ? new Date(orderForm.deliveryDate) : null,
    paymentDueDate: orderForm.paymentDueDate ? new Date(orderForm.paymentDueDate) : null,
    paymentStatus: "Unpaid",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const addedOrder = await createOrder({ id: newOrderId, ...newOrder });  

  // Add new order to list
  setOrders([{ ...addedOrder, items: newOrder.items }, ...orders]);

  // Reset form
  setOrderForm({
    customerId: "",
    customerName: "",
    contactNumber: "",
    email: "",
    items: [{ productName: "", quantity: 1, price: 0, productId: "" }],
    notes: "",
    deliveryDate: "",
    paymentDueDate: "",
    paymentStatus: "Unpaid",
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
    setSelectedOrderId(orderId);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId);
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const filteredOrders = orders.filter(order => {
    return order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEdit = (orderId: string) => {
    const order = orders.find((order) => order.id === orderId);
    if (order) {
      setOrderForm({
        customerId: order.customerId,
        customerName: order.customerName,
        contactNumber: order.contactNumber || '',
        email: order.email || '',
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          productId: item.productId,
        })),
        notes: order.notes || '',
        deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString().split('T')[0] : '',
        paymentDueDate: order.paymentDueDate ? order.paymentDueDate.toISOString().split('T')[0] : '',
        paymentStatus: order.paymentStatus || 'Unpaid',
      });
      setEditModalOpen(true);
      setIsAddingOrder(true);
    }
  };

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
              className="w-30 h-10 px-1 py-2 text-sm ml-5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus size={18} className="mr-1" /> New Order
            </button>
          </div>
          
          {/* Order Form */}
          {isAddingOrder && (
            <div className="bg-white rounded-lg shadow mb-6 p-6 text-black">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Order</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.customerName}
                    onChange={(e) => {
                      setOrderForm({...orderForm,
                       customerName: e.target.value.split(',')[0], customerId: e.target.value.split(',')[1], email: e.target.value.split(',')[2], contactNumber: e.target.value.split(',')[3]});
                       setSelectedCustomerId(e.target.value.split(',')[1]);
                    }}
                  >
                    <option value="">Select a customer</option>
                    {customersList.map((customer) => (
                      <option key={customer.id} value={[customer.name, customer.id, customer.email,customer.phone].join(',')}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.deliveryDate || ''}
                    onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.paymentDueDate || ''}
                    onChange={(e) => setOrderForm({ ...orderForm, paymentDueDate: e.target.value })}
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
                    <div className="flex-grow text-black">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={item.productId}
                        onChange={(e) => {
                          const selectedProduct = productList.find(product => product.id === e.target.value);
                          if (selectedProduct) {
                            handleItemChange(index, 'product', {
                              productName: selectedProduct.name,
                              productId: selectedProduct.id,
                              price: selectedProduct.price,
                            });
                          }
                        }}
                      >
                        <option value="">{item.productName ? item.productName : "Select a product"}</option>
                        {productList.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} | (Stock: {product.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      />
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
                  <div className="text-lg text-black font-semibold">
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
                  disabled={!orderForm.customerName || orderForm.items.some(item => !item.productName || item.quantity <= 0 || item.price <= 0)}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delievery Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <React.Fragment key={order.id}>

                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.customerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.deliveryDate ? order.deliveryDate.toLocaleDateString() : 'N/A'}
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.paymentStatus === 'Paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.totalCost || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center">
                            <a className="text-blue-600 hover:text-blue-900 mr-3">View</a>
                            <a className="text-gray-600 hover:text-gray-900 mr-3" onClick={() => handleEdit(order.id)}>Edit</a>
                            <ChevronDown 
                              size={16} 
                              className={`transform transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} 
                            />
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              {/* Expanded order details */}
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
                                    {order.items.map((item, index : number) => (
                                      <li key={index} className="text-gray-500">
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
                                {/* Mark as Delivered Button */}
                                {order.status !== 'Delivered' && (
                                  <div className="flex justify-end mt-4">
                                    <button
                                      onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                      Mark as Delivered
                                    </button>
                                  </div>
                                )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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