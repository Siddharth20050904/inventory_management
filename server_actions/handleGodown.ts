"use server";

import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

export async function getProducts({ limit = 10, offset = 0, search = "" } = {}) {
    const where = search
        ? {
            name: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
            },
        }
        : undefined;

    const products = await prisma.product.findMany({
        skip: offset,
        take: limit,
        where,
        orderBy: {
            lastUpdated: "desc",
        },
    });
    return products;
}

// Function to get all products
export async function getAllProducts() {
    const products = await prisma.product.findMany();
    return products;
}

export async function addProduct(formData: FormData) {
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const quantity = formData.get("quantity") as string;
    const description = formData.get("description") as string;
    const lastUpdated = new Date();
    if (!name || !price || !quantity || !description) {
        throw new Error("All fields are required");
    }

    const product = await prisma.product.create({
        data: {
            name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            description,
            lastUpdated,
        },
    });
    return product;
}

export async function updateProduct(formData: FormData) {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const quantity = formData.get("quantity") as string;
    const description = formData.get("description") as string;
    const lastUpdated = new Date();
    if (!id || !name || !price || !quantity || !description) {
        throw new Error("All fields are required");
    }

    const product = await prisma.product.update({
        where: { id },
        data: {
            name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            description,
            lastUpdated,
        },
    });
    return product;
}

export async function deleteProduct(id: string) {
    if (!id) {
        throw new Error("ID is required");
    }

    const product = await prisma.product.delete({
        where: { id },
    });
    return product;
}

export async function getTotalProducts() {
    const totalProducts = await prisma.product.count();
    return totalProducts;
}

// Function to get total value of inverntory
export async function getTotalInventoryValue() {
    const products = await prisma.product.findMany({
        select: {
            price: true,
            quantity: true,
        },
    });
    const totalValue = products.reduce((sum, product) => {
        return sum + (product.price * product.quantity);
    }, 0);
    return totalValue;
}

// Function to get total number of products
export async function getTotalNumberOfProducts() {
    const totalCount = await prisma.product.count();
    return totalCount;
}