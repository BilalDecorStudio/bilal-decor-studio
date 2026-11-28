/**
 * Bilal Decor Studio - Ultra-Professional B2B PDF Invoice & Bill Generation Engine
 * Standard A4 Luxury Layout, Pixel-Perfect Direct DOM PDF Export (html2pdf.js) & Browser Print
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

        // Format date
        let formattedDate = order.createdAt || new Date().toISOString().slice(0, 10);
        if (formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
        }

        // Safely parse numbers
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
        const settings = (window.Store && Store.getSettings) ? Store.getSettings() : {
            phoneDisplay: "0300-456043",
            whatsappNumber: "92300456043",
            bank: {
                bankName: "Meezan Bank Ltd",
                title: "Bilal Decor Studio",
                accountNo: "0102-0108928371"
            },
            jazzcash: {
                number: "0300-456043",
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
            <div id="invoiceDocument" class="bg-white text-slate-900 border border-slate-200 rounded-xl mx-auto shadow-sm" style="box-sizing: border-box; width: 100%; max-width: 820px; padding: 24px 28px; background: #ffffff;">
                
                <!-- TOP HEADER BAR -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-amber-600 gap-3" style="border-bottom: 2px solid #D97706;">
                    <div class="flex items-center space-x-3">
                        <!-- Inline SVG Monogram (Guarantees 100% Reliable Rendering & Zero Canvas Tainting) -->
                        <div style="width: 46px; height: 46px; min-width: 46px; border-radius: 12px; background: #0F172A; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.12);">
                            <svg viewBox="0 0 80 80" width="46" height="46">
                                <circle cx="40" cy="40" r="34" fill="none" stroke="#D4AF37" stroke-width="2.5" />
                                <circle cx="40" cy="40" r="30" fill="none" stroke="#D4AF37" stroke-width="0.8" opacity="0.4" />
                                <path d="M 21,33 Q 40,44 59,33" fill="none" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round" />
                                <path d="M 33,26 L 33,54 M 33,26 L 43,26 C 47.5,26 50,28.5 50,32 C 50,35.5 47.5,38 43,38 L 33,38 M 33,38 L 45,38 C 49.5,38 52.5,41 52.5,46 C 52.5,51 49.5,54 45,54 L 33,54" fill="none" stroke="#D4AF37" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-xl font-extrabold text-slate-900 tracking-wide font-serif-luxury" style="letter-spacing: 1px; margin: 0; line-height: 1.2;">BILAL DECOR STUDIO</h1>
                            <p class="text-[11px] text-amber-800 font-bold uppercase tracking-wider" style="margin: 2px 0 0 0;">B2B Marquee Ceilings & Stage Drapery Manufacturer</p>
                            <p class="text-[10.5px] text-slate-500" style="margin: 2px 0 0 0;">📍 Lahore & Gujranwala Workshop Hub &nbsp;|&nbsp; 📞 ${settings.phoneDisplay || '0300-456043'} &nbsp;|&nbsp; 💬 WhatsApp</p>
                        </div>
                    </div>

                    <div class="text-left sm:text-right w-full sm:w-auto p-2.5 rounded-lg border border-amber-200" style="background: #FAF8F5;">
                        <span class="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold text-[9.5px] tracking-wider uppercase mb-1">
                            OFFICIAL B2B ESTIMATE BILL
                        </span>
                        <h3 class="text-base font-black font-mono text-slate-900 leading-tight" style="margin: 0;">${data.invoiceNo}</h3>
                        <p class="text-[11px] text-slate-600 mt-0.5">Date: <strong class="text-slate-900">${data.date}</strong></p>
                        <div class="mt-1">
                            <span class="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold ${
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

                <!-- CLIENT & CARGO DISPATCH DETAILS (2-Column Grid) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 text-xs p-3.5 rounded-xl border border-slate-200" style="background: #FAF8F5;">
                    <div>
                        <span class="text-amber-800 font-extrabold uppercase tracking-wider block text-[10px] mb-1">
                            👤 Customer & Marquee Details:
                        </span>
                        <p class="text-sm font-bold text-slate-900 mb-0.5">${data.clientName}</p>
                        ${data.marqueeName && data.marqueeName !== '-' ? `<p class="text-slate-700 font-medium">🏛️ Marquee: <strong class="text-slate-900">${data.marqueeName}</strong></p>` : ''}
                        <p class="text-slate-600">📞 Phone: <strong class="font-mono text-slate-900 font-bold">${data.clientPhone}</strong></p>
                        <p class="text-slate-600">📍 Shehar / City: <strong class="text-slate-900 font-bold">${data.city}</strong></p>
                    </div>

                    <div class="sm:text-right border-t sm:border-t-0 sm:border-l border-amber-200/60 pt-2.5 sm:pt-0 sm:pl-3">
                        <span class="text-amber-800 font-extrabold uppercase tracking-wider block text-[10px] mb-1">
                            🚚 Delivery & Cargo Logistics:
                        </span>
                        <p class="text-slate-700">Cargo Adda: <strong class="text-slate-900 font-bold">${data.cargoDetails}</strong></p>
                        <p class="text-emerald-800 font-bold mt-0.5">📦 Dispatch Status: <strong>${data.expectedDispatch || '5 se 6 working days'}</strong></p>
                        <p class="text-slate-500 mt-0.5 text-[10px]">Payment Terms: Advance + Balance on Cargo Receipt</p>
                    </div>
                </div>

                <!-- ITEM SPECIFICATION TABLE (Responsive & Self-Contained) -->
                <div class="mb-4 rounded-xl border border-slate-200 overflow-hidden" style="border: 1px solid #E2E8F0;">
                    <table class="w-full text-left text-xs" style="border-collapse: collapse; width: 100%; table-layout: auto;">
                        <thead style="background: #F5EEDB; border-bottom: 2px solid #D4AF37;">
                            <tr>
                                <th style="padding: 8px 10px; width: 32px; text-align: center; color: #0F172A; font-weight: 800;">#</th>
                                <th style="padding: 8px 10px; color: #0F172A; font-weight: 800;">Design & Fabric Description</th>
                                <th style="padding: 8px 10px; text-align: right; color: #0F172A; font-weight: 800;">Rate / Sq Ft</th>
                                <th style="padding: 8px 10px; text-align: center; width: 44px; color: #0F172A; font-weight: 800;">Qty</th>
                                <th style="padding: 8px 10px; text-align: right; color: #0F172A; font-weight: 800;">Total (PKR)</th>
                            </tr>
                        </thead>
                        <tbody style="background: #ffffff;">
                            ${data.items.map((item, idx) => {
                                const sizeStr = (item.length && item.length !== '-' && item.width && item.width !== '-')
                                    ? `${item.length} × ${item.width} ft`
                                    : '';
                                const sqFtStr = item.sqFt ? `${Number(item.sqFt).toLocaleString()} sq ft` : '';
                                const metaParts = [];
                                if (sizeStr) metaParts.push(`Size: ${sizeStr}`);
                                if (sqFtStr) metaParts.push(`Area: ${sqFtStr}`);
                                metaParts.push('Export Quality Double Stitching');
                                const metaLine = metaParts.join(' &nbsp;•&nbsp; ');

                                const rateStr = item.rate ? `Rs. ${Number(item.rate).toLocaleString()}` : '-';
                                return `
                                    <tr style="border-bottom: 1px solid #F1F5F9; background: ${idx % 2 === 1 ? '#FAFAF9' : '#FFFFFF'};">
                                        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: bold; color: #64748B;">${idx + 1}</td>
                                        <td style="padding: 8px 10px;">
                                            <p style="margin: 0; font-weight: bold; color: #0F172A; font-size: 12.5px;">${item.title}</p>
                                            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748B;">${metaLine}</p>
                                        </td>
                                        <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #334155;">${rateStr}</td>
                                        <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: bold; color: #0F172A;">${item.quantity || 1}</td>
                                        <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 900; color: #0F172A; font-size: 13px;">${formatPKR(item.total)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- FINANCIAL CALCULATIONS & BANK ACCOUNTS -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-amber-200 mb-4 text-xs" style="background: #FAF8F5;">
                    <div class="space-y-1.5">
                        <span class="text-amber-900 font-extrabold uppercase tracking-wider block text-[10px] mb-1">
                            🏦 Official Payment Accounts:
                        </span>
                        <div class="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                            <p class="font-bold text-slate-900 text-[11px]">${settings.bank?.bankName || 'Meezan Bank Ltd'}</p>
                            <p class="font-mono text-[11px]">A/C: <strong class="text-slate-900">${settings.bank?.accountNo || '0102-0108928371'}</strong></p>
                            <p class="text-[9.5px] text-slate-500">Title: ${settings.bank?.title || 'Bilal Decor Studio'}</p>
                        </div>
                        <div class="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                            <p class="font-bold text-slate-900 text-[11px]">JazzCash / EasyPaisa</p>
                            <p class="font-mono text-[11px]">Number: <strong class="text-slate-900">${settings.jazzcash?.number || '0300-456043'}</strong></p>
                            <p class="text-[9.5px] text-slate-500">Title: ${settings.jazzcash?.title || 'Bilal Decor Studio'}</p>
                        </div>
                    </div>

                    <div class="space-y-1.5 text-right flex flex-col justify-center">
                        <div class="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                            <span class="font-medium">Kul Rakam (Subtotal):</span>
                            <span class="font-mono font-bold text-slate-900 text-xs">${formatPKR(data.subtotal)}</span>
                        </div>
                        <div class="flex justify-between text-emerald-800 pb-1 border-b border-slate-200">
                            <span class="font-medium">Ada Shuda Advance:</span>
                            <span class="font-mono font-bold text-emerald-700 text-xs">${formatPKR(data.advancePaid)}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs font-black p-2 rounded-lg bg-[#0F172A] text-white" style="background: #0F172A;">
                            <span class="text-amber-300 font-bold text-[11px]">Baqaya Rakam (Due Balance):</span>
                            <span class="font-mono text-amber-300 text-sm font-black">${formatPKR(data.remainingBalance)}</span>
                        </div>
                    </div>
                </div>

                <!-- FOOTER, GUARANTEE & OFFICIAL STAMP -->
                <div class="flex flex-col sm:flex-row justify-between items-center pt-2.5 border-t border-slate-200 text-xs text-slate-600 gap-3" style="border-top: 1px solid #E2E8F0;">
                    <div class="space-y-0.5 text-[10px] max-w-sm">
                        <p class="font-bold text-slate-800">✅ Bilal Decor Studio Guarantee & Sharaait:</p>
                        <p>1. Heavy-duty double stitching aur A-Grade fabric ki 100% guarantee hai.</p>
                        <p>2. Cargo Adda par parcel receive hone par baqaya raqam lazmi ada karein.</p>
                    </div>

                    <div class="text-center sm:text-right flex items-center space-x-3">
                        <div class="inline-block p-2 rounded-xl border-2 border-dashed border-amber-600 text-amber-900 font-extrabold text-[8.5px] uppercase tracking-wider text-center bg-amber-50/60" style="border: 2px dashed #D97706;">
                            ★ BILAL DECOR STUDIO ★<br>
                            <span class="text-slate-900 font-black">OFFICIAL ATELIER SEAL</span><br>
                            PAKISTAN • VERIFIED
                        </div>
                        <div class="text-center">
                            <div class="w-24 border-b border-slate-400 mb-1" style="border-bottom: 1px solid #94A3B8;"></div>
                            <p class="text-[9.5px] text-slate-500 font-semibold">Authorized Signatory</p>
                        </div>
                    </div>
                </div>

                <!-- FINE PRINT WATERMARK -->
                <div class="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-100 mt-2" style="border-top: 1px solid #F1F5F9;">
                    Computer Generated B2B Official Invoice • Bilal Decor Studio (Marquee Ceilings & Stage Drapery Atelier) • bilaldecorstudio.com
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
     * Download Invoice as PDF directly from the visible document
     * 100% reliable: captures actual rendered DOM element, no blank pages, perfect A4 formatting.
     */
    async downloadPDF() {
        const sourceElement = document.getElementById('invoiceDocument');
        if (!sourceElement) {
            alert("Invoice document nahi mila.");
            return;
        }

        const downloadBtn = document.querySelector('#invoiceModal button[onclick*="downloadPDF"]');
        const origBtnHtml = downloadBtn ? downloadBtn.innerHTML : '';
        if (downloadBtn) {
            downloadBtn.innerHTML = '<span>⏳ PDF Tayar ho raha hai...</span>';
            downloadBtn.disabled = true;
        }

        try {
            // Reset modal scroll so html2canvas captures from top-left (0, 0)
            const modal = document.getElementById('invoiceModal');
            if (modal) modal.scrollTop = 0;
            window.scrollTo(0, 0);

            if (window.html2pdf) {
                const invoiceNo = (this.currentData && this.currentData.invoiceNo) 
                    ? this.currentData.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_')
                    : 'Bilal_Decor_Invoice';

                const opt = {
                    margin: [6, 8, 6, 8], // 6mm top/bottom, 8mm left/right
                    filename: `Bilal_Decor_${invoiceNo}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2, // 2x high resolution
                        useCORS: true,
                        logging: false,
                        scrollX: 0,
                        scrollY: 0
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait'
                    },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };

                // Capture directly from the real visible element!
                await html2pdf().set(opt).from(sourceElement).save();
            } else {
                // Fallback to browser print dialogue
                window.print();
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
