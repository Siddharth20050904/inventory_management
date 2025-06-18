"use client";
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, Bell, Search, 
  Plus, Trash2, Save, Edit, RefreshCw,
  ChevronDown, ChevronUp, TrendingUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SquarePlus
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import { getProducts, addProduct, updateProduct, deleteProduct, getTotalInventoryValue, getTotalNumberOfProducts } from '../../../server_actions/handleGodown';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function GodownPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof typeof initialProductForm; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Pagination states
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [totalNumberOfProducts, setTotalNumberOfProducts] = useState(0);

  const navigationItems = [
     { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
     { name: "Customers", href: "/customers", icon: <Users size={20} /> },
     { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
     { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
     { name: "Godown", href: "/godown", icon: <Package size={20} /> },
     { name: "Sales", href: "/sales", icon: <TrendingUp size={20} /> },
     { name: "Buyers", href: "/buyers", icon: <SquarePlus size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const requestSort = (key: keyof typeof initialProductForm) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredProducts = () => {
    const sortedProducts = [...products];
    if (sortConfig.key) {
      sortedProducts.sort((a, b) => {
        if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortedProducts;
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
    e.preventDefault();
    
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
              description: updatedProduct.description ?? ''
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

      if(newProduct) {
        setProducts([
          ...products, 
          {
            ...newProduct,
            lastUpdated: newProduct.lastUpdated instanceof Date
              ? newProduct.lastUpdated.toISOString()
              : newProduct.lastUpdated,
            description: newProduct.description ?? ''
          }
        ]);
      }
      // Refresh the current page to show the new product
      await getProductsData(page);
      setIsAddingProduct(false);
      setProductForm(initialProductForm);
      setIsEditingProduct(false);
      setEditProductId(null);
    }
    
    setProductForm(initialProductForm);
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(productId);
      // Refresh current page after deletion
      await getProductsData(page);
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  const displayedProducts = getSortedAndFilteredProducts();

  const getProductsData = async (pageNum = 1, search = '') => {
    setIsLoading(true);
    try {
      // Pass search term to your backend
      const productsData = await getProducts({
        limit: pageSize + 1,
        offset: (pageNum - 1) * pageSize,
        search, // <-- add this line
      });

      const hasMoreRecords = productsData.length > pageSize;
      const actualProducts = hasMoreRecords ? productsData.slice(0, pageSize) : productsData;

      setProducts(actualProducts.map(product => ({
        ...product,
        id: product.id,
        lastUpdated: product.lastUpdated.toISOString(),
        description: product.description ?? '',
      })));

      setHasMore(hasMoreRecords);
      setTotalProducts((pageNum - 1) * pageSize + actualProducts.length + (hasMoreRecords ? 1 : 0));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1);
    }
  };

  const handleFirstPage = () => {
    setPage(1);
  };

  const handleLastPage = () => {
    // This is an approximation since we don't know the exact last page
    // You might want to implement a total count API to get the exact last page
    if (hasMore) {
      setPage(page + 1);
    }
  };

  // Calculate pagination info
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, (page - 1) * pageSize + products.length);

  useEffect(() => {
    getProductsData(page, searchTerm); // Pass searchTerm here
    getTotalInventoryValue().then(setTotalInventoryValue);
    getTotalNumberOfProducts().then(setTotalNumberOfProducts);
  }, [page, searchTerm]);

  const { status } = useSession();
  const router = useRouter();

  // Don't render anything while checking authentication status
  if (status === 'loading') {
    return null;
  }
  // If unauthenticated, don't render the page
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 text-black">
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // <-- Reset to first page on search
                }}
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
                  <h3 className="text-black text-2xl font-bold mt-1">{totalNumberOfProducts}</h3>
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
                  <h3 className="text-2xl text-black font-bold mt-1">₹{totalInventoryValue}</h3>
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
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            )}
            
            {!isLoading && (
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
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">No products found.</td>
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
            )}

            {/* Pagination Controls */}
            {!isLoading && products.length > 0 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing <span className="font-medium">{startItem}</span> to{' '}
                      <span className="font-medium">{endItem}</span> of{' '}
                      <span className="font-medium">{totalProducts}+</span> results
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* First Page Button */}
                    <button
                      onClick={handleFirstPage}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    
                    {/* Previous Page Button */}
                    <button
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {/* Show current page and nearby pages */}
                      {page > 2 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            1
                          </button>
                          {page > 3 && <span className="px-2 text-gray-500">...</span>}
                        </>
                      )}
                      
                      {page > 1 && (
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {page - 1}
                        </button>
                      )}
                      
                      <button
                        className="relative inline-flex items-center px-3 py-2 border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600"
                      >
                        {page}
                      </button>
                      
                      {hasMore && (
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {page + 1}
                        </button>
                      )}
                    </div>

                    {/* Next Page Button */}
                    <button
                      onClick={handleNextPage}
                      disabled={!hasMore}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {/* Last Page Button (approximation) */}
                    <button
                      onClick={handleLastPage}
                      disabled={!hasMore}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}