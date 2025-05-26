import nodemailer from "nodemailer";

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderId,
  items,
  total,
}: {
  to: string;
  customerName: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}) {
  // Configure your SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Build the order items HTML
  const itemsHtml = items
    .map(
      (item) =>
        `<li>${item.name} (x${item.quantity}) - ₹${item.price.toLocaleString()}</li>`
    )
    .join("");

  // Email content
  const mailOptions = {
    from: `"Shree Enterprise" <${process.env.SMTP_USER}>`,
    to,
    subject: `Order Confirmation`,
    html: `
      <h2>Thank you for your order, ${customerName}!</h2>
      <p>Your order <b>#${orderId}</b> has been placed successfully.</p>
      <ul>${itemsHtml}</ul>
      <p><b>Total:</b> ₹${total.toLocaleString()}</p>
      <p>We appreciate your business!</p>
    `,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}