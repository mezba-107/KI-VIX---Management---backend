const cron = require("node-cron");

const Invoice = require("../models/Invoice");
const Notification = require("../models/Notification");

cron.schedule("0 9 * * *", async () => {
  try {
    console.log("Running Due Reminder Job...");

    const fourDaysAgo = new Date();

    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const dueInvoices = await Invoice.find({
      due: { $gt: 0 },
      status: "active",
      createdAt: { $lte: fourDaysAgo },
    });
    for (const invoice of dueInvoices) {
      await Notification.create({
        category: "dashboard",
        variant: "red",
        icon: "fa-bell",

        title: "Due Payment Reminder",

        message: `Invoice #${invoice.invoiceNo} has overdue payment`,

        details: [
          {
            label: "Invoice ID",
            value: invoice.invoiceNo,
          },
          {
            label: "Customer",
            value: invoice.customerName,
          },
          {
            label: "Due Amount",
            value: `৳${invoice.due}`,
          },
          {
            label: "Invoice Date",
            value: new Date(invoice.createdAt).toLocaleDateString(),
          },
        ],
      });
    }

    console.log(`${dueInvoices.length} reminders created`);
  } catch (error) {
    console.log(error);
  }
});
