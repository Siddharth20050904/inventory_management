"use client";

import { useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, Bell, Search, 
  Plus, Trash2, Save, Edit, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import Sidebar from '@/components/sidebar';

export default function GodownPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof typeof initialProductForm; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [editProductId, setEditProductId] = useState<number | null>(null);

  const initialProductForm = {
    name: '',
    category: '',
    sku: '',
    price: '',
    costPrice: '',
    quantity: '',
    reorderLevel: '',
    location: '',
    supplier: '',
    description: ''
  };
  const [productForm, setProductForm] = useState(initialProductForm);

  // Sample data for products
  const [products, setProducts] = useState([
    { id: 1, name: "Wireless Headphones", category: "Electronics", sku: "EL-WH-001", price: 129.99, costPrice: 79.99, quantity: 45, reorderLevel: 10, location: "Rack A1", supplier: "Tech Distributors Inc.", lastUpdated: "2025-05-08", description: "Premium wireless headphones with noise cancellation." },
    { id: 2, name: "Phone Case", category: "Accessories", sku: "AC-PC-002", price: 24.99, costPrice: 8.50, quantity: 120, reorderLevel: 30, location: "Rack B3", supplier: "Mobile Accessories Ltd.", lastUpdated: "2025-05-09", description: "Durable protection case for smartphones." },
    { id: 3, name: "Gaming Monitor", category: "Electronics", sku: "EL-GM-003", price: 899.99, costPrice: 650.00, quantity: 12, reorderLevel: 5, location: "Section C, Shelf 2", supplier: "Gaming Tech Co.", lastUpdated: "2025-05-07", description: "27-inch 4K gaming monitor with 144Hz refresh rate." },
    { id: 4, name: "Keyboard", category: "Computer Peripherals", sku: "CP-KB-004", price: 199.99, costPrice: 120.00, quantity: 30, reorderLevel: 8, location: "Rack D2", supplier: "Computing Solutions", lastUpdated: "2025-05-08", description: "Mechanical keyboard with RGB backlighting." },
    { id: 5, name: "Mouse", category: "Computer Peripherals", sku: "CP-MS-005", price: 89.99, costPrice: 45.00, quantity: 42, reorderLevel: 15, location: "Rack D1", supplier: "Computing Solutions", lastUpdated: "2025-05-10", description: "Ergonomic wireless mouse with customizable buttons." },
    { id: 6, name: "Desk Chair", category: "Furniture", sku: "FN-DC-006", price: 349.99, costPrice: 200.00, quantity: 8, reorderLevel: 3, location: "Section F, Floor Level", supplier: "Office Furniture Inc.", lastUpdated: "2025-05-05", description: "Adjustable ergonomic office chair with lumbar support." },
    { id: 7, name: "Desk Lamp", category: "Lighting", sku: "LT-DL-007", price: 79.99, costPrice: 35.00, quantity: 25, reorderLevel: 7, location: "Rack E4", supplier: "Home Essentials Co.", lastUpdated: "2025-05-09", description: "LED desk lamp with adjustable brightness." },
    { id: 8, name: "Cable Management Kit", category: "Accessories", sku: "AC-CM-008", price: 29.99, costPrice: 12.00, quantity: 55, reorderLevel: 20, location: "Rack B4", supplier: "Office Supplies Ltd.", lastUpdated: "2025-05-07", description: "Complete set for organizing cables and wires." },
    { id: 9, name: "USB Hub", category: "Computer Peripherals", sku: "CP-UH-009", price: 39.99, costPrice: 18.50, quantity: 60, reorderLevel: 15, location: "Rack D3", supplier: "Tech Imports Co.", lastUpdated: "2025-05-06", description: "7-port USB hub with power adapter." },
    { id: 10, name: "HDMI Cable", category: "Accessories", sku: "AC-HC-010", price: 19.99, costPrice: 5.00, quantity: 80, reorderLevel: 25, location: "Rack B2", supplier: "Cable Solutions", lastUpdated: "2025-05-08", description: "6ft high-speed HDMI cable with gold plated connectors." },
  ]);

  // Extract unique categories for filtering
  const categories = [...new Set(products.map(product => product.category))];

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const requestSort = (key: keyof typeof initialProductForm) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredProducts = () => {
    let filteredProducts = [...products];
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterCategory) {
      filteredProducts = filteredProducts.filter(product => 
        product.category === filterCategory
      );
    }
    if (sortConfig.key) {
      filteredProducts.sort((a, b) => {
        if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filteredProducts;
  };

  interface Product {
    id: number;
    name: string;
    category: string;
    sku: string;
    price: number;
    costPrice: number;
    quantity: number;
    reorderLevel: number;
    location: string;
    supplier: string;
    lastUpdated: string;
    description: string;
  }

  const handleEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      category: product.category,
      sku: product.sku,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      quantity: product.quantity.toString(),
      reorderLevel: product.reorderLevel.toString(),
      location: product.location,
      supplier: product.supplier,
      description: product.description
    });
    setEditProductId(product.id);
    setIsEditingProduct(true);
    setIsAddingProduct(true);
  };

  const handleSubmitProduct = (e: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    const formattedProduct = {
      ...productForm,
      price: parseFloat(productForm.price),
      costPrice: parseFloat(productForm.costPrice),
      quantity: parseInt(productForm.quantity),
      reorderLevel: parseInt(productForm.reorderLevel),
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    if (isEditingProduct) {
      setProducts(products.map(product => 
        product.id === editProductId ? { ...formattedProduct, id: editProductId } : product
      ));
      setIsEditingProduct(false);
    } else {
      const newProductId = Math.max(...products.map(p => p.id)) + 1;
      setProducts([...products, { ...formattedProduct, id: newProductId }]);
    }
    setProductForm(initialProductForm);
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(product => product.id !== productId));
    }
  };
  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  const displayedProducts = getSortedAndFilteredProducts();

  const inventoryStats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, product) => sum + (product.price * product.quantity), 0).toFixed(2),
    lowStock: products.filter(product => product.quantity <= product.reorderLevel).length
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
                placeholder="Search products..."
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

        {/* Godown Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Godown Inventory</h2>
              <p className="text-gray-600">Manage and track your warehouse inventory</p>
            </div>
            <button 
              onClick={() => {
                setIsAddingProduct(true);
                setIsEditingProduct(false);
                setProductForm(initialProductForm);
              }}
              className="w-30 h-10 px-1 py-2 text-sm ml-5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus size={18} className="mr-1" /> Add Product
            </button>
          </div>
          
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Total Products</p>
                  <h3 className="text-black text-2xl font-bold mt-1">{inventoryStats.totalProducts}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Inventory Value</p>
                  <h3 className="text-2xl text-black font-bold mt-1">${inventoryStats.totalValue}</h3>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <ShoppingCart className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Low Stock Items</p>
                  <h3 className="text-2xl text-black font-bold mt-1">{inventoryStats.lowStock}</h3>
                </div>
                <div className="bg-red-50 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Form */}
          {isAddingProduct && (
            <form className="bg-white text-black rounded-lg shadow mb-6 p-6" onSubmit={handleSubmitProduct}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {isEditingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({...productForm, costPrice: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.reorderLevel}
                    onChange={(e) => setProductForm({...productForm, reorderLevel: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.location}
                    onChange={(e) => setProductForm({...productForm, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.supplier}
                    onChange={(e) => setProductForm({...productForm, supplier: e.target.value})}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setIsEditingProduct(false);
                    setProductForm(initialProductForm);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save size={16} className="mr-1" /> {isEditingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="flex items-center mb-4 space-x-2">
            <button
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
              onClick={resetFilters}
            >
              <RefreshCw size={16} className="mr-1" /> Reset Filters
            </button>
            <div>
              <select
                className="px-3 py-1 border text-black border-gray-300 rounded"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="" className='text-black'>All Categories</option>
                {categories.map(cat => (
                  <option className='text-black' key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white text-black rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('name')}>
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('price')}>
                    Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </th>
                  <th className="px-4 py-2">Cost Price</th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('quantity')}>
                    Qty {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </th>
                  <th className="px-4 py-2">Reorder</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2">Last Updated</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-4 text-center text-gray-500">No products found.</td>
                  </tr>
                )}
                {displayedProducts.map(product => (
                  <tr key={product.id} className={product.quantity <= product.reorderLevel ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-2">{product.category}</td>
                    <td className="px-4 py-2">{product.sku}</td>
                    <td className="px-4 py-2">₹{product.price.toFixed(2)}</td>
                    <td className="px-4 py-2">₹{product.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-2">{product.quantity}</td>
                    <td className="px-4 py-2">{product.reorderLevel}</td>
                    <td className="px-4 py-2">{product.location}</td>
                    <td className="px-4 py-2">{product.supplier}</td>
                    <td className="px-4 py-2">{product.lastUpdated}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleEditProduct(product)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
