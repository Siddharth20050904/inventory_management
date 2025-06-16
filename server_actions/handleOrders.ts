"use server";
// Removed OrderItem import as it is not exported from '@prisma/client'
import prisma from '../lib/prisma';
import { sendOrderConfirmationEmail } from './mailing';

export async function getOrdersList({ limit = 10, offset = 0 } = {}) {
  return prisma.order.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
}

export async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  contactNumber?: string;
  email?: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    productId: string;
  }[];
  totalCost: number;
  notes?: string;
  status: string; // e.g., "Pending", "Delivered", etc.
  deliveryDate?: Date | null;
  paymentDueDate?: Date | null;
  paymentStatus?: string; // e.g., "Paid", "Unpaid"
  createdAt: Date;
  updatedAt: Date;
  broughtBy: string;
}

export async function createOrder(orderData: Order & { items: { productId: string; quantity: number; price: number; productName: string }[] }) {
  try {
    // Fetch all products' cost prices in one query
    const productIds = orderData.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });
    const productCostMap: Record<string, number> = {};
    products.forEach(product => {
      productCostMap[product.id] = product.price;
    });

    // Calculate total profit for the order
    const totalProfit = orderData.items.reduce((total, item) => {
      const salesPrice = Number(item.price);
      const costPrice = productCostMap[item.productId] ?? 0;
      const quantity = Number(item.quantity);
      return total + (salesPrice - costPrice) * quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        customerName: orderData.customerName,
        customer: { connect: { id: orderData.customerId } },
        items: {
          create: orderData.items.map((item) => ({
            quantity: Number(item.quantity),
            price: Number(item.price),
            productName: item.productName,
            product: { connect: { id: item.productId } },
            cost: productCostMap[item.productId] ?? 0,
          })),
        },
        contactNumber: orderData.contactNumber,
        email: orderData.email,
        notes: orderData.notes,
        deliveryDate: orderData.deliveryDate,
        paymentDueDate: orderData.paymentDueDate,
        paymentStatus: orderData.paymentStatus,
        status: orderData.status,
        totalCost: orderData.totalCost,
        broughtBy: orderData.broughtBy,
        profit: totalProfit, // <-- Store profit here
      },
    });
    // Send confirmation email
    await sendOrderConfirmationEmail({
      to: orderData.email || '',
      customerName: orderData.customerName,
      orderId: order.id,
      items: orderData.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      total: orderData.totalCost,
    });
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  } finally {
    try {
      for (const item of orderData.items) {
        await prisma.product.update({
          where: {
            id: item.productId,
          },
          data: {
            quantity: {
              decrement: parseInt(item.quantity.toString(), 10),
            },
          },
        });
      }

      const ordersCost = await prisma.order.findMany({
        where: {
          customerId: orderData.customerId,
          paymentStatus: 'Unpaid',
        },
        select: {
          totalCost: true,
        },
      });

      const totalCost = ordersCost.reduce((total, order) => total + order.totalCost, 0);
      await prisma.customer.update({
        where: { id: orderData.customerId },
        data: { paymentPending: totalCost },
      });

    } catch (error) {
      console.error('Error updating product quantities:', error);
      throw new Error('Failed to update product quantities');
    }
  }
}

export async function updateOrder(
  orderId: string,
  orderData: Order & { items: { productId: string; quantity: number; price: number; productName: string }[] }
) {
  const productIds = orderData.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true },
  });
  const productCostMap: Record<string, number> = {};
  products.forEach(product => {
    productCostMap[product.id] = product.price;
  });

  const totalProfit = orderData.items.reduce((total, item) => {
    const salesPrice = Number(item.price);
    const costPrice = productCostMap[item.productId] ?? 0;
    const quantity = Number(item.quantity);
    return total + (salesPrice - costPrice) * quantity;
  }, 0);

  const oldOrderItems = await prisma.orderItem.findMany({
    where: { orderId },
  });

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  // Track which new items have had inventory decremented
  const decrementedProducts: { productId: string, quantity: number }[] = [];

  try {
    // 1. Restore inventory for old items
    for (const item of oldOrderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: { increment: parseInt(item.quantity.toString(), 10) },
        },
      });
    }

    // 2. Delete old order items
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    // 3. Update the order (without items)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        contactNumber: orderData.contactNumber,
        email: orderData.email,
        notes: orderData.notes,
        deliveryDate: orderData.deliveryDate,
        paymentDueDate: orderData.paymentDueDate,
        paymentStatus: orderData.paymentStatus,
        status: orderData.status,
        totalCost: orderData.totalCost,
        broughtBy: orderData.broughtBy,
        profit: totalProfit,
      },
    });

    // 4. Create new order items (separately)
    for (const item of orderData.items) {
      await prisma.orderItem.create({
        data: {
          orderId: orderId,
          quantity: Number(item.quantity),
          price: Number(item.price),
          productName: item.productName,
          productId: item.productId,
          cost: productCostMap[item.productId] ?? 0,
        },
      });
    }

    // 5. Decrement inventory for new items
    for (const item of orderData.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: parseInt(item.quantity.toString(), 10) },
        },
      });
      decrementedProducts.push({ productId: item.productId, quantity: Number(item.quantity) });
    }

    // 6. Update customer's paymentPending
    const ordersCost = await prisma.order.findMany({
      where: {
        customerId: orderData.customerId,
        paymentStatus: 'Unpaid',
      },
      select: { totalCost: true },
    });
    const totalCost = ordersCost.reduce((total, order) => total + order.totalCost, 0);
    await prisma.customer.update({
      where: { id: orderData.customerId },
      data: { paymentPending: totalCost },
    });

    return await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  } catch (error) {
    // Rollback inventory for new items if decremented
    if (decrementedProducts.length > 0) {
      for (const item of decrementedProducts) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      }
    }
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
}

export async function updateOrderStatus(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'Delivered',
      },
    });
    return order;
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
}

export async function updateOrderPaymentStatus(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId, paymentStatus: 'Unpaid' },
      data: {
        paymentStatus: 'Paid',
      },
    });

    const customerId = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    });

    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId.customerId },
        data: {
          paymentPending: {
            decrement: order.totalCost,
          },
        },
      });
    }
    
    return order;
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
}

// Function to get recent 5 orders

export async function getRecentOrders() {
  try {
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    return recentOrders;
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw new Error('Failed to fetch recent orders');
  }
}

export async function getTotalRevenueThisMonth() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Get all order items for orders created this month, including product cost
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: startOfMonth },
        paymentStatus: 'Paid',
      },
    },
    include: {
      product: true,
      order: true,
    }
  });

  // Calculate total revenue
  let totalRevenue = 0;
  for (const item of orderItems) {
    const salePrice = item.price;
    const costPrice = item.product?.price ?? 0;
    totalRevenue += (salePrice - costPrice) * item.quantity;
  }

  return totalRevenue;
}

// Function to get orders that are not delivered
export async function getUnfulfilledOrders() {
  try {
    const unfulfilledOrders = await prisma.order.count({
      where: {
        status: 'Pending',
      }
    });
    return unfulfilledOrders;
  } catch (error) {
    console.error('Error fetching unfulfilled orders:', error);
    throw new Error('Failed to fetch unfulfilled orders');
  }
}

// Function to get the monthly sales and profit
export async function getMonthlySalesAndProfit() {
  const currentDate = new Date();
  const orderData = [];

  for(let i = 0; i < 12; i++) {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);  
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        paymentStatus: 'Paid',
      },
      select:{
        totalCost: true,
        profit: true,
      }
    });
    let totalRevenue = 0;
    let totalProfit = 0;
    for (const order of orders) {
      totalRevenue += order.totalCost;
      totalProfit += order.profit ?? 0;
    }
    orderData.push({
      name: startOfMonth.toLocaleString('default', { month: 'long' }),
      sales: totalRevenue,
      profit: totalProfit,
    });
  }
  return orderData.reverse();
}

// function to get weekly sales and profit
export async function getWeeklySalesAndProfit() {
  const currentDate = new Date();
  const orderData = [];
  for (let i = 0; i < 31; i++) {
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i + 1);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        paymentStatus: 'Paid',
      },
      select: {
        totalCost: true,
        profit: true,
      },
    });
    let totalRevenue = 0;
    let totalProfit = 0;
    for (const order of orders) {
      totalRevenue += order.totalCost;
      totalProfit += order.profit ?? 0;
    }
    orderData.push({
      name: startOfDay.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
      sales: totalRevenue,
      profit: totalProfit,
    });
  }
  return orderData.reverse();
}


export async function getOrdersForMonth(startOfMonth : Date, endOfMonth : Date) {
  // Ensure startOfMonth and endOfMonth are valid Date objects
  try {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
}