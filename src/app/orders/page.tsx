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

import { getOrdersList, createOrder, updateOrderStatus, updateOrder } from '../../../server_actions/handleOrders';
import { getCustomers } from '../../../server_actions/handleCustomers';
import { getAllProducts } from '../../../server_actions/handleGodown';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Select from 'react-select';

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
    broughtBy: '',
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

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(false);

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

  const customerOptions = customersList.map((customer) => ({
    value: customer.id,
    label: customer.name,
    email: customer.email,
    phone: customer.phone,
  }));

  const getProductsList = async () => {
    try {
      const products = await getAllProducts();
      setProductList(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  const productOptions = productList.map((product) => ({
    value: product.id,
    label: `${product.name} | (Stock: ${product.quantity})`,
    price: product.price,
    productName: product.name,
  }));

  const getOrdersListFunc = async (pageNum = 1) => {
    try {
      // Fetch one extra record to check if there are more pages
      const orders = await getOrdersList({
        limit: pageSize + 1,
        offset: (pageNum - 1) * pageSize,
      });

      console.log(orders.map(order => ({
        id: order.id,
      })));

      const hasMoreRecords = orders.length > pageSize;
      const actualOrders = hasMoreRecords ? orders.slice(0, pageSize) : orders;

      setOrders(actualOrders);
      setHasMore(hasMoreRecords);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  useEffect(() =>{
    getCustomersList();
    getProductsList();
    getOrdersListFunc(page);
  }, [page]);

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
    console.log("Selected Id: ",selectedCustomerId);
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
      broughtBy: orderForm.broughtBy,
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
    broughtBy: "",
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
    broughtBy: orderForm.broughtBy,
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
    broughtBy: "",
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
    const search = searchTerm.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(search) ||
      order.id.toLowerCase().includes(search) ||
      (order.broughtBy && order.broughtBy.toLowerCase().includes(search))
    );
  });

  const handleEdit = (orderId: string) => {
    const order = orders.find((order) => order.id === orderId);
    if (order) {
      setSelectedOrderId(orderId);
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
        broughtBy: order.broughtBy || '',
      });
      setEditModalOpen(true);
      setIsAddingOrder(true);
    }
  };

  const { status } = useSession();
  const router = useRouter();
  // Don't render anything while checking authentication status
  if (status === 'loading') {
    return null;
  }
  // Render the page if authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }


return (
  <div className="flex text-black h-screen bg-gray-100">
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
        <div className="flex items-center justify-between px-3 sm:px-6 py-4">
          <div className="flex items-center bg-gray-100 rounded-md w-full max-w-xs sm:max-w-sm md:w-64">
            <Search size={18} className="ml-3 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search orders..."
              className="bg-transparent border-none py-1 px-3 focus:outline-none w-full text-sm min-w-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center ml-4 flex-shrink-0">
            <button className="p-2 mr-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                AT
              </div>
              {isSidebarOpen && (
                <span className="ml-2 font-medium text-gray-700 hidden sm:inline">Admin</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Orders Content */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Orders</h2>
            <p className="text-gray-600 text-sm sm:text-base">Manage and create customer orders</p>
          </div>
          <button 
            onClick={() => setIsAddingOrder(true)}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <Plus size={18} className="mr-1" /> New Order
          </button>
        </div>
        
        {/* Order Form */}
        {isAddingOrder && (
          <div className="bg-white rounded-lg shadow mb-6 p-4 sm:p-6 text-black">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Order</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <Select
                  options={customerOptions}
                  value={customerOptions.find(opt => opt.value === orderForm.customerId) ?? null}
                  onChange={(selected) => {
                    if (selected) {
                      setOrderForm({
                        ...orderForm,
                        customerName: selected.label,
                        customerId: selected.value,
                        email: selected.email || '',
                        contactNumber: selected.phone || '',
                      });
                      setSelectedCustomerId(selected.value);
                    }
                  }}
                  placeholder="Select a customer..."
                  isClearable
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brought By</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={orderForm.broughtBy}
                  onChange={(e) => setOrderForm({ ...orderForm, broughtBy: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  <option value="Sandeep">Sandeep</option>
                  <option value="Laxman">Laxman</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-2 sm:space-y-0">
                <h4 className="font-medium text-gray-700">Order Items</h4>
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center self-start sm:self-auto"
                  onClick={addItemToOrder}
                >
                  <Plus size={16} className="mr-1" /> Add Item
                </button>
              </div>
              
              {orderForm.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  {/* Desktop Layout - Single Line */}
                  <div className="hidden md:block">
                    <div className="flex items-end gap-4">
                      <div className="flex-1 text-black">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <Select
                          options={productOptions}
                          value={productOptions.find(opt => opt.value === item.productId)}
                          onChange={(selected) => {
                            if (selected) {
                              handleItemChange(index, 'product', {
                                productName: selected.productName,
                                productId: selected.value,
                                price: selected.price,
                              });
                            }
                          }}
                          placeholder="Select a product..."
                          isClearable
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="w-full text-black px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-full text-black px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                        <div className="px-2 py-2 border border-gray-200 bg-gray-100 rounded-md text-gray-700 text-center text-sm">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <div className="w-10">
                        <button
                          onClick={() => removeItemFromOrder(index)}
                          className="p-2 text-red-500 hover:text-red-700 bg-white rounded-md border border-red-200 hover:border-red-300"
                          disabled={orderForm.items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Layout - Stacked */}
                  <div className="md:hidden space-y-4">
                    <div className="text-black">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                      <Select
                        options={productOptions}
                        value={productOptions.find(opt => opt.value === item.productId)}
                        onChange={(selected) => {
                          if (selected) {
                            handleItemChange(index, 'product', {
                              productName: selected.productName,
                              productId: selected.value,
                              price: selected.price,
                            });
                          }
                        }}
                        placeholder="Select a product..."
                        isClearable
                      />
                    </div>
                    
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="w-full text-black px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-10">
                        <button
                          onClick={() => removeItemFromOrder(index)}
                          className="p-2 text-red-500 hover:text-red-700 bg-white rounded-md border border-red-200 hover:border-red-300"
                          disabled={orderForm.items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-700">Subtotal: </span>
                      <span className="text-sm font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end mt-4">
                <div className="text-lg text-black font-semibold bg-blue-50 px-4 py-2 rounded-lg">
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
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <button 
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                onClick={() => setIsAddingOrder(false)}
              >
                Cancel
              </button>
              <button 
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
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
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Order List</h3>
          </div>
          
          {filteredOrders.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr> 
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brought By</th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.broughtBy}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center">
                            <a className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer">View</a>
                            <a className="text-gray-600 hover:text-gray-900 mr-3 cursor-pointer" onClick={() => handleEdit(order.id)}>Edit</a>
                            <ChevronDown
                              size={16}
                              className={`transform transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                            />
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-gray-700">Contact Number</h4>
                                  <p className="text-gray-500">{order.contactNumber}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700">Email</h4>
                                  <p className="text-gray-500">{order.email}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-medium text-gray-700">Notes</h4>
                                  <p className="text-gray-500">{order.notes || 'No notes provided'}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-medium text-gray-700">Order Items</h4>
                                  <ul className="list-disc pl-5">
                                    {order.items.map((item, index) => (
                                      <li key={index} className="text-gray-500">
                                        {item.productName} - {item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              {order.status !== 'Delivered' && (
                                <div className="flex justify-end mt-4">
                                  <button
                                    onClick={(e) => {e.stopPropagation(); handleUpdateStatus(order.id, 'Delivered')}}
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

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border-b border-gray-200 last:border-b-0">
                    <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleOrderDetails(order.id)}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">{order.customerName}</h4>
                          <p className="text-sm text-gray-500">
                            {order.deliveryDate ? order.deliveryDate.toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">{order.totalCost || 'N/A'}</p>
                          <ChevronDown 
                            size={16} 
                            className={`transform transition-transform ml-auto ${expandedOrder === order.id ? 'rotate-180' : ''}`} 
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'Delivered' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'Processing' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.paymentStatus === 'Paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">By: {order.broughtBy}</span>
                        <div className="flex space-x-3">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            onClick={() => { handleEdit(order.id) }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedOrder === order.id && (
                      <div className="px-4 pb-4 bg-gray-50 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Contact:</span>
                            <span className="ml-2 text-gray-500">{order.contactNumber}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="ml-2 text-gray-500">{order.email}</span>
                          </div>
                        </div>
                        
                        {order.notes && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Notes:</span>
                            <p className="mt-1 text-gray-500">{order.notes}</p>
                          </div>
                        )}
                        
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Items:</span>
                          <ul className="mt-1 space-y-1">
                            {order.items.map((item, index) => (
                              <li key={index} className="text-gray-500 pl-2">
                                • {item.productName} - {item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {order.status !== 'Delivered' && (
                          <div className="pt-2">
                            <button
                              onClick={(e) => {e.stopPropagation(); handleUpdateStatus(order.id, 'Delivered')}}
                              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                            >
                              Mark as Delivered
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No orders found matching your search.
            </div>
          )}
        </div>
        
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 px-4 space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600">
            Page {page}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 text-sm"
            >
              First
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 text-sm"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-gray-100 rounded font-medium text-sm">
              {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
);
}