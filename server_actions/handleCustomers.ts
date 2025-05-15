"use server";

import prisma from "../lib/prisma";

export async function addCustomer(formData: FormData) {
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();
  const address = formData.get("address")?.toString();

  if (!name || !email || !phone || !address) {
    throw new Error("All fields are required");
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone,
      address,
    },
  });
  return customer;
}

export async function updateCustomer(formData: FormData){
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();
  const address = formData.get("address")?.toString();

  if (!id || !name || !email || !phone || !address) {
    throw new Error("All fields are required");
  }

  return await prisma.customer.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      address,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });
}

export async function getCustomers() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      paymentPending: true,
    },
  });

  return customers;
}

export async function deleteCustomer(id: string) {
  return await prisma.customer.delete({
    where: { id },
  });
}