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