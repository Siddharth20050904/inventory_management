"use server";

import prisma from "../lib/prisma";

export async function getProducts() {
    const products = await prisma.product.findMany({});
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