"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Select from "react-select";
import { Plus, Save, Search, Bell, ChevronDown, Trash2, LayoutDashboard, FileText, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

import { getAllProducts } from "../../../server_actions/handleGodown";
import { postPurchaseOrder, getPurchaseOrders, updatePurchaseOrderDeliveryStatus, updatePurchaseOrderPaymentStatus } from "../../../server_actions/handlePurchase";
import { Product, BuyerOrder } from "@prisma/client";


export default function BuyersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    distributorName: "",
    items: [{ productName: "", quantity: 1, price: 0, productId: "" }],
    paymentStatus: "Unpaid",
    deliveryStatus: "Pending",
    notes: "",
    deliveryDate: Date.now().toString().slice(0, 10), // Default to today's date
    paymentDueDate: Date.now().toString().slice(0, 10), // Default to today's date
  });
  type BuyerOrderWithItems = BuyerOrder & {
    items: {
      id: string;
      price: number;
      quantity: number;
      productName: string;
      productId: string;
      orderId: string;
    }[];
    notes?: string | null;
  };

  const [orders, setOrders] = useState<BuyerOrderWithItems[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(false);

  // Dummy product options (replace with your actual products)
  const [productOptions, setProductOptions] = useState<Product[]>([]);

  // Replace this with your actual fetch function for paginated buyer orders
  const getBuyerOrdersList = async (pageNum = 1, search = "") => {
    const orders = await getPurchaseOrders({ limit: pageSize + 1, offset: (pageNum - 1) * pageSize , searchTerm: search});
    setOrders(orders);
    setHasMore(orders.length > pageSize);
  };

  useEffect(() => {
    // Fetch products
    const fetchProducts = async () => {
      getAllProducts().then(setProductOptions);
    };
    fetchProducts();

    // Fetch paginated buyer orders
    getBuyerOrdersList(page, searchTerm);
  }, [page, searchTerm]);

  // Convert products to react-select options (same as orders page)
  const productSelectOptions = productOptions.map((product) => ({
    value: product.id,
    label: `${product.name} | (Stock: ${product.quantity})`,
    price: product.price,
    productName: product.name,
  }));

  const calculateTotal = () => {
    return orderForm.items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const addItemToOrder = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { productName: "", quantity: 1, price: 0, productId: "" }],
    });
  };

  const removeItemFromOrder = (index: number) => {
    const updatedItems = [...orderForm.items];
    updatedItems.splice(index, 1);
    setOrderForm({ ...orderForm, items: updatedItems });
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number | { productName: string; productId: string; price: number }
  ) => {
    const updatedItems = [...orderForm.items];
    if (field === "product") {
      updatedItems[index] = {
        ...updatedItems[index],
        productName: typeof value === "object" && "productName" in value ? value.productName : "",
        productId: typeof value === "object" && "productId" in value ? value.productId : "",
        price: typeof value === "object" && "price" in value ? value.price : 0,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
    }
    setOrderForm({ ...orderForm, items: updatedItems });
  };

  const handleSubmitOrder = async () => {
    const items = orderForm.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      productId: item.productId,
    }));
    const orderData = {
      supplierName: orderForm.distributorName,
      items: items,
      totalCost: parseFloat(calculateTotal()),
      paymentStatus: orderForm.paymentStatus,
      status: orderForm.deliveryStatus,
      notes: orderForm.notes,
      deliveryDate: new Date(orderForm.deliveryDate),
      paymentDueDate: new Date(orderForm.paymentDueDate)
    };

    const newOrder = await postPurchaseOrder(orderData);
    if (!newOrder) {
      console.error("Failed to create order");
      return;
    }
    setOrders([newOrder, ...orders]);
    setOrderForm({
      distributorName: "",
      items: [{ productName: "", quantity: 1, price: 0, productId: "" }],
      paymentStatus: "Unpaid",
      deliveryStatus: "Pending",
      notes: "",
      deliveryDate: "",
      paymentDueDate: "",
    });
    setIsAddingOrder(false);
  };

  const filteredOrders = orders.filter((order) =>
    order.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Navigation items (reuse from orders page)
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
    { name: "Sales", href: "/sales", icon: <TrendingUp size={20} /> },
    { name: "Buyers", href: "/buyers", icon: <Users size={20} /> },
  ];

  // Pagination logic for filtered orders (if you don't have backend pagination)
  const paginatedOrders = filteredOrders.slice(0, page * pageSize);
  // If you have backend pagination, use orders directly

  return (
    <div className="flex text-black h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} navigationItems={navigationItems} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-3 sm:px-6 py-4">
            <div className="flex items-center bg-gray-100 rounded-md w-full max-w-xs sm:max-w-sm md:w-64">
              <Search size={18} className="ml-3 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search distributors..."
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
                  BY
                </div>
                {isSidebarOpen && (
                  <span className="ml-2 font-medium text-gray-700 hidden sm:inline">Buyer</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Buyers Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Purchase Orders</h2>
              <p className="text-gray-600 text-sm sm:text-base">Manage and record purchases from distributors</p>
            </div>
            <button
              onClick={() => setIsAddingOrder(true)}
              className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus size={18} className="mr-1" /> New Purchase
            </button>
          </div>

          {/* Buyer Order Form */}
          {isAddingOrder && (
            <div className="bg-white rounded-lg shadow mb-6 p-4 sm:p-6 text-black">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Purchase</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.distributorName}
                    onChange={(e) => setOrderForm({ ...orderForm, distributorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.paymentStatus}
                    onChange={(e) => setOrderForm({ ...orderForm, paymentStatus: e.target.value })}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.deliveryStatus}
                    onChange={(e) => setOrderForm({ ...orderForm, deliveryStatus: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.deliveryDate}
                    onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={orderForm.paymentDueDate}
                    onChange={(e) => setOrderForm({ ...orderForm, paymentDueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-2 sm:space-y-0">
                  <h4 className="font-medium text-gray-700">Items</h4>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center self-start sm:self-auto"
                    onClick={addItemToOrder}
                  >
                    <Plus size={16} className="mr-1" /> Add Item
                  </button>
                </div>
                {orderForm.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex items-end gap-4">
                      <div className="flex-1 text-black">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <Select
                          options={productSelectOptions}
                          value={productSelectOptions.find((opt) => opt.value === item.productId)}
                          onChange={(selected) => {
                            if (selected) {
                              handleItemChange(index, "product", {
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
                          onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
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
                          onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
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
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
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
                  disabled={
                    !orderForm.distributorName ||
                    orderForm.items.some((item) => !item.productName || item.quantity <= 0 || item.price <= 0)
                  }
                >
                  <Save size={18} className="mr-1" /> Save Purchase
                </button>
              </div>
            </div>
          )}

          {/* Buyers Orders List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Purchases List</h3>
            </div>
            {paginatedOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distributor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
                          <td className="px-6 py-4 whitespace-nowrap">{order.supplierName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{order.createdAt.toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={
                                order.paymentStatus === "Paid"
                                  ? "inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                                  : "inline-block px-2 py-1 rounded text-xs bg-red-100 text-red-700"
                              }
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={
                                order.status === "Delivered"
                                  ? "inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                                  : "inline-block px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700"
                              }
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{order.totalCost.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <ChevronDown
                              size={16}
                              className={`transform transition-transform ml-auto ${expandedOrder === order.id ? "rotate-180" : ""}`}
                            />
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50 px-6 py-4">
                              <div>
                                <div className="font-medium mb-2">Items:</div>
                                <ul className="list-disc ml-6">
                                  {order.items.map((item, idx) => (
                                    <li key={idx}>
                                      {item.productName} - {item.quantity} × ${item.price}
                                    </li>
                                  ))}
                                </ul>
                                {order.notes && (
                                  <div className="mt-2 text-gray-600">
                                    <span className="font-medium">Notes:</span> {order.notes}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {/* Show Payment Status Button only if not Paid */}
                                  {order.paymentStatus !== "Paid" && (
                                    <button
                                      className="px-3 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                                      onClick={async () => {
                                        // Optimistically update UI
                                        setOrders((prev) =>
                                          prev.map((o) =>
                                            o.id === order.id ? { ...o, paymentStatus: "Paid" } : o
                                          )
                                        );
                                        // Await backend update (handle error if needed)
                                        try {
                                          await updatePurchaseOrderPaymentStatus(order.id, "Paid");
                                        } catch {
                                          // Rollback on error
                                          setOrders((prev) =>
                                            prev.map((o) =>
                                              o.id === order.id ? { ...o, paymentStatus: order.paymentStatus } : o
                                            )
                                          );
                                          alert("Failed to update payment status.");
                                        }
                                      }}
                                    >
                                      Mark as Paid
                                    </button>
                                  )}
                                  {/* Show Delivery Status Button only if not Delivered */}
                                  {order.status !== "Delivered" && (
                                    <button
                                      className="px-3 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                                      onClick={async () => {
                                        // Optimistically update UI
                                        setOrders((prev) =>
                                          prev.map((o) =>
                                            o.id === order.id ? { ...o, status: "Delivered" } : o
                                          )
                                        );
                                        // Await backend update (handle error if needed)
                                        try {
                                          await updatePurchaseOrderDeliveryStatus(order.id, "Delivered");
                                        } catch {
                                          // Rollback on error
                                          setOrders((prev) =>
                                            prev.map((o) =>
                                              o.id === order.id ? { ...o, status: order.status } : o
                                            )
                                          );
                                          alert("Failed to update delivery status.");
                                        }
                                      }}
                                    >
                                      Mark as Delivered
                                    </button>
                                  )}
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
            ) : (
              <div className="py-8 text-center text-gray-500">No purchases found.</div>
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