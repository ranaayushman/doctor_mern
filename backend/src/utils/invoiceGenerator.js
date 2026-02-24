/**
 * Invoice Generator Utility
 * Generates PDF invoices using pdfkit
 */

const PDFDocument = require('pdfkit');
const moment = require('moment');

/**
 * GENERATE INVOICE PDF
 * 
 * Creates a professional PDF invoice with:
 * - Header with clinic/hospital logo/name
 * - Invoice details (number, date, terms)
 * - Patient information
 * - Doctor information
 * - Appointment details
 * - Itemized charges
 * - Payment method
 * - Payment status
 */
const generateInvoicePDF = async ({ payment, appointment, patient, doctor }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        bufferPages: true,
      });

      const buffers = [];

      // Capture document output
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ============= HEADER =============
      doc.fontSize(20).font('Helvetica-Bold').text('APPOINTMENT INVOICE', { align: 'center' });
      doc.moveDown(0.5);

      // Clinic details (placeholder - can be customized)
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('HealthCare Clinic Online', { align: 'center' })
        .text('Email: support@healthcareclinic.com | Phone: +91-XXXXX-XXXXX', { align: 'center' })
        .text('Website: www.healthcareclinic.com', { align: 'center' });

      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.7);

      // ============= INVOICE DETAILS =============
      const leftX = 40;
      const rightX = 350;
      const colY = doc.y;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('INVOICE DETAILS', leftX, colY);
      doc.text('BILL TO', rightX, colY);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Invoice #: ${payment.invoiceNumber}`, leftX, colY + 20);
      doc.text(`Invoice Date: ${moment(payment.transactionDate || new Date()).format('DD MMM YYYY')}`, leftX, colY + 35);
      doc.text(`Due Date: ${moment(payment.transactionDate || new Date()).add(7, 'days').format('DD MMM YYYY')}`, leftX, colY + 50);

      // Patient info (right column)
      doc.text(
        `${patient.firstName} ${patient.lastName}`,
        rightX,
        colY + 20
      );
      doc.text(`Email: ${patient.email}`, rightX, colY + 35);
      doc.text(`Phone: ${patient.phone}`, rightX, colY + 50);
      if (patient.address && patient.address.street) {
        doc.text(
          `${patient.address.street}, ${patient.address.city}`,
          rightX,
          colY + 65
        );
      }

      doc.moveDown(5);

      // ============= APPOINTMENT DETAILS =============
      doc.fontSize(10).font('Helvetica-Bold').text('APPOINTMENT DETAILS', leftX);
      doc.moveDown(0.3);

      const appointmentTableY = doc.y;
      const detailsMargin = 15;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Doctor:', leftX, appointmentTableY);
      doc.text('Specialization:', leftX, appointmentTableY + 20);
      doc.text('Appointment Date:', leftX, appointmentTableY + 40);
      doc.text('Appointment Time:', leftX, appointmentTableY + 60);
      doc.text('Consultation Type:', leftX, appointmentTableY + 80);
      doc.text('Chief Complaint:', leftX, appointmentTableY + 100);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Dr. ${doctor.firstName} ${doctor.lastName}`, leftX + detailsMargin * 4, appointmentTableY);
      doc.text(doctor.specialization || 'N/A', leftX + detailsMargin * 4, appointmentTableY + 20);
      doc.text(
        moment(appointment.appointmentDate).format('DD MMM YYYY'),
        leftX + detailsMargin * 4,
        appointmentTableY + 40
      );
      doc.text(`${appointment.startTime} - ${appointment.endTime}`, leftX + detailsMargin * 4, appointmentTableY + 60);
      doc.text(appointment.consultationType || 'Online', leftX + detailsMargin * 4, appointmentTableY + 80);
      doc.text(appointment.chiefComplaint || 'General consultation', leftX + detailsMargin * 4, appointmentTableY + 100);

      doc.moveDown(6);

      // ============= CHARGES TABLE =============
      doc.fontSize(10).font('Helvetica-Bold').text('CHARGES', leftX);
      doc.moveDown(0.3);

      const tableTop = doc.y;
      const col1 = leftX;
      const col2 = 300;
      const col3 = 450;
      const col4 = 550;

      // Header row
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Description', col1, tableTop);
      doc.text('Quantity', col2, tableTop);
      doc.text('Unit Price', col3, tableTop);
      doc.text('Amount', col4, tableTop);

      // Draw line
      doc.moveTo(leftX, tableTop + 15).lineTo(doc.page.width - 40, tableTop + 15).stroke();

      // Item row
      doc.fontSize(9).font('Helvetica');
      const itemY = tableTop + 25;
      doc.text('Consultation Fee', col1, itemY);
      doc.text('1', col2, itemY, { width: 40, align: 'center' });
      doc.text(`₹${payment.amount}`, col3, itemY, { width: 80, align: 'right' });
      doc.text(`₹${payment.amount}`, col4, itemY, { width: 80, align: 'right' });

      // Total row
      const totalY = itemY + 30;
      doc.moveTo(leftX, totalY).lineTo(doc.page.width - 40, totalY).stroke();

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('TOTAL AMOUNT', col1, totalY + 10);
      doc.text(`₹${payment.amount}`, col4, totalY + 10, { width: 80, align: 'right' });

      doc.moveDown(3);

      // ============= TAX SECTION (if applicable) =============
      const taxY = doc.y;
      doc.fontSize(9).font('Helvetica');
      doc.text('GST (if applicable): Exempt', leftX);
      doc.text(`Final Amount Due: ₹${payment.amount}`, leftX, taxY + 20);

      doc.moveDown(2);

      // ============= PAYMENT INFORMATION =============
      doc.fontSize(10).font('Helvetica-Bold').text('PAYMENT INFORMATION', leftX);
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Status: ${payment.status}`, leftX);
      doc.text(`Payment Method: ${payment.paymentMethod || 'Online'}`, leftX, doc.y);
      doc.text(`Payment Date: ${moment(payment.transactionDate).format('DD MMM YYYY, HH:mm')}`, leftX, doc.y);
      if (payment.razorpayPaymentId) {
        doc.text(`Transaction ID: ${payment.razorpayPaymentId}`, leftX, doc.y);
      }

      doc.moveDown(1);

      // ============= REFUND SECTION (if applicable) =============
      if (payment.refundStatus === 'Completed') {
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('REFUND DETAILS', leftX);
        doc.moveDown(0.2);

        doc.fontSize(8).font('Helvetica');
        doc.text(`Refund Amount: ₹${payment.refundAmount}`, leftX);
        doc.text(`Refund Date: ${moment(payment.refundDate).format('DD MMM YYYY')}`, leftX, doc.y);
        doc.text(`Refund Reason: ${payment.refundReason}`, leftX, doc.y);
        doc.text('Refund Status: Successfully Processed', leftX, doc.y);
        doc.text('Note: Refund amount will be credited within 5-7 business days', leftX, doc.y);

        doc.moveDown(1);
      }

      // ============= FOOTER =============
      doc.moveDown(2);
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(8).font('Helvetica');
      doc.text('Terms & Conditions:', leftX, { align: 'left' });
      doc.fontSize(7).text(
        '1. This invoice is a record of the online consultation provided by the doctor on the mentioned date and time.\n' +
        '2. Payment has been made through secure online payment gateway (Razorpay).\n' +
        '3. In case of any discrepancies, please contact support @ support@healthcareclinic.com\n' +
        '4. Return & Refund Policy: Refunds are processed within 5-7 business days after cancellation.\n' +
        '5. This invoice is valid with digital signature and valid for compliance and record-keeping purposes.',
        { width: doc.page.width - 80 }
      );

      doc.moveDown(1);
      doc.fontSize(7).font('Helvetica-Oblique');
      doc.text(
        `Generated on: ${moment().format('DD MMM YYYY, HH:mm:ss')} | This is a system-generated invoice`,
        { align: 'center' }
      );

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * FORMAT CURRENCY
 * Helper to format amounts as currency
 */
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * FORMAT DATE
 * Helper to format dates
 */
const formatDate = (date, format = 'DD MMM YYYY') => {
  return moment(date).format(format);
};

module.exports = {
  generateInvoicePDF,
  formatCurrency,
  formatDate,
};
