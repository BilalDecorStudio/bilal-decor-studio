/**
 * Bilal Decor Studio - PDF Invoice & Bill Generation Engine
 * Supports downloading PDF and printing for customers, active orders, and past history.
 */

const Invoice = {
    /**
     * Generate and open invoice modal for an active order
     * @param {string} orderId 
     */
    generateFromOrder(orderId) {
        const orders = Store.getOrders();
        const order = orders.find(o => o.orderId === orderId);
        if (!order) {
            alert("Order nahi mila: #" + orderId);
            return;
        }

        const invoiceData = {
            invoiceNo: "INV-" + order.orderId,
            date: order.createdAt || new Date().toISOString().slice(0, 10),
            clientName: order.clientName,
            clientPhone: order.clientPhone || "-",
            city: order.city,
            marqueeName: order.marqueeName || "-",
            cargoDetails: order.cargoDetails || "Local Cargo Adda",
            expectedDispatch: order.expectedDispatch || "5 se 6 working days",
            items: order.items || [],
            subtotal: order.totalAmount,
            advancePaid: order.advancePaid || 0,
            remainingBalance: order.remainingBalance !== undefined ? order.remainingBalance : (order.totalAmount - (order.advancePaid || 0)),
            status: order.statusText || order.status
        };

        this.showInvoiceModal(invoiceData);
    },

    /**
     * Generate invoice for a past customer from history
     * @param {string} historyId
     */
    generateFromHistory(historyId) {
        const history = Store.getClientHistory();
        const record = history.find(h => h.id === historyId);
        if (!record) {
            alert("Record nahi mila: " + historyId);
            return;
        }

        const invoiceData = {
            invoiceNo: "INV-HIST-" + Math.floor(1000 + Math.random() * 9000),
            date: record.date || "Completed Record",
            clientName: record.clientName,
            clientPhone: record.clientPhone || record.phoneMasked || "-",
            city: record.city,
            marqueeName: record.clientName,
            cargoDetails: "Cargo Adda Delivery Mukammal",
            items: [
                {
                    title: record.designName,
                    length: "-",
                    width: "-",
                    sqFt: record.totalSqFt || 1000,
                    rate: record.rate || 65,
                    quantity: 1,
                    total: record.totalAmount || (record.totalSqFt * (record.rate || 65))
                }
            ],
            subtotal: record.totalAmount,
            advancePaid: record.totalAmount,
            remainingBalance: 0,
            status: record.status || "Mukammal aur Delivered"
        };

        this.showInvoiceModal(invoiceData);
    },

    /**
     * Display the rendered invoice in a printable & downloadable modal
     */
    showInvoiceModal(data) {
        const modal = document.getElementById('invoiceModal');
        const content = document.getElementById('invoiceContentArea');
        if (!modal || !content) return;

        const settings = Store.getSettings();

        content.innerHTML = `
            <div id="invoiceDocument" class="bg-white p-8 md:p-12 text-slate-900 border border-slate-200 rounded-2xl max-w-3xl mx-auto shadow-sm">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-amber-600 gap-4">
                    <div>
                        <div class="flex items-center space-x-3 mb-1">
                            <img src="assets/images/logo.svg" alt="Bilal Decor Studio" style="height: 48px; width: auto;">
                        </div>
                        <p class="text-xs text-slate-500 font-semibold tracking-wide">B2B Marquee Ceilings & Stage Drapery Manufacturer</p>
                        <p class="text-xs text-slate-500">📍 Lahore & Gujranwala Hub | 📞 ${settings.phoneDisplay}</p>
                    </div>

                    <div class="text-left sm:text-right">
                        <span class="inline-block px-3 py-1 rounded bg-amber-100 text-amber-900 font-extrabold text-xs mb-1">
                            OFFICIAL B2B INVOICE
                        </span>
                        <h3 class="text-xl font-bold font-mono text-slate-900">${data.invoiceNo}</h3>
                        <p class="text-xs text-slate-500">Date: <strong>${data.date}</strong></p>
                        <p class="text-xs text-emerald-800 font-bold">Status: ${data.status}</p>
                    </div>
                </div>

                <!-- Billed To & Cargo Info -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <span class="text-slate-400 font-bold uppercase tracking-wider block mb-1">Customer / Marquee Details:</span>
                        <p class="text-sm font-bold text-slate-900">${data.clientName}</p>
                        <p class="text-slate-600">📞 Phone: <strong class="font-mono text-slate-800">${data.clientPhone}</strong></p>
                        <p class="text-slate-600">📍 City: <strong>${data.city}</strong></p>
                    </div>

                    <div class="sm:text-right">
                        <span class="text-slate-400 font-bold uppercase tracking-wider block mb-1">Delivery / Cargo Info:</span>
                        <p class="text-slate-700">Adda: <strong>${data.cargoDetails}</strong></p>
                        <p class="text-emerald-800 font-bold mt-1">🤖 AI Dispatch: <strong>${data.expectedDispatch || '5 se 6 working days'}</strong></p>
                        <p class="text-slate-500 mt-0.5">Payment Method: Bank / JazzCash / EasyPaisa</p>
                    </div>
                </div>

                <!-- Items Table -->
                <div class="overflow-x-auto mb-6">
                    <table class="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead class="bg-[#FAF7F0] border-b border-slate-200 text-slate-800 font-extrabold">
                            <tr>
                                <th class="p-3">#</th>
                                <th class="p-3">Design Description</th>
                                <th class="p-3 text-center">Size (L x W)</th>
                                <th class="p-3 text-center">Sq Ft</th>
                                <th class="p-3 text-right">Rate/sq ft</th>
                                <th class="p-3 text-center">Qty</th>
                                <th class="p-3 text-right">Total (PKR)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${data.items.map((item, idx) => `
                                <tr>
                                    <td class="p-3 font-mono font-bold text-slate-500">${idx + 1}</td>
                                    <td class="p-3">
                                        <p class="font-bold text-slate-900">${item.title}</p>
                                    </td>
                                    <td class="p-3 text-center font-mono">${item.length !== '-' ? `${item.length} x ${item.width} ft` : '-'}</td>
                                    <td class="p-3 text-center font-mono font-bold">${item.sqFt ? item.sqFt.toLocaleString() : '-'}</td>
                                    <td class="p-3 text-right font-mono">Rs. ${item.rate}</td>
                                    <td class="p-3 text-center font-mono font-bold">${item.quantity || 1}</td>
                                    <td class="p-3 text-right font-mono font-bold text-slate-900">${Calculator.formatPKR(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Financial Calculations -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-[#FAF7F0] border border-amber-200 mb-6 text-xs gap-4">
                    <div class="space-y-1">
                        <p class="font-bold text-slate-800">Bank & Payment Accounts:</p>
                        <p class="text-slate-600">Meezan Bank: <strong>${settings.bank.accountNo}</strong> (Title: ${settings.bank.title})</p>
                        <p class="text-slate-600">JazzCash / EasyPaisa: <strong>${settings.jazzcash.number}</strong></p>
                    </div>

                    <div class="w-full sm:w-64 space-y-2 text-right">
                        <div class="flex justify-between text-slate-600">
                            <span>Subtotal:</span>
                            <span class="font-mono font-bold text-slate-900">${Calculator.formatPKR(data.subtotal)}</span>
                        </div>
                        <div class="flex justify-between text-emerald-800">
                            <span>Advance Paid:</span>
                            <span class="font-mono font-bold">${Calculator.formatPKR(data.advancePaid)}</span>
                        </div>
                        <div class="flex justify-between text-sm font-extrabold text-slate-900 border-t border-amber-300 pt-2">
                            <span>Remaining Balance:</span>
                            <span class="font-mono text-amber-900">${Calculator.formatPKR(data.remainingBalance)}</span>
                        </div>
                    </div>
                </div>

                <!-- Footer & Authorized Stamp -->
                <div class="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-200 text-xs text-slate-500 gap-4">
                    <div>
                        <p class="font-semibold text-slate-700">Not / Sharaait:</p>
                        <p>1. Maal adda par receive hone par baqaya payment lazmi ada karein.</p>
                        <p>2. Double stitching aur fabric quality ki 100% guarantee hai.</p>
                    </div>
                    <div class="text-center sm:text-right">
                        <div class="inline-block p-2 rounded-xl border-2 border-dashed border-amber-500 text-amber-800 font-bold text-[10px] uppercase tracking-wider mb-1">
                            BILAL DECOR STUDIO<br>★ VERIFIED ATELIER ★
                        </div>
                        <p class="text-[10px] text-slate-400">Authorized Signature &amp; Stamp</p>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    },

    closeInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        if (modal) modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    },

    /**
     * Download Invoice as PDF using html2pdf.js or formatted Print-to-PDF
     */
    downloadPDF() {
        const element = document.getElementById('invoiceDocument');
        if (!element) return;

        // If html2pdf library is available in window
        if (window.html2pdf) {
            const opt = {
                margin: 0.3,
                filename: 'Bilal_Decor_Studio_Invoice.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        } else {
            // High-fidelity fallback: Print directly to PDF via browser print dialogue
            window.print();
        }
    },

    /**
     * Print the invoice directly
     */
    printInvoice() {
        window.print();
    }
};

window.Invoice = Invoice;
