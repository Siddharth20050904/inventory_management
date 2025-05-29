
"use client";

import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, ShoppingCart, 
  Package, Bell, Search, 
  ChevronDown,
  DollarSign, TrendingUp, Wallet, Download
} from 'lucide-react';
import { Line } from 'recharts';
import Sidebar from '@/components/sidebar';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { getMonthlySalesAndProfit, getWeeklySalesAndProfit, getOrdersForMonth } from '../../../server_actions/handleOrders';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type TimeRange = 'monthly' | 'daily';

export default function SalesPage() {
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Customers", href: "/customers", icon: <Users size={20} /> },
    { name: "Pending Payments", href: "/payments", icon: <FileText size={20} /> },
    { name: "Orders", href: "/orders", icon: <ShoppingCart size={20} /> },
    { name: "Godown", href: "/godown", icon: <Package size={20} /> },
    { name: "Sales", href: "/sales", icon: <TrendingUp size={20} /> },
  ]
  // Sales data for different time periods
  const [salesData, setSalesData] = useState<{
    monthly: { name: string; sales: number; profit: number}[];
    daily: { name: string; sales: number; profit: number}[];
  }>();

  // Calculate sales statistics
  const currentData = salesData ? salesData[timeRange] : [];
  const totalSales = currentData.reduce((sum, item) => sum + item.sales, 0);
  const totalProfit = currentData.reduce((sum, item) => sum + item.profit, 0);
  const profitMargin = totalSales !== 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchData = async () => {
      const monthlyData = await getMonthlySalesAndProfit();
      const dailyData = await getWeeklySalesAndProfit();
      setSalesData({
        monthly: monthlyData ?? [],
        daily: dailyData ?? []
      });
    };
    fetchData();
  }, []);

  const months = [
    { value: 0, label: "January" }, { value: 1, label: "February" }, { value: 2, label: "March" },
    { value: 3, label: "April" }, { value: 4, label: "May" }, { value: 5, label: "June" },
    { value: 6, label: "July" }, { value: 7, label: "August" }, { value: 8, label: "September" },
    { value: 9, label: "October" }, { value: 10, label: "November" }, { value: 11, label: "December" }
  ];
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return null;
  }
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  async function handleExport(month: number, year: number) {
    console.log("Exporting data for month:", month, "year:", year);
    // Fetch sales data for the selected month and year
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // You may want to create a server action for this, but for demo:
    const orders = await getOrdersForMonth(startOfMonth, endOfMonth);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Details");

    // Add header row
    worksheet.addRow([
      "Order ID", "Customer Name", "Date", "Brought By", "Product", "Quantity", "Price", "Total"
    ]);

    // Add data rows
    orders.forEach(order => {
      order.items.forEach(item => {
        worksheet.addRow([
          order.id,
          order.customerName,
          new Date(order.createdAt).toLocaleDateString(),
          order.broughtBy,
          item.productName,
          item.quantity,
          item.price,
          item.quantity * item.price
        ]);
      });
    });

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `sales_${year}_${month + 1}.xlsx`);
  }
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];



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
                placeholder="Search..."
                className="bg-transparent border-none py-1 px-3 focus:outline-none w-full"
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

        {/* Sales Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Sales Overview</h2>
              <p className="text-gray-600">Monitor your sales performance and trends</p>
            </div>
            <div className="flex items-center text-black space-x-2">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                onClick={() => handleExport(selectedMonth, selectedYear)}
              >
                <Download size={16} className="mr-2" /> Export
              </button>
            </div>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex mb-6 bg-white p-2 rounded-lg shadow">
            <button 
              className={`px-4 py-2 rounded ${timeRange === 'daily' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setTimeRange('daily')}
            >
              Daily
            </button>
            <button 
              className={`px-4 py-2 rounded ${timeRange === 'monthly' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setTimeRange('monthly')}
            >
              Monthly
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Total Sales</p>
                  <h3 className="text-black text-2xl font-bold mt-1">₹{totalSales.toLocaleString()}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Total Profit</p>
                  <h3 className="text-black text-2xl font-bold mt-1">₹{totalProfit.toLocaleString()}</h3>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Profit Margin</p>
                  <h3 className="text-black text-2xl font-bold mt-1">{profitMargin}%</h3>
                </div>
                <div className="bg-purple-50 p-3 rounded-full">
                  <Wallet className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sales, Profit, and Loss Chart */}
          <div className="bg-white text-black rounded-lg shadow mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales, Profit & Loss Analysis</h3>
            <div className="h-80">
              <SalesChart data={salesData ? salesData[timeRange] : []} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Sales Line Chart Component
function SalesChart({ data }: { data: { name: string; sales: number; profit: number; }[] }) {
  return (
    <LineChartComponent
      data={data}
      lines={[
        { dataKey: 'sales', stroke: '#3B82F6', name: 'Sales' },
        { dataKey: 'profit', stroke: '#10B981', name: 'Profit' }
      ]}
    />
  );
}
// Line Chart Component
function LineChartComponent({ data, lines } : { data: { name: string; sales: number; profit: number; }[]; lines: { dataKey: string; stroke: string; name: string; }[] }) {
  return (
    <div className="w-full h-full">
      <LineChart width={800} height={300} data={data} className="mx-auto">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map((line, index) => (
          <Line 
            key={index}
            type="monotone" 
            dataKey={line.dataKey} 
            stroke={line.stroke} 
            name={line.name}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </div>
  );
}

// Import these missing components to make the charts work
import { 
  LineChart, CartesianGrid, XAxis, 
  YAxis, Tooltip, Legend 
} from 'recharts';