/**
 * Bilal Decor Studio - Ultra-Professional B2B PDF Invoice & Bill Generation Engine
 * Standard A4 Luxury Layout, Pixel-Perfect PDF Export (html2pdf.js) & Browser Print
 */

const Invoice = {
    currentData: null,

    /**
     * Generate and open invoice modal for an active order
     * @param {string} orderId 
     */
    generateFromOrder(orderId) {
        if (!orderId) {
            alert("Order ID darj nahi hai.");
            return;
        }

        const orders = Store.getOrders() || [];
        const cleanId = String(orderId).trim().replace(/^#/, '');
        const order = orders.find(o => 
            o.orderId.toLowerCase() === cleanId.toLowerCase() ||
            o.orderId.toLowerCase() === ('bds-' + cleanId.toLowerCase())
        );

        if (!order) {
            alert("Order nahi mila: #" + orderId);
            return;
        }

        // Format dates cleanly
        let formattedDate = order.createdAt || new Date().toISOString().slice(0, 10);
        if (formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
        }

        // Calculate totals safely
        const subtotal = Number(order.totalAmount) || 0;
        const advancePaid = Number(order.advancePaid) || 0;
        const remainingBalance = order.remainingBalance !== undefined 
            ? Number(order.remainingBalance) 
            : Math.max(0, subtotal - advancePaid);

        // Map items safely with fallbacks
        const items = Array.isArray(order.items) && order.items.length > 0 
            ? order.items.map(it => this._normalizeItem(it))
            : [
                {
                    title: order.marqueeName ? `${order.marqueeName} - Custom Decor Order` : "Marquee Ceiling & Stage Drapery",
                    length: "-",
                    width: "-",
                    sqFt: order.totalSqFt || 1000,
                    rate: order.rate || 65,
                    quantity: 1,
                    total: subtotal
                }
            ];

        const invoiceData = {
            invoiceNo: "INV-" + (order.orderId.toUpperCase().startsWith('BDS-') ? order.orderId.toUpperCase() : 'BDS-' + order.orderId.toUpperCase()),
            orderId: order.orderId,
            date: formattedDate,
            clientName: order.clientName || "Valued Customer",
            clientPhone: order.clientPhone || "-",
            city: order.city || "Pakistan",
            marqueeName: order.marqueeName || "-",
            cargoDetails: order.cargoDetails || "Local Cargo Adda / Bilty",
            expectedDispatch: order.expectedDispatch || "5 se 6 working days",
            items: items,
            subtotal: subtotal,
            advancePaid: advancePaid,
            remainingBalance: remainingBalance,
            status: order.status || "pending",
            statusText: order.statusText || this._getStatusLabel(order.status)
        };

        this.currentData = invoiceData;
        this.showInvoiceModal(invoiceData);
    },

    /**
     * Generate invoice for a past customer from history
     * @param {string} historyId
     */
    generateFromHistory(historyId) {
        const history = Store.getClientHistory() || [];
        const record = history.find(h => String(h.id) === String(historyId));
        if (!record) {
            alert("Record nahi mila: " + historyId);
            return;
        }

        const totalAmt = Number(record.totalAmount) || ((Number(record.totalSqFt) || 1000) * (Number(record.rate) || 65));
        const invoiceData = {
            invoiceNo: "INV-HIST-" + (record.id || Math.floor(1000 + Math.random() * 9000)),
            orderId: record.id || "HIST",
            date: record.date || new Date().toISOString().slice(0, 10),
            clientName: record.clientName || "Valued Customer",
            clientPhone: record.clientPhone || record.phoneMasked || "-",
            city: record.city || "Pakistan",
            marqueeName: record.marqueeName || record.clientName || "-",
            cargoDetails: "Cargo Adda Delivery Mukammal (Dispatched)",
            expectedDispatch: "Delivered & Received",
            items: [
                {
                    title: record.designName || "Marquee Ceiling Fabric (Standard)",
                    length: "-",
                    width: "-",
                    sqFt: record.totalSqFt || 1000,
                    rate: record.rate || 65,
                    quantity: 1,
                    total: totalAmt
                }
            ],
            subtotal: totalAmt,
            advancePaid: totalAmt,
            remainingBalance: 0,
            status: "delivered",
            statusText: "Mukammal aur Delivered"
        };

        this.currentData = invoiceData;
        this.showInvoiceModal(invoiceData);
    },

    /**
     * Normalize item object to guarantee no missing fields
     */
    _normalizeItem(it) {
        const title = it.title || it.titleRoman || it.titleEn || it.name || "Marquee Ceiling & Stage Drapery";
        const length = (it.length !== undefined && it.length !== null && it.length !== '') ? it.length : "-";
        const width = (it.width !== undefined && it.width !== null && it.width !== '') ? it.width : "-";
        
        let sqFt = it.sqFt;
        if (!sqFt && length !== '-' && width !== '-' && !isNaN(length) && !isNaN(width)) {
            sqFt = Number(length) * Number(width);
        }

        const rate = Number(it.rate) || 0;
        const quantity = Number(it.quantity) || 1;
        let total = Number(it.total);
        if (isNaN(total) || total === 0) {
            total = (Number(sqFt) || 0) * rate * quantity;
        }

        return {
            title,
            length,
            width,
            sqFt: sqFt || 0,
            rate,
            quantity,
            total
        };
    },

    /**
     * Human-friendly Status Label in Roman Urdu
     */
    _getStatusLabel(status) {
        switch (status) {
            case 'verified': return 'Advance Verified - Processing';
            case 'cutting': return 'Cutting & Tailoring Shuru';
            case 'stitching': return 'Double Stitching In Progress';
            case 'dispatched': return 'Cargo Par Rawana / Bilty Shuda';
            case 'delivered': return 'Mukammal Deliver Ho Chuka';
            case 'pending': return 'Order Mosool Hua - Verification Pending';
            default: return status || 'Active Order';
        }
    },

    /**
     * Display the rendered invoice in the preview modal
     */
    showInvoiceModal(data) {
        const modal = document.getElementById('invoiceModal');
        const content = document.getElementById('invoiceContentArea');
        if (!modal || !content) return;

        this.currentData = data;
        const settings = Store.getSettings ? Store.getSettings() : {
            phoneDisplay: "0300-1234567",
            whatsappNumber: "923001234567",
            bank: {
                bankName: "Meezan Bank Ltd",
                title: "Bilal Decor Studio",
                accountNo: "0102-0108928371"
            },
            jazzcash: {
                number: "0300-1234567",
                title: "Bilal Decor Studio"
            }
        };

        const formatPKR = (amt) => {
            if (window.Calculator && Calculator.formatPKR) {
                return Calculator.formatPKR(amt);
            }
            return 'Rs. ' + Number(amt || 0).toLocaleString();
        };

        content.innerHTML = `
            <div id="invoiceDocument" class="bg-white text-slate-900 border border-slate-200 rounded-xl max-w-3xl mx-auto shadow-sm p-6 sm:p-8" style="box-sizing: border-box; width: 100%;">
                
                <!-- TOP HEADER BAR -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-amber-600 gap-4">
                    <div>
                        <div class="flex items-center space-x-3 mb-1">
                            <img src="assets/images/logo.svg" alt="Bilal Decor Studio" style="height: 46px; width: auto;" onerror="this.style.display='none'">
                            <div>
                                <h1 class="text-xl font-extrabold text-slate-900 tracking-wide font-serif-luxury" style="letter-spacing: 1.5px;">BILAL DECOR STUDIO</h1>
                                <p class="text-[11px] text-amber-800 font-bold tracking-wider uppercase">B2B Marquee Ceilings & Stage Drapery Manufacturer</p>
                            </div>
                        </div>
                        <p class="text-xs text-slate-600 mt-1">
                            📍 Lahore & Gujranwala Workshop Hub &nbsp;|&nbsp; 📞 ${settings.phoneDisplay || '0300-1234567'} &nbsp;|&nbsp; 💬 WhatsApp Rabta
                        </p>
                    </div>

                    <div class="text-left sm:text-right w-full sm:w-auto bg-[#FAF8F5] p-3 rounded-xl border border-amber-200/80">
                        <span class="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] tracking-wider uppercase mb-1">
                            OFFICIAL B2B ESTIMATE BILL
                        </span>
                        <h3 class="text-lg font-black font-mono text-slate-900 leading-tight">${data.invoiceNo}</h3>
                        <p class="text-xs text-slate-600 mt-0.5">Date: <strong class="text-slate-900">${data.date}</strong></p>
                        <div class="mt-1">
                            <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                data.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                data.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                                data.status === 'verified' || data.status === 'cutting' || data.status === 'stitching' ? 'bg-amber-100 text-amber-900' :
                                'bg-slate-100 text-slate-800'
                            }">
                                ${data.statusText || data.status}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- CLIENT & CARGO DISPATCH DETAILS (2-Column Card) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-slate-200">
                    <div>
                        <span class="text-amber-800 font-extrabold uppercase tracking-wider block text-[10px] mb-1.5">
                            👤 Customer & Marquee Details:
                        </span>
                        <p class="text-sm font-bold text-slate-900 mb-0.5">${data.clientName}</p>
                        ${data.marqueeName && data.marqueeName !== '-' ? `<p class="text-slate-700 font-medium">🏛️ Marquee: <strong class="text-slate-900">${data.marqueeName}</strong></p>` : ''}
                        <p class="text-slate-600">📞 Phone: <strong class="font-mono text-slate-900 font-bold">${data.clientPhone}</strong></p>
                        <p class="text-slate-600">📍 Shehar / City: <strong class="text-slate-900 font-bold">${data.city}</strong></p>
                    </div>

                    <div class="sm:text-right border-t sm:border-t-0 sm:border-l border-amber-200/60 pt-3 sm:pt-0 sm:pl-4">
                        <span class="text-amber-800 font-extrabold uppercase tracking-wider block text-[10px] mb-1.5">
                            🚚 Delivery & Cargo Logistics:
                        </span>
                        <p class="text-slate-700">Cargo Adda: <strong class="text-slate-900 font-bold">${data.cargoDetails}</strong></p>
                        <p class="text-emerald-800 font-bold mt-1">📦 Dispatch Status: <strong>${data.expectedDispatch || '5 se 6 working days'}</strong></p>
                        <p class="text-slate-500 mt-1">Payment Policy: 50% Advance • 50% on Cargo Delivery</p>
                    </div>
                </div>

                <!-- ITEMS SPECIFICATION TABLE -->
                <div class="overflow-x-auto mb-5 rounded-xl border border-slate-200 shadow-2xs">
                    <table class="w-full text-left text-xs" style="border-collapse: collapse; min-width: 600px;">
                        <thead class="bg-[#F5EEDB] border-b border-amber-300 text-slate-900 font-extrabold">
                            <tr>
                                <th class="p-2.5 text-center w-8">#</th>
                                <th class="p-2.5">Design & Fabric Description</th>
                                <th class="p-2.5 text-center">Size (L x W)</th>
                                <th class="p-2.5 text-center">Total Sq Ft</th>
                                <th class="p-2.5 text-right">Rate/Sq Ft</th>
                                <th class="p-2.5 text-center">Qty</th>
                                <th class="p-2.5 text-right">Total (PKR)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                            ${data.items.map((item, idx) => {
                                const sizeStr = (item.length && item.length !== '-' && item.width && item.width !== '-')
                                    ? `${item.length} × ${item.width} ft`
                                    : '-';
                                const sqFtStr = item.sqFt ? Number(item.sqFt).toLocaleString() : '-';
                                const rateStr = item.rate ? `Rs. ${Number(item.rate).toLocaleString()}` : '-';
                                return `
                                    <tr class="${idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}">
                                        <td class="p-2.5 text-center font-mono font-bold text-slate-500">${idx + 1}</td>
                                        <td class="p-2.5">
                                            <p class="font-bold text-slate-900">${item.title}</p>
                                            <p class="text-[10px] text-slate-500">Premium Export Quality Double Stitching</p>
                                        </td>
                                        <td class="p-2.5 text-center font-mono text-slate-700 whitespace-nowrap">${sizeStr}</td>
                                        <td class="p-2.5 text-center font-mono font-bold text-slate-900">${sqFtStr}</td>
                                        <td class="p-2.5 text-right font-mono text-slate-700">${rateStr}</td>
                                        <td class="p-2.5 text-center font-mono font-bold text-slate-900">${item.quantity || 1}</td>
                                        <td class="p-2.5 text-right font-mono font-black text-slate-900">${formatPKR(item.total)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- FINANCIAL CALCULATIONS & BANK ACCOUNTS -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-amber-200 mb-5 text-xs">
                    <div class="space-y-1.5">
                        <span class="text-amber-900 font-extrabold uppercase tracking-wider block text-[10px] mb-1">
                            🏦 Official Payment Verification Accounts:
                        </span>
                        <div class="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 space-y-0.5">
                            <p class="font-bold text-slate-900">${settings.bank?.bankName || 'Meezan Bank Ltd'}</p>
                            <p class="font-mono text-xs">A/C: <strong class="text-slate-900">${settings.bank?.accountNo || '0102-0108928371'}</strong></p>
                            <p class="text-[10px] text-slate-500">Title: ${settings.bank?.title || 'Bilal Decor Studio'}</p>
                        </div>
                        <div class="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 space-y-0.5">
                            <p class="font-bold text-slate-900">JazzCash / EasyPaisa</p>
                            <p class="font-mono text-xs">Number: <strong class="text-slate-900">${settings.jazzcash?.number || '0300-1234567'}</strong></p>
                            <p class="text-[10px] text-slate-500">Title: ${settings.jazzcash?.title || 'Bilal Decor Studio'}</p>
                        </div>
                    </div>

                    <div class="space-y-2 text-right flex flex-col justify-center">
                        <div class="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                            <span class="font-medium">Kul Rakam (Subtotal):</span>
                            <span class="font-mono font-bold text-slate-900 text-sm">${formatPKR(data.subtotal)}</span>
                        </div>
                        <div class="flex justify-between text-emerald-800 pb-1 border-b border-slate-200">
                            <span class="font-medium">Ada Shuda Advance:</span>
                            <span class="font-mono font-bold text-emerald-700 text-sm">${formatPKR(data.advancePaid)}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm font-black p-2.5 rounded-lg bg-[#0F172A] text-white">
                            <span class="text-amber-300 font-bold">Baqaya Rakam (Due Balance):</span>
                            <span class="font-mono text-amber-300 text-base font-black">${formatPKR(data.remainingBalance)}</span>
                        </div>
                    </div>
                </div>

                <!-- FOOTER, GUARANTEE & OFFICIAL STAMP -->
                <div class="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-slate-200 text-xs text-slate-600 gap-4">
                    <div class="space-y-0.5 text-[11px] max-w-sm">
                        <p class="font-bold text-slate-800">✅ Bilal Decor Studio Guarantee & Sharaait:</p>
                        <p>1. Heavy-duty double stitching aur A-Grade velvet/silk fabric ki mukammal guarantee hai.</p>
                        <p>2. Cargo Adda par parcel receive hone par baqaya payment lazmi clear karein.</p>
                    </div>

                    <div class="text-center sm:text-right flex items-center space-x-3">
                        <div class="inline-block p-2.5 rounded-xl border-2 border-dashed border-amber-600 text-amber-900 font-extrabold text-[9px] uppercase tracking-wider text-center bg-amber-50/50">
                            ★ BILAL DECOR STUDIO ★<br>
                            <span class="text-slate-900 font-black">OFFICIAL ATELIER SEAL</span><br>
                            PAKISTAN • VERIFIED
                        </div>
                        <div class="text-center">
                            <div class="w-28 border-b border-slate-400 mb-1"></div>
                            <p class="text-[10px] text-slate-500 font-semibold">Authorized Signature</p>
                        </div>
                    </div>
                </div>

                <!-- FINE PRINT WATERMARK -->
                <div class="text-center text-[9px] text-slate-400 pt-3 border-t border-slate-100 mt-3">
                    Computer Generated B2B Invoice • Bilal Decor Studio (Marquee Ceilings & Stage Drapery Atelier) • bilaldecorstudio.com
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    },

    /**
     * Close Invoice Modal
     */
    closeInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        if (modal) modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    },

    /**
     * Download Invoice as a razor-sharp, perfectly dimensioned A4 PDF
     * Resolves clipping, missing items, and excess space on mobile & desktop!
     */
    async downloadPDF() {
        const sourceElement = document.getElementById('invoiceDocument');
        if (!sourceElement) return;

        const downloadBtn = document.querySelector('#invoiceModal button[onclick*="downloadPDF"]');
        const origBtnHtml = downloadBtn ? downloadBtn.innerHTML : '';
        if (downloadBtn) {
            downloadBtn.innerHTML = '<span>⏳ PDF Tayar ho raha hai...</span>';
            downloadBtn.disabled = true;
        }

        try {
            // Guarantee exact 794px width (standard A4 at 96 DPI) using an off-screen clone
            const printClone = sourceElement.cloneNode(true);
            printClone.id = 'invoiceDocument_pdf_clone';
            
            // Apply standard print dimensions to ensure zero responsive squishing or table cutoffs
            printClone.style.width = '794px';
            printClone.style.maxWidth = '794px';
            printClone.style.minWidth = '794px';
            printClone.style.boxSizing = 'border-box';
            printClone.style.position = 'fixed';
            printClone.style.left = '-9999px';
            printClone.style.top = '0';
            printClone.style.zIndex = '-9999';
            printClone.style.background = '#ffffff';
            printClone.style.margin = '0';
            printClone.style.padding = '24px 28px';
            printClone.style.boxShadow = 'none';
            printClone.style.borderRadius = '0';
            printClone.style.overflow = 'visible';

            // Ensure all inner scrollable containers are fully expanded in the PDF clone
            printClone.querySelectorAll('*').forEach(el => {
                if (el.classList.contains('overflow-x-auto') || el.style.overflow || el.style.overflowX) {
                    el.style.overflow = 'visible';
                    el.style.overflowX = 'visible';
                }
            });

            document.body.appendChild(printClone);

            if (window.html2pdf) {
                const invoiceNo = (this.currentData && this.currentData.invoiceNo) 
                    ? this.currentData.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_')
                    : 'Bilal_Decor_Invoice';
                
                const opt = {
                    margin: [6, 8, 6, 8], // Balanced 6mm top/bottom, 8mm left/right
                    filename: `Bilal_Decor_${invoiceNo}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2, // 2x crisp vector-like text rendering
                        useCORS: true,
                        letterRendering: true,
                        scrollX: 0,
                        scrollY: 0,
                        width: 794,
                        windowWidth: 794
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait'
                    },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };

                await html2pdf().set(opt).from(printClone).save();
            } else {
                window.print();
            }

            // Remove temporary clone from DOM
            if (printClone && printClone.parentNode) {
                printClone.parentNode.removeChild(printClone);
            }
        } catch (err) {
            console.error("PDF generation error:", err);
            // Fallback to high-fidelity browser print
            window.print();
        } finally {
            if (downloadBtn) {
                downloadBtn.innerHTML = origBtnHtml;
                downloadBtn.disabled = false;
            }
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
