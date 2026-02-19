// import PDFDocument from "pdfkit";
// import fs from "fs";
// import path from "path";

// const COLORS = {
//   primary: "#002c5f", // Deep Navy Blue
//   accent: "#00aad2", // Cyan
//   text: "#333333", // Dark Gray
//   white: "#ffffff",
//   headerBg: "#f4f4f4", // Table Header Background
//   border: "#e0e0e0", // Light Gray Border
// };

// const formatCurrency = (amount) => `INR ${Number(amount).toFixed(2)}`;

// export const generateInvoice = async (order) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const invoicesDir = path.join(process.cwd(), "invoices");
//       if (!fs.existsSync(invoicesDir))
//         fs.mkdirSync(invoicesDir, { recursive: true });

//       const invoiceNumber = order.invoiceNumber || `INV-${order.orderNumber}`;
//       const filePath = path.join(invoicesDir, `${invoiceNumber}.pdf`);

//       const doc = new PDFDocument({ margin: 40, size: "A4" });
//       const stream = fs.createWriteStream(filePath);

//       doc.pipe(stream);

//       // ================= 1. HEADER (BLUE BOX) =================
//       // బాక్స్ హైట్ ఫిక్స్డ్ గా 160px పెట్టాము
//       doc.rect(0, 0, 595, 160).fill(COLORS.primary);

//       // --- A. Company Details (Left Side) ---
//       doc
//         .fillColor(COLORS.white)
//         .fontSize(22)
//         .font("Helvetica-Bold")
//         .text("VARSHINI HYUNDAI SPARES", 40, 40);

//       doc
//         .fontSize(10)
//         .font("Helvetica")
//         .fillColor("#eeeeee")
//         .text("123 Auto Parts Street, Uppal", 40, 70)
//         .text("Hyderabad, Telangana - 532428", 40, 85)
//         .text("GSTIN: 27AABCU9603R1ZM", 40, 100)
//         .text("support@varshinihyundai.com", 40, 115);

//       // --- B. Invoice Meta Details (Right Side - FIXED LAYOUT) ---
//       // ఇక్కడ మనం X-Coordinates ని మార్చాము.
//       // Label X: 300 (Start) -> Width 100 -> Ends at 400
//       // Value X: 410 (Start) -> Width 145 -> Ends at 555 (Page Edge)
//       // దీనివల్ల రెండింటి మధ్య 10px గ్యాప్ ఖచ్చితంగా ఉంటుంది.

//       const labelX = 300;
//       const valueX = 410;
//       const labelWidth = 100;
//       const valueWidth = 145; // Long Order ID కి సరిపడా స్పేస్
//       let metaY = 45;

//       doc.fillColor(COLORS.white);

//       // TITLE
//       doc
//         .fontSize(20)
//         .font("Helvetica-Bold")
//         .text("INVOICE", labelX, 40, {
//           width: labelWidth + valueWidth,
//           align: "right",
//         });

//       metaY += 35; // Title కింద గ్యాప్

//       // 1. Invoice No
//       doc
//         .fontSize(10)
//         .font("Helvetica-Bold")
//         .text("Invoice No:", labelX, metaY, {
//           width: labelWidth,
//           align: "right",
//         });
//       doc
//         .font("Helvetica")
//         .text(invoiceNumber, valueX, metaY, {
//           width: valueWidth,
//           align: "right",
//         });

//       metaY += 18;

//       // 2. Date
//       doc
//         .font("Helvetica-Bold")
//         .text("Date:", labelX, metaY, { width: labelWidth, align: "right" });
//       doc
//         .font("Helvetica")
//         .text(
//           new Date(order.createdAt).toLocaleDateString("en-IN"),
//           valueX,
//           metaY,
//           { width: valueWidth, align: "right" },
//         );

//       metaY += 18;

//       // 3. Order ID (Font size 9px for safety)
//       doc
//         .font("Helvetica-Bold")
//         .fontSize(10)
//         .text("Order ID:", labelX, metaY, {
//           width: labelWidth,
//           align: "right",
//         });
//       doc
//         .font("Helvetica")
//         .fontSize(9)
//         .text(order.orderNumber, valueX, metaY + 1, {
//           width: valueWidth,
//           align: "right",
//         });

//       metaY += 18;

//       // 4. Payment
//       doc
//         .font("Helvetica-Bold")
//         .fontSize(10)
//         .text("Payment:", labelX, metaY, { width: labelWidth, align: "right" });
//       doc
//         .font("Helvetica")
//         .text(order.paymentMethod, valueX, metaY, {
//           width: valueWidth,
//           align: "right",
//         });

//       // ================= 2. ADDRESS SECTION =================
//       const addrY = 190; // బ్లూ హెడర్ బాక్స్ (160px) కింద గ్యాప్ ఇచ్చి స్టార్ట్ అవుతుంది
//       const colWidth = 220; // అడ్రస్ వెడల్పు పెంచాము

//       // Billing Column
//       doc
//         .fillColor(COLORS.primary)
//         .fontSize(12)
//         .font("Helvetica-Bold")
//         .text("BILLED TO", 40, addrY);

//       doc
//         .fillColor(COLORS.text)
//         .fontSize(10)
//         .font("Helvetica")
//         .text(order.user.name, 40, addrY + 20, { width: colWidth })
//         .text(order.user.email, 40, addrY + 35, { width: colWidth })
//         .text(order.shippingAddress.phone, 40, addrY + 50, { width: colWidth });

//       // Shipping Column (X moved to 300 for separation)
//       doc
//         .fillColor(COLORS.primary)
//         .fontSize(12)
//         .font("Helvetica-Bold")
//         .text("SHIPPED TO", 320, addrY);

//       doc
//         .fillColor(COLORS.text)
//         .fontSize(10)
//         .font("Helvetica")
//         .text(order.shippingAddress.street, 320, addrY + 20, {
//           width: colWidth,
//         })
//         .text(
//           `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
//           320,
//           doc.y,
//           { width: colWidth },
//         )
//         .text(`PIN: ${order.shippingAddress.pincode}`, 320, doc.y, {
//           width: colWidth,
//         });

//       // ================= 3. ITEMS TABLE =================
//       let tableY = 310; // అడ్రస్ కింద గ్యాప్

//       // Header Background
//       doc.rect(40, tableY, 515, 25).fill(COLORS.headerBg);

//       // Header Text
//       doc.fillColor(COLORS.primary).fontSize(9).font("Helvetica-Bold");
//       doc.text("#", 50, tableY + 8);
//       doc.text("ITEM DESCRIPTION", 80, tableY + 8);
//       doc.text("PART NO.", 280, tableY + 8);
//       doc.text("QTY", 380, tableY + 8, { width: 30, align: "center" });
//       doc.text("PRICE", 430, tableY + 8, { width: 50, align: "right" });
//       doc.text("TOTAL", 495, tableY + 8, { width: 50, align: "right" });

//       tableY += 30; // Start Rows

//       // Rows
//       doc.fillColor(COLORS.text).font("Helvetica");

//       order.items.forEach((item, i) => {
//         // Page Break Logic
//         if (tableY > 700) {
//           doc.addPage();
//           tableY = 50;
//         }

//         const y = tableY;

//         doc.text((i + 1).toString(), 50, y);
//         doc.text(item.name.substring(0, 40), 80, y, { width: 190 }); // Limit name wrap
//         doc.text(item.partNumber, 280, y);
//         doc.text(item.quantity.toString(), 380, y, {
//           width: 30,
//           align: "center",
//         });
//         doc.text(item.price.toFixed(2), 430, y, { width: 50, align: "right" });
//         doc.text(item.subtotal.toFixed(2), 495, y, {
//           width: 50,
//           align: "right",
//         });

//         // Divider Line
//         doc
//           .strokeColor(COLORS.border)
//           .lineWidth(0.5)
//           .moveTo(40, y + 20)
//           .lineTo(555, y + 20)
//           .stroke();

//         tableY += 30;
//       });

//       // ================= 4. SUMMARY & TOTALS =================
//       tableY += 15;
//       const sumLabelX = 350;
//       const sumValueX = 455;

//       doc.fontSize(10);

//       // Subtotal
//       doc.text("Subtotal:", sumLabelX, tableY, { align: "right", width: 100 });
//       doc.text(formatCurrency(order.subtotal), sumValueX, tableY, {
//         align: "right",
//         width: 90,
//       });
//       tableY += 20;

//       // Shipping
//       doc.text("Shipping:", sumLabelX, tableY, { align: "right", width: 100 });
//       doc.text(formatCurrency(order.shippingCharges), sumValueX, tableY, {
//         align: "right",
//         width: 90,
//       });
//       tableY += 20;

//       // Tax
//       doc.text(`GST (${order.taxPercentage}%):`, sumLabelX, tableY, {
//         align: "right",
//         width: 100,
//       });
//       doc.text(formatCurrency(order.tax), sumValueX, tableY, {
//         align: "right",
//         width: 90,
//       });
//       tableY += 30;

//       // TOTAL BOX
//       doc.rect(sumLabelX, tableY - 8, 205, 35).fill(COLORS.primary);
//       doc.fillColor(COLORS.white).fontSize(12).font("Helvetica-Bold");

//       doc.text("TOTAL PAID", sumLabelX + 10, tableY + 4);
//       doc.text(formatCurrency(order.totalAmount), sumValueX, tableY + 4, {
//         align: "right",
//         width: 90,
//       });

//       // ================= 5. FOOTER =================
//       const footerY = 750;
//       doc
//         .strokeColor(COLORS.border)
//         .lineWidth(1)
//         .moveTo(40, footerY)
//         .lineTo(555, footerY)
//         .stroke();

//       doc
//         .fillColor("#777777")
//         .fontSize(8)
//         .font("Helvetica")
//         .text("Thank you for your business!", 40, footerY + 10, {
//           align: "center",
//           width: 515,
//         });

//       doc.end();
//       stream.on("finish", () => resolve(filePath));
//       stream.on("error", (err) => reject(err));
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// export const deleteInvoice = async (filePath) => {
//   try {
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//   } catch (error) {
//     console.error(error);
//   }
// };

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const COLORS = {
  primary: "#002c5f", // Deep Navy Blue
  accent: "#00aad2", // Cyan
  text: "#333333", // Dark Gray
  white: "#ffffff",
  headerBg: "#f4f4f4", // Table Header Background
  border: "#e0e0e0", // Light Gray Border
};

const formatCurrency = (amount) => `INR ${Number(amount).toFixed(2)}`;

export const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(process.cwd(), "invoices");
      if (!fs.existsSync(invoicesDir))
        fs.mkdirSync(invoicesDir, { recursive: true });

      const invoiceNumber = order.invoiceNumber || `INV-${order.orderNumber}`;
      const filePath = path.join(invoicesDir, `${invoiceNumber}.pdf`);

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // ================= 1. HEADER (BLUE BOX) =================
      doc.rect(0, 0, 595, 160).fill(COLORS.primary);

      // --- A. Company Details (Left Side) ---
      doc
        .fillColor(COLORS.white)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("VARSHINI HYUNDAI SPARES", 40, 40);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#eeeeee")
        .text("123 Auto Parts Street, Uppal", 40, 70)
        .text("Hyderabad, Telangana - 532428", 40, 85)
        .text("GSTIN: 27AABCU9603R1ZM", 40, 100)
        .text("support@varshinihyundai.com", 40, 115);

      // --- B. Invoice Meta Details (Right Side) ---
      const labelX = 300;
      const valueX = 410;
      const labelWidth = 100;
      const valueWidth = 145;
      let metaY = 45;

      doc.fillColor(COLORS.white);

      // TITLE
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("INVOICE", labelX, 40, {
          width: labelWidth + valueWidth,
          align: "right",
        });

      metaY += 35; // Title కింద గ్యాప్

      // 1. Invoice No
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Invoice No:", labelX, metaY, {
          width: labelWidth,
          align: "right",
        });
      doc.font("Helvetica").text(invoiceNumber, valueX, metaY, {
        width: valueWidth,
        align: "right",
      });

      metaY += 18;

      // 2. Date
      doc
        .font("Helvetica-Bold")
        .text("Date:", labelX, metaY, { width: labelWidth, align: "right" });
      doc
        .font("Helvetica")
        .text(
          new Date(order.createdAt).toLocaleDateString("en-IN"),
          valueX,
          metaY,
          { width: valueWidth, align: "right" },
        );

      metaY += 18;

      // 3. Order ID
      doc.font("Helvetica-Bold").fontSize(10).text("Order ID:", labelX, metaY, {
        width: labelWidth,
        align: "right",
      });
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(order.orderNumber, valueX, metaY + 1, {
          width: valueWidth,
          align: "right",
        });

      metaY += 18;

      // 4. Payment Method
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Payment:", labelX, metaY, { width: labelWidth, align: "right" });
      doc.font("Helvetica").text(order.paymentMethod, valueX, metaY, {
        width: valueWidth,
        align: "right",
      });

      // 🔥 NEW: 5. Transaction ID (Only for Razorpay / Online Payments)
      if (
        order.paymentMethod === "Razorpay" &&
        order.paymentDetails?.razorpayPaymentId
      ) {
        metaY += 18;
        doc
          .font("Helvetica-Bold")
          .text("Txn ID:", labelX, metaY, {
            width: labelWidth,
            align: "right",
          });
        doc
          .font("Helvetica")
          .fontSize(8) // కాస్త చిన్నగా ఇస్తున్నాం ఎందుకంటే ID పెద్దగా ఉంటుంది
          .text(order.paymentDetails.razorpayPaymentId, valueX, metaY + 1, {
            width: valueWidth,
            align: "right",
          });
      }

      // ================= 2. ADDRESS SECTION =================
      const addrY = 190;
      const colWidth = 220;

      // Billing Column
      doc
        .fillColor(COLORS.primary)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("BILLED TO", 40, addrY);

      doc
        .fillColor(COLORS.text)
        .fontSize(10)
        .font("Helvetica")
        .text(order.user.name, 40, addrY + 20, { width: colWidth })
        .text(order.user.email, 40, addrY + 35, { width: colWidth })
        .text(order.shippingAddress.phone, 40, addrY + 50, { width: colWidth });

      // Shipping Column
      doc
        .fillColor(COLORS.primary)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("SHIPPED TO", 320, addrY);

      doc
        .fillColor(COLORS.text)
        .fontSize(10)
        .font("Helvetica")
        .text(order.shippingAddress.street, 320, addrY + 20, {
          width: colWidth,
        })
        .text(
          `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
          320,
          doc.y,
          { width: colWidth },
        )
        .text(`PIN: ${order.shippingAddress.pincode}`, 320, doc.y, {
          width: colWidth,
        });

      // ================= 3. ITEMS TABLE =================
      let tableY = 310;

      // Header Background
      doc.rect(40, tableY, 515, 25).fill(COLORS.headerBg);

      // Header Text
      doc.fillColor(COLORS.primary).fontSize(9).font("Helvetica-Bold");
      doc.text("#", 50, tableY + 8);
      doc.text("ITEM DESCRIPTION", 80, tableY + 8);
      doc.text("PART NO.", 280, tableY + 8);
      doc.text("QTY", 380, tableY + 8, { width: 30, align: "center" });
      doc.text("PRICE", 430, tableY + 8, { width: 50, align: "right" });
      doc.text("TOTAL", 495, tableY + 8, { width: 50, align: "right" });

      tableY += 30; // Start Rows

      // Rows
      doc.fillColor(COLORS.text).font("Helvetica");

      order.items.forEach((item, i) => {
        // Page Break Logic
        if (tableY > 700) {
          doc.addPage();
          tableY = 50;
        }

        const y = tableY;

        doc.text((i + 1).toString(), 50, y);
        doc.text(item.name.substring(0, 40), 80, y, { width: 190 });
        doc.text(item.partNumber, 280, y);
        doc.text(item.quantity.toString(), 380, y, {
          width: 30,
          align: "center",
        });
        doc.text(item.price.toFixed(2), 430, y, { width: 50, align: "right" });
        doc.text(item.subtotal.toFixed(2), 495, y, {
          width: 50,
          align: "right",
        });

        // Divider Line
        doc
          .strokeColor(COLORS.border)
          .lineWidth(0.5)
          .moveTo(40, y + 20)
          .lineTo(555, y + 20)
          .stroke();

        tableY += 30;
      });

      // ================= 4. SUMMARY & TOTALS =================
      tableY += 15;
      const sumLabelX = 350;
      const sumValueX = 455;

      doc.fontSize(10);

      // Subtotal
      doc.text("Subtotal:", sumLabelX, tableY, { align: "right", width: 100 });
      doc.text(formatCurrency(order.subtotal), sumValueX, tableY, {
        align: "right",
        width: 90,
      });
      tableY += 20;

      // Shipping
      doc.text("Shipping:", sumLabelX, tableY, { align: "right", width: 100 });
      doc.text(formatCurrency(order.shippingCharges), sumValueX, tableY, {
        align: "right",
        width: 90,
      });
      tableY += 20;

      // Tax
      doc.text(`GST (${order.taxPercentage}%):`, sumLabelX, tableY, {
        align: "right",
        width: 100,
      });
      doc.text(formatCurrency(order.tax), sumValueX, tableY, {
        align: "right",
        width: 90,
      });
      tableY += 30;

      // TOTAL BOX
      doc.rect(sumLabelX, tableY - 8, 205, 35).fill(COLORS.primary);
      doc.fillColor(COLORS.white).fontSize(12).font("Helvetica-Bold");

      // 🔥 NEW: Display "TOTAL PAID" for Razorpay and "AMOUNT DUE" for COD
      const totalText =
        order.paymentMethod === "Razorpay" ? "TOTAL PAID" : "AMOUNT DUE";

      doc.text(totalText, sumLabelX + 10, tableY + 4);
      doc.text(formatCurrency(order.totalAmount), sumValueX, tableY + 4, {
        align: "right",
        width: 90,
      });

      // ================= 5. FOOTER =================
      const footerY = 750;
      doc
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .moveTo(40, footerY)
        .lineTo(555, footerY)
        .stroke();

      doc
        .fillColor("#777777")
        .fontSize(8)
        .font("Helvetica")
        .text("Thank you for your business!", 40, footerY + 10, {
          align: "center",
          width: 515,
        });

      // 🔥 NEW: Add a small note for Razorpay payments
      if (order.paymentMethod === "Razorpay") {
        doc.text(
          "This is a computer-generated invoice for your online payment. No signature is required.",
          40,
          footerY + 22,
          {
            align: "center",
            width: 515,
          },
        );
      }

      doc.end();
      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

export const deleteInvoice = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error(error);
  }
};
