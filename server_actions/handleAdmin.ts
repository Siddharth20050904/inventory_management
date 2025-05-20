"use server";

import bcrypt from "bcrypt";
import prisma from "../lib/prisma";

//Function to register admin
export async function registerAdmin(data: { username: string, email: string, password: string }) {
  try {

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const admin = await prisma.admin.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
      },
    });
    return admin;
  } catch (error) {
    console.error('Error registering admin:', error);
    throw new Error('Failed to register admin');
  }
}

//Function to login admin
export async function loginAdmin(data: { email: string, password: string }) {
  try {
    const admin = await prisma.admin.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    const isPasswordValid = await bcrypt.compare(data.password, admin.password);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    return admin;
  } catch (error) {
    console.error('Error logging in admin:', error);
    throw new Error('Failed to login admin');
  }
}