"use client";
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, Bell, Search, 
  Plus, Trash2, Save, Edit, RefreshCw,
  ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../../server_actions/handleGodown';

export default function GodownPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof typeof initialProductForm; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [editProductId, setEditProductId] = useState<string | null>(null);

  const initialProductForm = {
    name: '',
    price: '',
    quantity: '',
    description: ''
  };
  const [productForm, setProductForm] = useState(initialProductForm);

  // Sample data for products
  const initialProducts: Product[] = [];
  const [products, setProducts] = useState(initialProducts);

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
    { name: "Sales", href: "/sales", icon: <TrendingUp size={20} /> },
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
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
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
    id: string;
    name: string;
    price: number;
    quantity: number;
    lastUpdated: string;
    description: string;
  }

  const handleEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      description: product.description
    });
    setEditProductId(product.id);
    setIsEditingProduct(true);
    setIsAddingProduct(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission behavior
    
    const formattedProduct = {
      ...productForm,
      price: parseFloat(productForm.price),
      quantity: parseInt(productForm.quantity),
      lastUpdated: new Date().toISOString().slice(0, 10)
    };

    
    if (isEditingProduct && editProductId !== null) {
      const formData = new FormData();
      formData.append("id", editProductId);
      formData.append("name", formattedProduct.name);
      formData.append("price", formattedProduct.price.toString());
      formData.append("quantity", formattedProduct.quantity.toString());
      formData.append("description", formattedProduct.description);
      formData.append("lastUpdated", formattedProduct.lastUpdated);

      const updatedProduct = await updateProduct(formData);
      const updatedProducts = products.map(product =>
        product.id === editProductId
          ? { 
              ...product, 
              ...updatedProduct, 
              lastUpdated: updatedProduct.lastUpdated.toISOString(),
              description: updatedProduct.description ?? '' // Ensure description is always a string
            }
          : product
      );
      setProducts(updatedProducts);
      setIsEditingProduct(false);
      setEditProductId(null);
      setProductForm(initialProductForm);
      setIsAddingProduct(false);
    } else {
      const formData = new FormData();
      formData.append("name", formattedProduct.name);
      formData.append("price", formattedProduct.price.toString());
      formData.append("quantity", formattedProduct.quantity.toString());
      formData.append("description", formattedProduct.description);
      formData.append("lastUpdated", formattedProduct.lastUpdated);

      const newProduct = await addProduct(formData);
      setProducts([...products, { ...newProduct, id: newProduct.id, lastUpdated: newProduct.lastUpdated.toISOString(), description: newProduct.description ?? '' }]);
      setIsAddingProduct(false);
      setProductForm(initialProductForm);
      setIsEditingProduct(false);
      setEditProductId(null);
      setIsAddingProduct(false);
    }
    
    setProductForm(initialProductForm);
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const deletedProduct = await deleteProduct(productId);
      setProducts(products.filter(product => product.id != deletedProduct.id));
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  const displayedProducts = getSortedAndFilteredProducts();

  const inventoryStats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, product) => sum + (product.price * product.quantity), 0).toFixed(2),
  };

  const getProductsData = async () => {
    const productsData = await getProducts();
    setProducts(productsData.map(product => ({
      ...product,
      id: product.id, // Convert id to number
      lastUpdated: product.lastUpdated.toISOString(), // Convert Date to string
      description: product.description ?? '', // Provide default value for description
    })));
  }

  useEffect(() => {
    getProductsData();
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  <h3 className="text-2xl text-black font-bold mt-1">₹{inventoryStats.totalValue}</h3>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <ShoppingCart className="h-8 w-8 text-green-500" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
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
          </div>

          {/* Product Table */}
          <div className="bg-white text-black rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('name')}>
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('price')}>
                    Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => requestSort('quantity')}>
                    Qty {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </th>
                  <th className="px-4 py-2">Last Updated</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-gray-500">No products found.</td>
                  </tr>
                )}
                {displayedProducts.map(product => (
                  <tr key={product.id} className='text-center'>
                    <td className="px-4 py-2 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-2">₹{product.price.toFixed(2)}</td>
                    <td className="px-4 py-2">{product.quantity}</td>
                    <td className="px-4 py-2">{product.lastUpdated}</td>
                    <td className="px-4 py-2 truncate max-w-xs">{product.description}</td>
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