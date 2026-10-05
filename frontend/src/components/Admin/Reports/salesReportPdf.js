import { ORDER_STATUS_LABELS } from "../../../utils/order";
import { PAYMENT_SHORT_LABELS, formatRange, periodHint } from "../../../utils/report";

// jsPDF's built-in fonts have no ₹ glyph, so the PDF writes "Rs."
const MONEY = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rs = (value) => `Rs. ${MONEY.format(value || 0)}`;
const DATE_TIME = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const DATE = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
const FILE_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

const INDIGO = [79, 70, 229];
const SLATE = [30, 41, 59];
const MUTED = [100, 116, 139];

const PERIOD_TITLES = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly", custom: "Custom range" };

/**
 * Builds and downloads the sales report PDF (A4 landscape): summary, top products, then every order.
 * report = the /sales/export payload. The PDF libraries load only when an admin downloads one.
 */
export const downloadSalesReportPdf = async (report) => {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const { range, summary } = report;
  const periodLine = `${PERIOD_TITLES[range.period] || range.period}${periodHint(range.period) && range.period !== "custom" ? ` (${periodHint(range.period)})` : ""}  ·  ${formatRange(range)}`;

  // Header
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...SLATE);
  doc.text("Care N Safe  -  Sales Report", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(periodLine, margin, 62);
  doc.text(`Generated ${DATE_TIME.format(new Date(report.generatedAt))}`, pageWidth - margin, 44, { align: "right" });
  doc.text("Sales = delivered and partially returned orders, dated by delivery.", pageWidth - margin, 62, { align: "right" });

  // Summary (two label / value pairs per row)
  const pairs = [
    ["Orders", String(summary.orders)],
    ["Net revenue", rs(summary.net)],
    ["Gross sales", rs(summary.gross)],
    ["Returned", `${rs(summary.returnedAmount)} (${summary.unitsReturned} ${summary.unitsReturned === 1 ? "unit" : "units"})`],
    ["Units kept", String(summary.units)],
    ["Discounts", rs(summary.discount)],
    ["Shipping collected", rs(summary.shipping)],
    ["Avg. order value", rs(summary.avgOrderValue)],
  ];
  const summaryRows = [];
  for (let index = 0; index < pairs.length; index += 2) summaryRows.push([...pairs[index], ...(pairs[index + 1] || ["", ""])]);
  autoTable(doc, {
    startY: 80,
    margin: { left: margin, right: margin },
    body: summaryRows,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: { top: 5, bottom: 5, left: 8, right: 8 }, textColor: SLATE },
    columnStyles: { 0: { textColor: MUTED }, 1: { fontStyle: "bold" }, 2: { textColor: MUTED }, 3: { fontStyle: "bold" } },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.5,
  });

  const sectionTitle = (title, y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...SLATE);
    doc.text(title, margin, y);
  };
  const tableStyles = {
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 5, textColor: SLATE, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    // Number columns: headers line up with their right-aligned values
    didParseCell: (data) => {
      if (data.section !== "body" && data.table.styles.columnStyles[data.column.index]?.halign === "right") data.cell.styles.halign = "right";
    },
  };

  // Top products
  if (report.topProducts.length) {
    const y = doc.lastAutoTable.finalY + 28;
    sectionTitle("Top products", y);
    autoTable(doc, {
      ...tableStyles,
      startY: y + 8,
      head: [["#", "Product", "Units sold", "Revenue"]],
      body: report.topProducts.map((product, index) => [index + 1, product.name, product.units, rs(product.revenue)]),
      columnStyles: { 0: { cellWidth: 30 }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
  }

  // Every order
  const y = doc.lastAutoTable.finalY + 28;
  sectionTitle(`Orders (${report.orders.length}${report.truncated ? ", first rows only" : ""})`, y);
  autoTable(doc, {
    ...tableStyles,
    startY: y + 8,
    head: [["Order", "Ordered", "Delivered", "Customer", "Payment", "Status", "Units", "Total", "Returned", "Net"]],
    body: report.orders.length
      ? report.orders.map((row) => [
          row.orderNumber,
          DATE.format(new Date(row.orderedAt)),
          DATE.format(new Date(row.deliveredAt)),
          row.customer.email ? `${row.customer.name}\n${row.customer.email}` : row.customer.name,
          PAYMENT_SHORT_LABELS[row.paymentMethod] || row.paymentMethod,
          ORDER_STATUS_LABELS[row.orderStatus] || row.orderStatus,
          row.unitsReturned ? `${row.units} (+${row.unitsReturned} ret.)` : String(row.units),
          rs(row.total),
          row.returnedAmount ? `- ${rs(row.returnedAmount)}` : "-",
          rs(row.net),
        ])
      : [[{ content: "No sales in this period.", colSpan: 10, styles: { halign: "center", textColor: MUTED } }]],
    foot: report.orders.length
      ? [["Total", "", "", "", "", "", String(summary.units), rs(summary.gross), `- ${rs(summary.returnedAmount)}`, rs(summary.net)]]
      : undefined,
    footStyles: { fillColor: [241, 245, 249], textColor: SLATE, fontStyle: "bold" },
    columnStyles: { 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right", fontStyle: "bold" } },
    showFoot: "lastPage",
  });

  // Page numbers
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
    doc.text("Care N Safe  ·  Sales report", margin, doc.internal.pageSize.getHeight() - 20);
  }

  const from = FILE_DATE.format(new Date(range.from));
  const to = FILE_DATE.format(new Date(range.to));
  doc.save(`sales-report_${range.period}_${from}${from === to ? "" : `_to_${to}`}.pdf`);
};
