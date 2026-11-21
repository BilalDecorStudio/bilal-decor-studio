/**
 * Bilal Decor Studio - Client Work History & Active Orders Tracker (Roman Urdu)
 */

const Tracker = {
    renderHistory(filterCity = "all") {
        const historyContainer = document.getElementById('clientHistoryList');
        if (!historyContainer) return;

        let history = Store.getClientHistory();
        if (filterCity && filterCity !== "all") {
            history = history.filter(item => item.city.toLowerCase().includes(filterCity.toLowerCase()));
        }

        if (history.length === 0) {
            historyContainer.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl">
                        <p class="font-bold text-sm">Is shehar ke liye abhi koi record mojood nahi hai.</p>
                    </td>
                </tr>
            `;
            return;
        }

        historyContainer.innerHTML = history.map((item, index) => `
            <tr class="border-b border-slate-200 hover:bg-amber-50/50 transition">
                <td class="py-4 px-4 font-medium text-slate-900">
                    <div class="flex items-center space-x-3">
                        <span class="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-xs font-bold font-serif-luxury">
                            ${index + 1}
                        </span>
                        <div>
                            <p class="font-bold text-slate-900">${item.clientName}</p>
                            <span class="inline-flex items-center text-xs text-amber-800 font-mono font-bold">
                                📞 ${item.phoneMasked}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-4 text-slate-700">
                    <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        📍 ${item.city}
                    </span>
                </td>
                <td class="py-4 px-4 text-sm text-slate-700">
                    <p class="font-bold text-slate-900">${item.designName}</p>
                    <p class="text-xs text-slate-500">${item.totalSqFt ? item.totalSqFt.toLocaleString() + ' sq ft' : ''} | Rate: Rs. ${item.rate || 65}</p>
                </td>
                <td class="py-4 px-4 text-xs text-slate-500 font-medium">
                    📅 ${item.date}
                </td>
                <td class="py-4 px-4 text-center">
                    <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                        ✓ Mukammal Installed
                    </span>
                </td>
                <td class="py-4 px-4 text-right">
                    <button onclick="Invoice.generateFromHistory('${item.id}')" class="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-sm flex items-center space-x-1 ml-auto">
                        <span>📄 Invoice</span>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderActivePipeline() {
        const pipelineContainer = document.getElementById('activeOrdersPipeline');
        if (!pipelineContainer) return;

        const orders = Store.getOrders();
        const activeOrders = orders.filter(o => o.status !== 'delivered');

        if (activeOrders.length === 0) {
            pipelineContainer.innerHTML = `
                <div class="p-6 text-center text-slate-500 col-span-full font-bold">
                    Koi active order zair-e-production nahi hai.
                </div>
            `;
            return;
        }

        pipelineContainer.innerHTML = activeOrders.map(order => {
            const statusBadge = this.getStatusBadge(order.status);
            const firstItem = order.items && order.items[0] ? order.items[0] : null;
            return `
                <div class="luxury-card p-5 rounded-2xl bg-white border border-amber-300/60 shadow-sm hover:shadow-md transition w-72 sm:w-80 shrink-0 flex flex-col justify-between">
                    <div class="flex items-center justify-between mb-3">
                        <span class="font-mono text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-extrabold border border-amber-200">
                            #${order.orderId}
                        </span>
                        ${statusBadge}
                    </div>
                    <h4 class="font-bold text-slate-900 text-base mb-1">${order.clientName}</h4>
                    <p class="text-xs text-slate-500 mb-3">📍 ${order.city} • 🏛️ ${order.marqueeName || 'Marquee'}</p>
                    <div class="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 mb-3 text-xs">
                        <p class="text-slate-900 font-bold truncate">${firstItem ? firstItem.title : 'Marquee Ceiling'}</p>
                        <p class="text-slate-600 mt-1">
                            Size: <span class="font-bold text-slate-900">${firstItem ? `${firstItem.length} x ${firstItem.width} ft (${firstItem.sqFt} sq ft)` : '-'}</span>
                        </p>
                    </div>
                    <div class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Delivery: <strong class="text-amber-800 font-bold">${order.expectedDispatch || 'Jald'}</strong></span>
                        <span class="font-mono text-slate-600 font-semibold">📞 ${order.phoneMasked || '0300-****'}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    lookupOrder(query, passcode) {
        const cleanQuery = (query || "").trim().toLowerCase();
        const cleanPass = (passcode || "").trim();

        if (!cleanQuery) {
            return { success: false, message: "Barahe meharbani apna Order Number ya Phone Number likhein." };
        }

        const orders = Store.getOrders();
        const match = orders.find(o => {
            const matchId = o.orderId.toLowerCase() === cleanQuery || o.orderId.toLowerCase() === ('bds-' + cleanQuery);
            const matchPhone = o.clientPhone && o.clientPhone.replace(/[^0-9]/g, '').includes(cleanQuery.replace(/[^0-9]/g, ''));
            return matchId || matchPhone;
        });

        if (!match) {
            return {
                success: false,
                message: "Maazrat! Is number ya Order ID ka koi record nahi mila. Barahe meharbani sahi maloomat likhein ya admin se rabta karein."
            };
        }

        if (cleanPass && match.passcode && match.passcode !== cleanPass) {
            return {
                success: false,
                message: "Darj kiya gaya Passcode ghalat hai. Apna 4 digits wala PIN check karein."
            };
        }

        return {
            success: true,
            order: match
        };
    },

    getStatusBadge(status) {
        const map = {
            pending: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">Pending (Order Check)</span>',
            verified: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Advance Confirm</span>',
            cutting: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">Kapre ki Katai (Cutting)</span>',
            stitching: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">Silai Chalu (Stitching)</span>',
            dispatched: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Cargo par Rawana</span>',
            delivered: '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">Delivery Mukammal</span>'
        };
        return map[status] || '<span class="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">Processing</span>';
    },

    renderTimeline(status) {
        const steps = [
            { id: 'pending', title: 'Order Mosool Hua', desc: 'Website ya WhatsApp se order place hua' },
            { id: 'verified', title: 'Payment Confirm', desc: 'JazzCash / EasyPaisa / Bank slip tasdeeq shuda' },
            { id: 'cutting', title: 'Fabric Cutting', desc: 'Custom lambai aur chaurai ke mutabiq katai' },
            { id: 'stitching', title: 'Silai aur Finishing', desc: 'Haath ki pleating, hooks aur final QC check' },
            { id: 'dispatched', title: 'Cargo Rawangi', desc: 'Cargo bilty jari aur parcel rawana' }
        ];

        const statusOrder = ['pending', 'verified', 'cutting', 'stitching', 'dispatched', 'delivered'];
        const currentIndex = statusOrder.indexOf(status);

        return `
            <div class="relative py-4">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                    ${steps.map((step, idx) => {
                        const isDone = currentIndex >= idx;
                        const isCurrent = currentIndex === idx;
                        return `
                            <div class="p-3.5 rounded-xl border ${isCurrent ? 'bg-amber-100/80 border-amber-500 shadow-sm' : isDone ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'}">
                                <div class="flex items-center space-x-2 mb-1.5">
                                    <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-amber-600 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">
                                        ${isDone ? '✓' : idx + 1}
                                    </span>
                                    <span class="font-bold text-xs ${isCurrent ? 'text-amber-900' : isDone ? 'text-emerald-900' : 'text-slate-500'}">${step.title}</span>
                                </div>
                                <p class="text-[11px] leading-relaxed text-slate-600">${step.desc}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
};

window.Tracker = Tracker;
