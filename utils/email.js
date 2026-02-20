import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (options) => {
  try {
    // డైరెక్ట్ గా Brevo API కి రిక్వెస్ట్ పంపుతున్నాం
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY, // మీ సీక్రెట్ కీ ఇక్కడ వాడతాం
      },
      body: JSON.stringify({
        sender: {
          name: "Varshini Hyundai Spares",
          email: process.env.BREVO_SENDER_EMAIL, // Brevo లో మీరు ఏ మెయిల్ తో రిజిస్టర్ అయ్యారో అదే ఇవ్వాలి
        },
        to: [
          {
            email: options.email, // యూజర్ ఈమెయిల్
          },
        ],
        subject: options.subject,
        // html లేకపోతే నార్మల్ మెసేజ్ ని పంపిస్తాం
        htmlContent:
          options.html ||
          `<p style="font-size: 16px; color: #333;">${options.message.replace(/\n/g, "<br>")}</p>`,
        textContent: options.message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Brevo API Error Details:", errorData);
      throw new Error(errorData.message || "Email sending failed at Brevo");
    }

    const data = await response.json();
    console.log(
      "✅ Email sent successfully via Brevo, MessageId:",
      data.messageId,
    );
    return true;
  } catch (error) {
    console.error("❌ Brevo Catch Error:", error.message);
    throw new Error(error.message);
  }
};

/**
 * 3. HTML Template Generator (For Cart Recovery)
 * ఇది ఆప్షనల్, కార్ట్ ఈమెయిల్స్ పంపేటప్పుడు ఇది వాడతాం.
 */
export const generateCartEmailTemplate = (userName, items) => {
  const itemsHtml = items
    .map(
      (item) => `
    <div style="border-bottom: 1px solid #eee; padding: 15px 0; display: flex; align-items: center;">
      <img src="${item.product.images?.[0]?.url || "https://via.placeholder.com/60"}" 
           alt="${item.product.name}" 
           style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px; border: 1px solid #ddd;">
      <div>
        <h4 style="margin: 0; color: #333; font-size: 16px;">${item.product.name}</h4>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">
           Qty: <strong>${item.quantity}</strong> | Price: <strong>₹${item.price}</strong>
        </p>
      </div>
    </div>
  `,
    )
    .join("");

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2563eb; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Varshini Hyundai Spares</h2>
      </div>
      <div style="padding: 30px 20px;">
        <h3 style="color: #333; margin-top: 0;">Hi ${userName},</h3>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          We noticed you left some items in your cart. Complete your order now!
        </p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 25px 0;">
          <h4 style="margin-top: 0; color: #444; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Items waiting for you:</h4>
          ${itemsHtml}
        </div>
        <div style="text-align: center; margin-top: 35px; margin-bottom: 20px;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/cart" 
             style="background-color: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
             Resume Checkout &rarr;
          </a>
        </div>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Varshini Hyundai Spares.</p>
      </div>
    </div>
  `;
};

export default sendEmail;
