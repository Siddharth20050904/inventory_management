"use server";

import prisma from "../lib/prisma";

export async function getPurchaseOrders({limit = 10, offset = 0, searchTerm = ""}: {limit?: number, offset?: number, searchTerm?: string}) {
  try {
    const orders = await prisma.buyerOrder.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        supplierName: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      take: limit,
      skip: offset,
    });
    return orders;
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

export async function postPurchaseOrder(
    orderData: {
        supplierName: string;
        items : {
            productName: string;
            quantity: number;
            price: number;
            productId: string;
        }[];
        totalCost: number;
        notes: string;
        deliveryDate: Date;
        paymentDueDate: Date;
        paymentStatus: string;
    },
) {
  try {
    // Create a new purchase order in the database
    const order = await prisma.buyerOrder.create({
        data: {
            supplierName: orderData.supplierName,
            totalCost: orderData.totalCost,
            notes: orderData.notes,
            deliveryDate: orderData.deliveryDate,
            paymentDueDate: orderData.paymentDueDate,
            paymentStatus: orderData.paymentStatus,
            items: {
            create: orderData.items.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                productId: item.productId
            }))
            }
        },
        include:{
            items: true
        }
    });

    orderData.items.forEach(item => {
        // Update the stock of each product in the inventory
        prisma.product.update({
            where: { id: item.productId },
            data: {
                quantity: {
                    increment: item.quantity,
                },
            },
        }).catch(error => {
            console.error(`Error updating stock for product ${item.productId}:`, error);
        });
    })

    // Return success response
    return order;
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return null;
  }
}

export async function updatePurchaseOrderDeliveryStatus(orderId: string, status: string) {
  try {
    const updatedOrder = await prisma.buyerOrder.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });
    return updatedOrder;
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    return null;
  }
}

export async function updatePurchaseOrderPaymentStatus(orderId: string, status: string) {
  try {
    const updatedOrder = await prisma.buyerOrder.update({
      where: { id: orderId },
      data: { paymentStatus: status },
      include: { items: true },
    });
    return updatedOrder;
  } catch (error) {
    console.error("Error updating purchase order payment status:", error);
    return null;
  }
}

// Function to update purchase order details
export async function updatePurchaseOrderDetails(orderId: string, orderData: {
  supplierName?: string;
  items?: {
    productName?: string;
    quantity?: number;
    price?: number;
    productId?: string;
  }[];
  totalCost?: number;
  notes?: string;
  deliveryDate?: Date;
  paymentDueDate?: Date;
  paymentStatus?: string;
  status?: string;
}) {
  try {

    const prevItems = await prisma.buyerOrderItem.findMany({
      where: { orderId }
    });

    // Decrement stock for previous items
    for (const item of prevItems) {
      if (item.productId && item.quantity) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        }).catch(error => {
          console.error(`Error updating stock for product ${item.productId}:`, error);
        });
      }
    }

    // Delete previous items if they exist
    if (prevItems.length > 0) {
      await prisma.buyerOrderItem.deleteMany({
        where: { orderId }
      });
    }

    // Update the purchase order and its items in the database
    await prisma.buyerOrder.delete({
      where: { id: orderId },
    });

    const updatedOrder = await prisma.buyerOrder.create({
      data: {
        id: orderId,
        supplierName: orderData.supplierName || "",
        totalCost: orderData.totalCost || 0,
        notes: orderData.notes || "",
        status: orderData.status || "Pending",
        deliveryDate: orderData.deliveryDate || new Date(),
        paymentDueDate: orderData.paymentDueDate || new Date(),
        paymentStatus: orderData.paymentStatus || "Unpaid",
        items: {
          create: orderData.items?.map(item => ({
            productName: item.productName!,
            quantity: item.quantity!,
            price: item.price!,
            product: {
              connect: { id: item.productId! }
            }
          })) || []
        }
      },
      include: {
        items: true,
      },
    });

    // Increment stock for new items
    for (const item of orderData.items || []) {
      if (item.productId && item.quantity) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        }).catch(error => {
          console.error(`Error updating stock for product ${item.productId}:`, error);
        });
      }
    }

    return updatedOrder;
  } catch (error) {
    console.error("Error updating purchase order details:", error);
    return null;
  }
}