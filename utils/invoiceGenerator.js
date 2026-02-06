// import PDFDocument from 'pdfkit';
// import fs from 'fs';
// import path from 'path';

// /**
//  * Generate Invoice PDF for Order
//  * Creates a professional GST invoice with order details
//  * @param {Object} order - Order object with populated user
//  * @returns {Promise<string>} - Path to generated PDF file
//  */
// export const generateInvoice = async (order) => {
//   return new Promise((resolve, reject) => {
//     try {
//       // Create invoices directory if it doesn't exist
//       const invoicesDir = path.join(process.cwd(), 'invoices');
//       if (!fs.existsSync(invoicesDir)) {
//         fs.mkdirSync(invoicesDir, { recursive: true });
//       }

//       // Generate invoice number if not exists
//       const invoiceNumber = order.invoiceNumber || `INV-${order.orderNumber}`;
//       const fileName = `${invoiceNumber}.pdf`;
//       const filePath = path.join(invoicesDir, fileName);

//       // Create PDF document
//       const doc = new PDFDocument({ margin: 50 });
//       const stream = fs.createWriteStream(filePath);

//       doc.pipe(stream);

//       // Header - Company Info
//       doc
//         .fontSize(20)
//         .font('Helvetica-Bold')
//         .text('VARSHINI HYUNDAI SPARES', 50, 50);

//       doc
//         .fontSize(10)
//         .font('Helvetica')
//         .text('Authorized Spare Parts Dealer', 50, 75)
//         .text('123 Auto Parts Street, HYDERABAD, UPPAL 532428', 50, 90)
//         .text('Phone: +91 98765 43210', 50, 105)
//         .text('Email: varshinihyundai@gmail.com', 50, 120)
//         .text('GSTIN: 27AABCU9603R1ZM', 50, 135);

//       // Invoice Title
//       doc
//         .fontSize(20)
//         .font('Helvetica-Bold')
//         .text('TAX INVOICE', 400, 50, { align: 'right' });

//       // Invoice Details Box
//       doc
//         .fontSize(10)
//         .font('Helvetica')
//         .text(`Invoice No: ${invoiceNumber}`, 400, 75, { align: 'right' })
//         .text(`Order No: ${order.orderNumber}`, 400, 90, { align: 'right' })
//         .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 105, { align: 'right' })
//         .text(`Payment: ${order.paymentMethod}`, 400, 120, { align: 'right' });

//       // Line separator
//       doc
//         .moveTo(50, 160)
//         .lineTo(545, 160)
//         .stroke();

//       // Billing Information
//       doc
//         .fontSize(12)
//         .font('Helvetica-Bold')
//         .text('Bill To:', 50, 180);

//       doc
//         .fontSize(10)
//         .font('Helvetica')
//         .text(order.user.name, 50, 200)
//         .text(order.user.email, 50, 215)
//         .text(`Phone: ${order.shippingAddress.phone}`, 50, 230);

//       // Shipping Address
//       doc
//         .fontSize(12)
//         .font('Helvetica-Bold')
//         .text('Ship To:', 50, 255);

//       doc
//         .fontSize(10)
//         .font('Helvetica')
//         .text(order.shippingAddress.street, 50, 275)
//         .text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`, 50, 290)
//         .text(`PIN: ${order.shippingAddress.pincode}`, 50, 305);

//       // Table Header
//       const tableTop = 350;
//       doc
//         .fontSize(10)
//         .font('Helvetica-Bold');

//       doc
//         .text('Item', 50, tableTop)
//         .text('Part No.', 200, tableTop)
//         .text('Qty', 300, tableTop, { width: 50, align: 'center' })
//         .text('Price', 360, tableTop, { width: 80, align: 'right' })
//         .text('Amount', 450, tableTop, { width: 95, align: 'right' });

//       // Line under header
//       doc
//         .moveTo(50, tableTop + 15)
//         .lineTo(545, tableTop + 15)
//         .stroke();

//       // Table Items
//       let yPosition = tableTop + 25;
//       doc.font('Helvetica');

//       order.items.forEach((item, index) => {
//         // Check if we need a new page
//         if (yPosition > 700) {
//           doc.addPage();
//           yPosition = 50;
//         }

//         doc
//           .fontSize(9)
//           .text(item.name.substring(0, 30), 50, yPosition, { width: 140 })
//           .text(item.partNumber, 200, yPosition)
//           .text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'center' })
//           .text(`₹${item.price.toFixed(2)}`, 360, yPosition, { width: 80, align: 'right' })
//           .text(`₹${item.subtotal.toFixed(2)}`, 450, yPosition, { width: 95, align: 'right' });

//         yPosition += 25;
//       });

//       // Summary section
//       yPosition += 10;
//       doc
//         .moveTo(50, yPosition)
//         .lineTo(545, yPosition)
//         .stroke();

//       yPosition += 15;

//       // Subtotal
//       doc
//         .fontSize(10)
//         .font('Helvetica')
//         .text('Subtotal:', 360, yPosition)
//         .text(`₹${order.subtotal.toFixed(2)}`, 450, yPosition, { width: 95, align: 'right' });

//       yPosition += 20;

//       // Shipping
//       doc
//         .text('Shipping:', 360, yPosition)
//         .text(`₹${order.shippingCharges.toFixed(2)}`, 450, yPosition, { width: 95, align: 'right' });

//       yPosition += 20;

//       // Tax
//       doc
//         .text(`GST (${order.taxPercentage}%):`, 360, yPosition)
//         .text(`₹${order.tax.toFixed(2)}`, 450, yPosition, { width: 95, align: 'right' });

//       yPosition += 20;

//       // Total
//       doc
//         .fontSize(12)
//         .font('Helvetica-Bold')
//         .text('Total Amount:', 360, yPosition)
//         .text(`₹${order.totalAmount.toFixed(2)}`, 450, yPosition, { width: 95, align: 'right' });

//       // Footer
//       const footerTop = 720;
//       doc
//         .fontSize(8)
//         .font('Helvetica-Oblique')
//         .text(
//           'Thank you for your business!',
//           50,
//           footerTop,
//           { align: 'center', width: 495 }
//         )
//         .text(
//           'This is a computer-generated invoice and does not require a signature.',
//           50,
//           footerTop + 15,
//           { align: 'center', width: 495 }
//         );

//       // Finalize PDF
//       doc.end();

//       // Wait for stream to finish
//       stream.on('finish', () => {
//         resolve(filePath);
//       });

//       stream.on('error', (error) => {
//         reject(error);
//       });

//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// /**
//  * Delete Invoice File
//  * @param {string} filePath - Path to invoice file
//  */
// export const deleteInvoice = async (filePath) => {
//   try {
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       console.log(`Invoice deleted: ${filePath}`);
//     }
//   } catch (error) {
//     console.error(`Error deleting invoice: ${error.message}`);
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
      // బాక్స్ హైట్ ఫిక్స్డ్ గా 160px పెట్టాము
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

      // --- B. Invoice Meta Details (Right Side - FIXED LAYOUT) ---
      // ఇక్కడ మనం X-Coordinates ని మార్చాము.
      // Label X: 300 (Start) -> Width 100 -> Ends at 400
      // Value X: 410 (Start) -> Width 145 -> Ends at 555 (Page Edge)
      // దీనివల్ల రెండింటి మధ్య 10px గ్యాప్ ఖచ్చితంగా ఉంటుంది.

      const labelX = 300;
      const valueX = 410;
      const labelWidth = 100;
      const valueWidth = 145; // Long Order ID కి సరిపడా స్పేస్
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
      doc
        .font("Helvetica")
        .text(invoiceNumber, valueX, metaY, {
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

      // 3. Order ID (Font size 9px for safety)
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Order ID:", labelX, metaY, {
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

      // 4. Payment
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Payment:", labelX, metaY, { width: labelWidth, align: "right" });
      doc
        .font("Helvetica")
        .text(order.paymentMethod, valueX, metaY, {
          width: valueWidth,
          align: "right",
        });

      // ================= 2. ADDRESS SECTION =================
      const addrY = 190; // బ్లూ హెడర్ బాక్స్ (160px) కింద గ్యాప్ ఇచ్చి స్టార్ట్ అవుతుంది
      const colWidth = 220; // అడ్రస్ వెడల్పు పెంచాము

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

      // Shipping Column (X moved to 300 for separation)
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
      let tableY = 310; // అడ్రస్ కింద గ్యాప్

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
        doc.text(item.name.substring(0, 40), 80, y, { width: 190 }); // Limit name wrap
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

      doc.text("TOTAL PAID", sumLabelX + 10, tableY + 4);
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

