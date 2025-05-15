"use server";

// Removed OrderItem import as it is not exported from '@prisma/client'
import prisma from '../lib/prisma';


export async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      where:{
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        }
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
    } catch (error) {
      console.error('Error updating product quantities:', error);
      throw new Error('Failed to update product quantities');
    } finally {
      try {

        await prisma.customer.update({
          where: {
            id: orderData.customerId,
          },
          data: {
            paymentPending: {
              increment: parseInt(orderData.totalCost.toString(), 10),
            },
          },
        });
      } catch (error) {
        console.error('Error updating customer orders in createOrder:', error);
        throw new Error('Failed to update customer orders');
      }
    }
  }
}

export async function updateOrder(orderId: string, orderData: Order & { items: { productId: string; quantity: number; price: number; productName: string }[] }) {
  try {
    // Delete all existing items for the order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });
    for (const item of orderItems) {
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
            price: item.price,
            productName: item.productName,
            product: { connect: { id: item.productId } },
          })),
        },
      },
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

export async function updateOrderStatus(orderId: string){
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
