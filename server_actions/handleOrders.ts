"use server";

// Removed OrderItem import as it is not exported from '@prisma/client'
import prisma from '../lib/prisma';

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
}

export async function createOrder(orderData: Order & { items: { productId: string; quantity: number; price: number; productName: string }[] }) {
  try {
    const order = await prisma.order.create({
      data: {
        customerName: orderData.customerName,
        customer: { connect: { id: orderData.customerId } },
        items: {
          create: orderData.items.map((item) => ({
            quantity: parseInt(item.quantity.toString(), 10),
            price: parseInt(item.price.toString(), 10),
            productName: item.productName,
            product: { connect: { id: item.productId } },
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
      },
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

export async function updateOrder(orderId: string, orderData: Order & { items: { productId: string; quantity: number; price: number; productName: string }[] }) {
  try {
    // Delete all existing items for the order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    // Create new items
    const order = await prisma.order.update({
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
        items: {
          create: orderData.items.map((item) => ({
            quantity: parseInt(item.quantity.toString(), 10),
            price: parseInt(item.price.toString(), 10),
            productName: item.productName,
            product: { connect: { id: item.productId } },
          })),
        },
      },
    });

    // Update product quantities and customer paymentPending
    for (const item of orderItems) {
      // Update product quantities
      await prisma.product.update({
        where: {
          id: item.productId, // Match the product by its ID
        },
        data: {
          quantity: {
            increment: parseInt(item.quantity.toString(), 10), // Increment by the old quantity
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

    return order;
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  } finally {
    try {
      for (const item of orderData.items) {
        await prisma.product.update({
          where: {
            id: item.productId, // Match the product by its ID
          },
          data: {
            quantity: {
              decrement: parseInt(item.quantity.toString(), 10), // Decrement by the ordered quantity
            },
          },
        });
      }
    } catch (error) {
      console.error('Error updating product quantities:', error);
      throw new Error('Failed to update product quantities');
    }
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