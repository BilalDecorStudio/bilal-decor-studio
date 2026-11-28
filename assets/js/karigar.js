/**
 * Bilal Decor Studio - Karigar (Craftsman/Worker) Management & Ledger Engine
 * Handles Worker Profiles, Daily Multi-Item Work Roznamcha, Rate Calculations (Default Rs. 12),
 * Payment Deductions, Running Balance, Worker Portal & Print Statements.
 */

const KarigarApp = {
    karigars: [],
    currentKarigarId: null,
    currentLedgerData: null,
    activeWorker: null, // For Karigar self-service portal

    // Catalog suggestions for quick item selection
    catalogPresets: [
        { title: "Shahi Mughal Gold Velvet Stage Chadar", category: "Stage", defaultRate: 12 },
        { title: "Emerald & Champagne Hall Ceiling", category: "Hall", defaultRate: 12 },
        { title: "Crown Entrance Rahdari Canopy", category: "Entrance", defaultRate: 12 },
        { title: "Royal Ivory Floral Ceiling", category: "Hall", defaultRate: 12 },
        { title: "Starry Night Central Ceiling Canopy", category: "Ceiling", defaultRate: 12 },
        { title: "Ruby Crimson Bridal Stage Backdrop", category: "Stage", defaultRate: 12 },
        { title: "Grand Corridor Pleated Fall", category: "Rahdari", defaultRate: 12 },
        { title: "Custom Item / Khud Naam Likhein", category: "Custom", defaultRate: 12, isCustom: true }
    ],

    // =========================================================
    // INITIALIZATION
    // =========================================================
    async init() {
        console.log("KarigarApp Engine Initializing...");
        // Check if on worker portal view
        this.checkWorkerSession();
    },

    getAdminToken() {
        return window.Admin ? Admin.getToken() : localStorage.getItem('bds_admin_token');
    },

    getWorkerToken() {
        return localStorage.getItem('bds_karigar_token');
    },

    formatPKR(num) {
        const val = parseFloat(num) || 0;
        return "Rs. " + Math.round(val).toLocaleString('en-PK');
    },

    // =========================================================
    // ADMIN: KARIGAR ROSTER & DASHBOARD
    // =========================================================
    async loadAdminKarigars() {
        const token = this.getAdminToken();
        if (!token) return;

        try {
            const res = await fetch('/api/admin/karigars', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                this.karigars = data.karigars || [];
                this.renderAdminKarigarKPIs(data.stats);
                this.renderAdminKarigarTable();
                this.populateKarigarDropdowns();
            } else {
                console.warn("Failed to load karigars:", data.error || data.message);
            }
        } catch (e) {
            console.error("Error loading karigars:", e);
        }
    },

    renderAdminKarigarKPIs(stats) {
        if (!stats) return;
        const totalCountEl = document.getElementById('karigarKPITotal');
        const totalWorkEl = document.getElementById('karigarKPIWork');
        const totalPaidEl = document.getElementById('karigarKPIPaid');
        const totalBalanceEl = document.getElementById('karigarKPIBalance');

        if (totalCountEl) totalCountEl.innerText = stats.totalKarigars || 0;
        if (totalWorkEl) totalWorkEl.innerText = this.formatPKR(stats.overallTotalWork || 0);
        if (totalPaidEl) totalPaidEl.innerText = this.formatPKR(stats.overallTotalPaid || 0);
        if (totalBalanceEl) {
            totalBalanceEl.innerText = this.formatPKR(stats.overallBalanceDue || 0);
            if (stats.overallBalanceDue > 0) {
                totalBalanceEl.className = "text-xl md:text-2xl font-black text-rose-600 font-mono";
            } else {
                totalBalanceEl.className = "text-xl md:text-2xl font-black text-emerald-600 font-mono";
            }
        }
    },

    renderAdminKarigarTable() {
        const tbody = document.getElementById('karigarTableBody');
        if (!tbody) return;

        const searchInput = document.getElementById('karigarSearchInput');
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

        let list = this.karigars;
        if (query) {
            list = list.filter(k => 
                (k.name && k.name.toLowerCase().includes(query)) ||
                (k.phone && k.phone.includes(query)) ||
                (k.craft && k.craft.toLowerCase().includes(query)) ||
                (k.id && k.id.toLowerCase().includes(query))
            );
        }

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-12 text-center text-slate-500">
                        <div class="flex flex-col items-center justify-center space-y-2">
                            <span class="text-3xl">🪡</span>
                            <p class="font-bold text-sm">Koi Karigar nahi mila.</p>
                            <button onclick="KarigarApp.openAddKarigarModal()" class="mt-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition">
                                + Naya Karigar Shamil Karein
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(k => {
            const balanceDue = k.balanceDue || 0;
            const balanceBadge = balanceDue > 0
                ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Baqi: ${this.formatPKR(balanceDue)}
                   </span>`
                : (balanceDue < 0 
                    ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Advance: ${this.formatPKR(Math.abs(balanceDue))}
                       </span>`
                    : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Clear (0)
                       </span>`);

            return `
                <tr class="border-b border-slate-100 hover:bg-amber-50/40 transition">
                    <td class="py-3 px-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-xs shadow-sm">
                                ${k.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p class="text-sm font-extrabold text-slate-900">${k.name}</p>
                                <p class="text-xs text-slate-500 font-mono">${k.id} • ${k.username || 'No login'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-xs font-semibold text-slate-700">
                        ${k.craft || 'Ceiling Maker'}
                    </td>
                    <td class="py-3 px-4 text-xs font-mono text-slate-800">
                        ${k.phone || '—'}
                    </td>
                    <td class="py-3 px-4 text-xs font-mono font-bold text-amber-800">
                        Rs. ${k.defaultRate || 12} / sq ft
                    </td>
                    <td class="py-3 px-4 text-xs font-mono">
                        <div class="space-y-0.5">
                            <div class="text-slate-900 font-bold">Kul: ${this.formatPKR(k.totalWork || 0)}</div>
                            <div class="text-emerald-700">Adaigi: ${this.formatPKR(k.totalPaid || 0)}</div>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-xs">
                        ${balanceBadge}
                    </td>
                    <td class="py-3 px-4 text-right">
                        <div class="inline-flex items-center space-x-1.5">
                            <button onclick="KarigarApp.openWorkEntryModal('${k.id}')" title="Roznamcha Kaam Darj Karein" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1">
                                <span>➕ Kaam</span>
                            </button>
                            <button onclick="KarigarApp.openPaymentModal('${k.id}')" title="Paisa Adaigi Darj Karein" class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1">
                                <span>💵 Paisa</span>
                            </button>
                            <button onclick="KarigarApp.openLedgerModal('${k.id}')" title="Khata & Statement Dekhein" class="px-2.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-bold transition flex items-center space-x-1">
                                <span>📜 Khata</span>
                            </button>
                            <button onclick="KarigarApp.openEditKarigarModal('${k.id}')" title="Profile Edit Karein" class="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-slate-100 rounded-lg transition">
                                ✏️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    populateKarigarDropdowns() {
        const dropdowns = ['workEntryKarigarSelect', 'paymentKarigarSelect'];
        dropdowns.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            const currentVal = select.value;
            select.innerHTML = '<option value="">-- Karigar Muntakhib Karein --</option>' +
                this.karigars.map(k => `
                    <option value="${k.id}" data-rate="${k.defaultRate || 12}">
                        ${k.name} (${k.craft || 'Ceiling Maker'} - Rate: Rs. ${k.defaultRate || 12}/sq ft)
                    </option>
                `).join('');
            if (currentVal) select.value = currentVal;
        });
    },

    // =========================================================
    // MODAL: ADD / EDIT KARIGAR
    // =========================================================
    openAddKarigarModal() {
        document.getElementById('karigarModalTitle').innerText = "Naya Karigar Shamil Karein";
        document.getElementById('karigarFormId').value = "";
        document.getElementById('karigarFormName').value = "";
        document.getElementById('karigarFormPhone').value = "";
        document.getElementById('karigarFormUsername').value = "";
        document.getElementById('karigarFormPassword').value = "karigar123";
        document.getElementById('karigarFormCraft').value = "Ceiling Maker (Chadar Master)";
        document.getElementById('karigarFormRate').value = "12";
        document.getElementById('karigarFormStatus').value = "Active";
        document.getElementById('karigarFormNotes').value = "";
        document.getElementById('karigarPasswordHelp').innerText = "Default password: karigar123 (Karigar login ke liye istemal kare ga)";

        const modal = document.getElementById('karigarProfileModal');
        if (modal) modal.classList.remove('hidden');
    },

    openEditKarigarModal(id) {
        const k = this.karigars.find(item => item.id === id);
        if (!k) return;

        document.getElementById('karigarModalTitle').innerText = `Karigar Profile Edit: ${k.name}`;
        document.getElementById('karigarFormId').value = k.id;
        document.getElementById('karigarFormName').value = k.name || "";
        document.getElementById('karigarFormPhone').value = k.phone || "";
        document.getElementById('karigarFormUsername').value = k.username || "";
        document.getElementById('karigarFormPassword').value = "";
        document.getElementById('karigarFormCraft').value = k.craft || "Ceiling Maker";
        document.getElementById('karigarFormRate').value = k.defaultRate !== undefined ? k.defaultRate : "12";
        document.getElementById('karigarFormStatus').value = k.status || "Active";
        document.getElementById('karigarFormNotes').value = k.notes || "";
        document.getElementById('karigarPasswordHelp').innerText = "Agar password nahi badalna to isay khali chor dein.";

        const modal = document.getElementById('karigarProfileModal');
        if (modal) modal.classList.remove('hidden');
    },

    closeKarigarProfileModal() {
        const modal = document.getElementById('karigarProfileModal');
        if (modal) modal.classList.add('hidden');
    },

    async submitKarigarProfile(event) {
        event.preventDefault();
        const id = document.getElementById('karigarFormId').value.trim();
        const name = document.getElementById('karigarFormName').value.trim();
        const phone = document.getElementById('karigarFormPhone').value.trim();
        const username = document.getElementById('karigarFormUsername').value.trim();
        const password = document.getElementById('karigarFormPassword').value.trim();
        const craft = document.getElementById('karigarFormCraft').value.trim();
        const defaultRate = parseFloat(document.getElementById('karigarFormRate').value) || 12;
        const status = document.getElementById('karigarFormStatus').value;
        const notes = document.getElementById('karigarFormNotes').value.trim();

        const token = this.getAdminToken();
        const isEdit = Boolean(id);
        const url = '/api/admin/karigars';
        const method = isEdit ? 'PUT' : 'POST';

        const payload = { id, name, phone, username, craft, defaultRate, status, notes };
        if (password) payload.password = password;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message || "Kamyabi se save ho gaya.");
                this.closeKarigarProfileModal();
                await this.loadAdminKarigars();
            } else {
                alert(data.message || "Ghalti paish aayi.");
            }
        } catch (e) {
            console.error("Error saving karigar profile:", e);
            alert("Server se rabta nahi ho saka.");
        }
    },

    // =========================================================
    // MODAL: DAILY WORK ENTRY (ROZNAMCHA) WITH MULTI-ITEMS
    // =========================================================
    openWorkEntryModal(preselectKarigarId = null) {
        this.populateKarigarDropdowns();
        const select = document.getElementById('workEntryKarigarSelect');
        if (preselectKarigarId && select) {
            select.value = preselectKarigarId;
        }

        // Set date to today
        const dateInput = document.getElementById('workEntryDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }

        // Reset items container
        const container = document.getElementById('workItemsContainer');
        if (container) {
            container.innerHTML = '';
            // Add first empty item row
            this.addWorkItemRow();
        }

        // Reset payment deduction input
        const payAmount = document.getElementById('workDeductionAmount');
        if (payAmount) payAmount.value = '';
        const payNotes = document.getElementById('workDeductionNotes');
        if (payNotes) payNotes.value = 'Roznamcha bill adaigi';

        this.updateWorkEntryTotals();

        const modal = document.getElementById('karigarWorkEntryModal');
        if (modal) modal.classList.remove('hidden');
    },

    closeWorkEntryModal() {
        const modal = document.getElementById('karigarWorkEntryModal');
        if (modal) modal.classList.add('hidden');
    },

    onWorkKarigarChange() {
        const select = document.getElementById('workEntryKarigarSelect');
        const opt = select.options[select.selectedIndex];
        const defaultRate = opt ? (parseFloat(opt.dataset.rate) || 12) : 12;

        // Update default rate on existing rows if not manually overridden
        document.querySelectorAll('.work-item-row').forEach(row => {
            const rateInput = row.querySelector('.item-rate-input');
            if (rateInput && (!rateInput.dataset.modified || rateInput.dataset.modified === 'false')) {
                rateInput.value = defaultRate;
            }
        });
        this.updateWorkEntryTotals();
    },

    addWorkItemRow(prefill = null) {
        const container = document.getElementById('workItemsContainer');
        if (!container) return;

        const select = document.getElementById('workEntryKarigarSelect');
        const opt = select ? select.options[select.selectedIndex] : null;
        const defaultRate = opt ? (parseFloat(opt.dataset.rate) || 12) : 12;

        const rowIndex = container.children.length + 1;
        const row = document.createElement('div');
        row.className = "work-item-row bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative transition hover:border-amber-300";

        const optionsHtml = this.catalogPresets.map(preset => 
            `<option value="${preset.title}" data-category="${preset.category}" ${preset.isCustom ? 'data-custom="true"' : ''}>
                ${preset.title}
             </option>`
        ).join('');

        row.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded-full bg-amber-200 text-amber-900 text-xs font-black flex items-center justify-center">
                        ${rowIndex}
                    </span>
                    <span class="text-xs font-bold text-slate-800">Chadar / Item Details</span>
                </div>
                <button type="button" onclick="KarigarApp.removeWorkItemRow(this)" class="text-xs text-red-600 hover:text-red-800 font-bold transition px-2 py-0.5 rounded hover:bg-red-50">
                    ✕ Hataein
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                <!-- Design / Item Selection -->
                <div class="md:col-span-5">
                    <label class="block text-xs font-bold text-slate-700 mb-1">Item / Chadar Ka Naam</label>
                    <select onchange="KarigarApp.onItemPresetChange(this)" class="item-preset-select w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:border-amber-600 focus:outline-none">
                        ${optionsHtml}
                    </select>
                    <!-- Custom Title Input (Shown when custom item chosen) -->
                    <input type="text" placeholder="Custom item ka naam likhein..." class="item-custom-title hidden mt-1.5 w-full bg-white border border-amber-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:border-amber-600 focus:outline-none">
                </div>

                <!-- Size: Length x Width -->
                <div class="md:col-span-3">
                    <label class="block text-xs font-bold text-slate-700 mb-1">Size (Ft: L x W)</label>
                    <div class="flex items-center space-x-1.5">
                        <input type="number" step="0.5" min="0" placeholder="L (ft)" oninput="KarigarApp.calculateRow(this)" class="item-length-input w-1/2 bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-2 text-xs focus:border-amber-600 focus:outline-none">
                        <span class="text-slate-400 text-xs font-bold">×</span>
                        <input type="number" step="0.5" min="0" placeholder="W (ft)" oninput="KarigarApp.calculateRow(this)" class="item-width-input w-1/2 bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-2 text-xs focus:border-amber-600 focus:outline-none">
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1 font-mono">
                        Sq Ft: <span class="item-sqft-display font-bold text-slate-800">0</span>
                    </div>
                </div>

                <!-- Rate per Sq Ft (Default: 12) -->
                <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-slate-700 mb-1">Rate (Rs/SqFt)</label>
                    <input type="number" step="0.5" min="0" value="${defaultRate}" placeholder="12" oninput="KarigarApp.calculateRow(this, true)" class="item-rate-input w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-2 text-xs font-bold text-amber-900 focus:border-amber-600 focus:outline-none">
                    <div class="text-[9px] text-slate-400 mt-0.5">Default: Rs. 12</div>
                </div>

                <!-- Quantity -->
                <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-slate-700 mb-1">Tadad (Qty)</label>
                    <input type="number" min="1" value="1" oninput="KarigarApp.calculateRow(this)" class="item-qty-input w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-2 text-xs font-bold focus:border-amber-600 focus:outline-none">
                </div>
            </div>

            <!-- Total Amount & Override Option -->
            <div class="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div class="flex items-center space-x-2 text-xs text-slate-600">
                    <span class="font-bold">Ya Total Rakam Darj Karein:</span>
                    <input type="number" min="0" placeholder="Total Rs (Agar rate nahi)" oninput="KarigarApp.onManualTotalInput(this)" class="item-total-input w-36 bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:border-amber-600 focus:outline-none">
                    <span class="text-[10px] text-slate-400">(Agar size/rate nahi)</span>
                </div>
                <div class="text-right">
                    <span class="text-xs text-slate-500">Item Total: </span>
                    <span class="item-line-total-display text-sm font-extrabold text-emerald-700 font-mono">Rs. 0</span>
                </div>
            </div>
        `;

        container.appendChild(row);

        if (prefill) {
            // Apply prefill if provided
        }

        this.updateWorkEntryTotals();
    },

    removeWorkItemRow(btn) {
        const row = btn.closest('.work-item-row');
        const container = document.getElementById('workItemsContainer');
        if (container.children.length <= 1) {
            alert("Kam az kam ik item ka hona lazmi hai.");
            return;
        }
        row.remove();
        // Re-index remaining rows
        Array.from(container.children).forEach((r, idx) => {
            const badge = r.querySelector('span.w-6');
            if (badge) badge.innerText = idx + 1;
        });
        this.updateWorkEntryTotals();
    },

    onItemPresetChange(selectEl) {
        const row = selectEl.closest('.work-item-row');
        const customInput = row.querySelector('.item-custom-title');
        const opt = selectEl.options[selectEl.selectedIndex];
        const isCustom = opt.dataset.custom === 'true';

        if (isCustom) {
            customInput.classList.remove('hidden');
            customInput.focus();
        } else {
            customInput.classList.add('hidden');
        }
    },

    calculateRow(inputEl, isRateChange = false) {
        const row = inputEl.closest('.work-item-row');
        const length = parseFloat(row.querySelector('.item-length-input').value) || 0;
        const width = parseFloat(row.querySelector('.item-width-input').value) || 0;
        const rateInput = row.querySelector('.item-rate-input');
        const qty = parseInt(row.querySelector('.item-qty-input').value, 10) || 1;
        const manualTotalInput = row.querySelector('.item-total-input');
        const sqftDisplay = row.querySelector('.item-sqft-display');
        const lineTotalDisplay = row.querySelector('.item-line-total-display');

        if (isRateChange) {
            rateInput.dataset.modified = 'true';
        }

        const rate = (rateInput.value !== '' && !isNaN(parseFloat(rateInput.value)))
            ? parseFloat(rateInput.value)
            : 12;

        let sqFt = 0;
        if (length > 0 && width > 0) {
            sqFt = Math.round(length * width * 100) / 100;
        }
        sqftDisplay.innerText = sqFt.toLocaleString() + " sq ft";

        let lineTotal = 0;
        if (sqFt > 0 && rate > 0) {
            lineTotal = Math.round(sqFt * rate * qty);
            manualTotalInput.value = ''; // clear manual total if auto-calculated
        } else if (manualTotalInput.value !== '' && !isNaN(parseFloat(manualTotalInput.value))) {
            lineTotal = parseFloat(manualTotalInput.value);
        }

        lineTotalDisplay.innerText = this.formatPKR(lineTotal);
        row.dataset.calculatedTotal = lineTotal;
        row.dataset.calculatedSqFt = sqFt * qty;

        this.updateWorkEntryTotals();
    },

    onManualTotalInput(manualInputEl) {
        const row = manualInputEl.closest('.work-item-row');
        const lineTotalDisplay = row.querySelector('.item-line-total-display');
        const val = parseFloat(manualInputEl.value) || 0;
        
        lineTotalDisplay.innerText = this.formatPKR(val);
        row.dataset.calculatedTotal = val;
        this.updateWorkEntryTotals();
    },

    updateWorkEntryTotals() {
        let grandTotal = 0;
        let grandSqFt = 0;
        let itemCount = 0;

        document.querySelectorAll('.work-item-row').forEach(row => {
            const rowTotal = parseFloat(row.dataset.calculatedTotal) || 0;
            const rowSqFt = parseFloat(row.dataset.calculatedSqFt) || 0;
            grandTotal += rowTotal;
            grandSqFt += rowSqFt;
            itemCount += 1;
        });

        const totalItemsEl = document.getElementById('workEntrySummaryItems');
        const totalSqFtEl = document.getElementById('workEntrySummarySqFt');
        const grandTotalEl = document.getElementById('workEntrySummaryGrandTotal');

        if (totalItemsEl) totalItemsEl.innerText = itemCount;
        if (totalSqFtEl) totalSqFtEl.innerText = grandSqFt.toLocaleString() + " sq ft";
        if (grandTotalEl) grandTotalEl.innerText = this.formatPKR(grandTotal);

        // Deductions & Remaining calculation
        const deductionInput = document.getElementById('workDeductionAmount');
        const deduction = deductionInput ? (parseFloat(deductionInput.value) || 0) : 0;
        const netRemaining = grandTotal - deduction;

        const netRemainingEl = document.getElementById('workEntryNetRemaining');
        if (netRemainingEl) {
            netRemainingEl.innerText = this.formatPKR(netRemaining);
            netRemainingEl.className = netRemaining >= 0 ? "text-emerald-700 font-black font-mono" : "text-amber-800 font-black font-mono";
        }
    },

    async submitWorkEntry(event) {
        event.preventDefault();
        const karigarId = document.getElementById('workEntryKarigarSelect').value;
        const date = document.getElementById('workEntryDate').value;
        const notes = document.getElementById('workEntryNotes').value.trim();

        if (!karigarId) {
            alert("Barahe meharbani Karigar muntakhib karein.");
            return;
        }
        if (!date) {
            alert("Tareekh darj karein.");
            return;
        }

        const rows = document.querySelectorAll('.work-item-row');
        if (rows.length === 0) {
            alert("Kam az kam 1 item shamil karein.");
            return;
        }

        const items = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const selectEl = row.querySelector('.item-preset-select');
            const customInput = row.querySelector('.item-custom-title');
            const isCustom = selectEl.options[selectEl.selectedIndex].dataset.custom === 'true';

            let title = isCustom ? customInput.value.trim() : selectEl.value;
            if (!title) title = `Item #${i+1}`;

            const length = parseFloat(row.querySelector('.item-length-input').value) || 0;
            const width = parseFloat(row.querySelector('.item-width-input').value) || 0;
            const rateInputVal = row.querySelector('.item-rate-input').value;
            const qty = parseInt(row.querySelector('.item-qty-input').value, 10) || 1;
            const manualTotalVal = row.querySelector('.item-total-input').value;

            let sqFt = (length > 0 && width > 0) ? Math.round(length * width * 100) / 100 : 0;
            let rate = (rateInputVal !== '' && !isNaN(parseFloat(rateInputVal))) ? parseFloat(rateInputVal) : 12;

            let lineTotal = 0;
            if (sqFt > 0 && rate > 0) {
                lineTotal = Math.round(sqFt * rate * qty);
            } else if (manualTotalVal !== '' && !isNaN(parseFloat(manualTotalVal))) {
                lineTotal = parseFloat(manualTotalVal);
            } else {
                alert(`Row #${i+1} ("${title}") ke liye size aur rate, ya direct Total Amount dalna lazmi hai!`);
                return;
            }

            items.push({
                title,
                category: selectEl.options[selectEl.selectedIndex].dataset.category || 'General',
                length,
                width,
                sqFt,
                rate,
                quantity: qty,
                totalAmount: lineTotal,
                customNote: ''
            });
        }

        // Deduction handling
        const deductionAmount = parseFloat(document.getElementById('workDeductionAmount').value) || 0;
        const deductionNotes = document.getElementById('workDeductionNotes').value.trim();
        const deductionMethod = document.getElementById('workDeductionMethod').value || 'Cash';

        const payload = {
            karigarId,
            date,
            items,
            notes
        };

        if (deductionAmount > 0) {
            payload.paymentDeduction = {
                amount: deductionAmount,
                method: deductionMethod,
                notes: deductionNotes || 'Roznamcha bill adaigi'
            };
        }

        const token = this.getAdminToken();
        try {
            const res = await fetch('/api/admin/karigar-work', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                let msg = "Roznamcha kaam kamyabi se darj ho gaya!";
                if (data.paymentEntry) {
                    msg += `\nRs. ${data.paymentEntry.amount} ki adaigi bhi deduct kar di gai.`;
                }
                alert(msg);
                this.closeWorkEntryModal();
                await this.loadAdminKarigars();
            } else {
                alert(data.message || "Ghalti paish aayi.");
            }
        } catch (e) {
            console.error("Error submitting work entry:", e);
            alert("Server se rabta nahi ho saka.");
        }
    },

    // =========================================================
    // MODAL: RECORD PAYMENT (PAISA ADAIGI & DEDUCTION)
    // =========================================================
    openPaymentModal(preselectKarigarId = null) {
        this.populateKarigarDropdowns();
        const select = document.getElementById('paymentKarigarSelect');
        if (preselectKarigarId && select) {
            select.value = preselectKarigarId;
        }

        document.getElementById('paymentDate').value = new Date().toISOString().slice(0, 10);
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentMethod').value = 'Cash';
        document.getElementById('paymentNotes').value = '';

        const modal = document.getElementById('karigarPaymentModal');
        if (modal) modal.classList.remove('hidden');
    },

    closePaymentModal() {
        const modal = document.getElementById('karigarPaymentModal');
        if (modal) modal.classList.add('hidden');
    },

    async submitPayment(event) {
        event.preventDefault();
        const karigarId = document.getElementById('paymentKarigarSelect').value;
        const date = document.getElementById('paymentDate').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentMethod = document.getElementById('paymentMethod').value;
        const notes = document.getElementById('paymentNotes').value.trim();

        if (!karigarId) {
            alert("Barahe meharbani Karigar muntakhib karein.");
            return;
        }
        if (!amount || isNaN(amount) || amount <= 0) {
            alert("Durust raqam (Amount > 0) darj karein.");
            return;
        }

        const token = this.getAdminToken();
        try {
            const res = await fetch('/api/admin/karigar-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ karigarId, date, amount, paymentMethod, notes })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message || "Payment kamyabi se record ho gai!");
                this.closePaymentModal();
                await this.loadAdminKarigars();
                // If ledger modal is open, refresh it
                if (this.currentKarigarId === karigarId) {
                    this.openLedgerModal(karigarId);
                }
            } else {
                alert(data.message || "Payment darj nahi ho saki.");
            }
        } catch (e) {
            console.error("Error submitting payment:", e);
            alert("Server se rabta nahi ho saka.");
        }
    },

    // =========================================================
    // MODAL: KARIGAR KHATA & FULL LEDGER STATEMENT
    // =========================================================
    async openLedgerModal(karigarId) {
        this.currentKarigarId = karigarId;
        const token = this.getAdminToken();
        const modal = document.getElementById('karigarLedgerModal');
        if (modal) modal.classList.remove('hidden');

        const container = document.getElementById('karigarLedgerContent');
        if (container) {
            container.innerHTML = `
                <div class="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                    <div class="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-xs font-bold font-mono">Khata load ho raha hai...</p>
                </div>
            `;
        }

        try {
            const res = await fetch(`/api/admin/karigar-ledger?id=${karigarId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                this.currentLedgerData = data;
                this.renderLedgerStatement(data);
            } else {
                if (container) container.innerHTML = `<div class="p-8 text-center text-red-600">${data.message || 'Khata load nahi ho saka.'}</div>`;
            }
        } catch (e) {
            console.error("Error fetching karigar ledger:", e);
            if (container) container.innerHTML = `<div class="p-8 text-center text-red-600">Server error.</div>`;
        }
    },

    closeLedgerModal() {
        const modal = document.getElementById('karigarLedgerModal');
        if (modal) modal.classList.add('hidden');
        this.currentKarigarId = null;
        this.currentLedgerData = null;
    },

    renderLedgerStatement(data) {
        const container = document.getElementById('karigarLedgerContent');
        if (!container) return;

        const { karigar, summary, ledger } = data;
        const balanceColor = summary.balanceDue > 0 ? "text-rose-600" : (summary.balanceDue < 0 ? "text-amber-800" : "text-emerald-700");
        const balanceTitle = summary.balanceDue > 0 ? "Baqi Rakam (Karigar Ko Deni Hai)" : (summary.balanceDue < 0 ? "Advance Adaigi (Karigar Ka Dena Hai)" : "Khata Mukammal Clear Hai");

        let ledgerRows = '';
        if (ledger.length === 0) {
            ledgerRows = `<tr><td colspan="7" class="py-8 text-center text-slate-500 font-bold text-xs">Abhi tak koi kaam ya adaigi darj nahi hui.</td></tr>`;
        } else {
            ledgerRows = ledger.map(ev => {
                const isWork = ev.type === 'WORK';
                const typeBadge = isWork
                    ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">🛠 Kaam</span>`
                    : `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">💵 Adaigi</span>`;

                const itemsList = isWork && ev.items && ev.items.length
                    ? `<div class="text-[11px] text-slate-600 mt-1 space-y-0.5">
                        ${ev.items.map(it => `• <b>${it.title}</b> (${it.length > 0 ? `${it.length}x${it.width} ft = ${it.sqFt} sq ft @ Rs. ${it.rate}` : ''} | Qty: ${it.quantity} | Total: ${this.formatPKR(it.totalAmount)})`).join('<br>')}
                       </div>`
                    : '';

                return `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td class="py-3 px-3 text-xs font-mono text-slate-700 whitespace-nowrap">${ev.date}</td>
                        <td class="py-3 px-3">${typeBadge}</td>
                        <td class="py-3 px-3 text-xs text-slate-800">
                            <span class="font-bold">${ev.title}</span>
                            ${itemsList}
                            ${ev.notes ? `<div class="text-[10px] text-slate-500 italic mt-0.5">Note: ${ev.notes}</div>` : ''}
                        </td>
                        <td class="py-3 px-3 text-xs font-mono text-right text-emerald-800 font-bold">
                            ${ev.credit > 0 ? this.formatPKR(ev.credit) : '—'}
                        </td>
                        <td class="py-3 px-3 text-xs font-mono text-right text-rose-700 font-bold">
                            ${ev.debit > 0 ? this.formatPKR(ev.debit) : '—'}
                        </td>
                        <td class="py-3 px-3 text-xs font-mono text-right font-black ${ev.balanceAfter > 0 ? 'text-rose-600' : 'text-emerald-700'}">
                            ${this.formatPKR(ev.balanceAfter)}
                        </td>
                        <td class="py-3 px-2 text-center">
                            <button onclick="KarigarApp.deleteLedgerEntry('${ev.type}', '${ev.id}')" title="Entry Delete Karein" class="text-slate-400 hover:text-red-600 transition text-xs">
                                🗑
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        container.innerHTML = `
            <div id="printableKarigarStatement" class="space-y-6">
                <!-- Statement Header (Print friendly) -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-amber-200/80 gap-3">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl font-black text-slate-900 font-serif-luxury">BILAL DECOR STUDIO</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#0F172A] text-amber-300">KHATA PARCHI</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">Marquee Ceilings, Drapery & Stage Chadar Manufacturer</p>
                    </div>
                    <div class="text-left sm:text-right text-xs text-slate-600 font-mono">
                        <div>Tareekh: <b>${new Date().toLocaleDateString('en-GB')}</b></div>
                        <div>Karigar ID: <b>${karigar.id}</b></div>
                    </div>
                </div>

                <!-- Worker Bio Card -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Karigar Ka Naam</span>
                        <h3 class="text-base font-extrabold text-slate-900">${karigar.name}</h3>
                        <p class="text-xs text-slate-600">${karigar.craft || 'Ceiling Maker'}</p>
                    </div>
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rabta & Default Rate</span>
                        <p class="text-xs font-mono font-bold text-slate-800">Phone: ${karigar.phone || '—'}</p>
                        <p class="text-xs font-mono text-amber-900 font-bold">Standard Rate: Rs. ${karigar.defaultRate || 12} / sq ft</p>
                    </div>
                    <div class="md:text-right">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">${balanceTitle}</span>
                        <div class="text-2xl font-black ${balanceColor} font-mono">${this.formatPKR(summary.balanceDue)}</div>
                        <span class="text-[10px] text-slate-500">Kul Kaam: ${this.formatPKR(summary.totalWork)} | Adaigi: ${this.formatPKR(summary.totalPaid)}</span>
                    </div>
                </div>

                <!-- Ledger Table -->
                <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Tafseeli Roznamcha & Adaigi Record</h4>
                        <span class="text-xs text-slate-500 font-mono">${ledger.length} Entries</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                                    <th class="py-2.5 px-3">Tareekh</th>
                                    <th class="py-2.5 px-3">Qisam</th>
                                    <th class="py-2.5 px-3">Tafseel (Kaam / Adaigi)</th>
                                    <th class="py-2.5 px-3 text-right">Kaam Rakam (+)</th>
                                    <th class="py-2.5 px-3 text-right">Wasool / Adaigi (-)</th>
                                    <th class="py-2.5 px-3 text-right">Baqi Balance</th>
                                    <th class="py-2.5 px-2 text-center no-print">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ledgerRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Actions Bar (Print / Export / Add Kaam / Add Payment) -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 no-print">
                    <div class="flex items-center space-x-2">
                        <button onclick="KarigarApp.openWorkEntryModal('${karigar.id}')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
                            <span>➕ Kaam Darj Karein</span>
                        </button>
                        <button onclick="KarigarApp.openPaymentModal('${karigar.id}')" class="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
                            <span>💵 Paisa Dain</span>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="KarigarApp.printLedgerStatement()" class="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm">
                            <span>🖨 Statement Print Karein</span>
                        </button>
                        <button onclick="KarigarApp.exportLedgerExcel()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5">
                            <span>📊 Excel Export</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    printLedgerStatement() {
        const printContent = document.getElementById('printableKarigarStatement');
        if (!printContent) return;

        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Karigar Khata Statement - Bilal Decor Studio</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        .no-print { display: none !important; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body class="p-8 bg-white text-slate-800" onload="window.print(); window.close();">
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        win.document.close();
    },

    exportLedgerExcel() {
        if (!this.currentLedgerData || !window.XLSX) {
            alert("Excel library ya ledger data mojood nahi.");
            return;
        }

        const { karigar, ledger, summary } = this.currentLedgerData;
        const rows = [
            ["BILAL DECOR STUDIO - KARIGAR KHATA STATEMENT"],
            ["Karigar Naam:", karigar.name, "ID:", karigar.id],
            ["Hunar / Craft:", karigar.craft, "Phone:", karigar.phone],
            ["Default Rate:", `Rs. ${karigar.defaultRate || 12} / sq ft`],
            ["Statement Tareekh:", new Date().toLocaleDateString('en-GB')],
            [],
            ["Tareekh", "Qisam", "Tafseel", "Kaam Rakam (PKR)", "Adaigi Rakam (PKR)", "Baqi Balance (PKR)", "Notes"]
        ];

        ledger.forEach(ev => {
            rows.push([
                ev.date,
                ev.type === 'WORK' ? 'Kaam (Roznamcha)' : 'Adaigi (Payment)',
                ev.title,
                ev.credit || 0,
                ev.debit || 0,
                ev.balanceAfter || 0,
                ev.notes || ''
            ]);
        });

        rows.push([]);
        rows.push(["", "", "KUL SUMMARY", summary.totalWork, summary.totalPaid, summary.balanceDue, ""]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Karigar_Khata");
        XLSX.writeFile(wb, `BDS_Khata_${karigar.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    },

    async deleteLedgerEntry(type, id) {
        if (!confirm("Kya aap waqai is entry ko delete karna chahte hain?")) return;

        const token = this.getAdminToken();
        const endpoint = type === 'WORK' ? `/api/admin/karigar-work?id=${id}` : `/api/admin/karigar-payment?id=${id}`;

        try {
            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                alert("Entry delete ho gai.");
                if (this.currentKarigarId) {
                    this.openLedgerModal(this.currentKarigarId);
                }
                await this.loadAdminKarigars();
            } else {
                alert(data.message || "Delete nahi ho saka.");
            }
        } catch (e) {
            console.error("Error deleting entry:", e);
            alert("Server error.");
        }
    },

    // =========================================================
    // KARIGAR WORKER PORTAL (SELF-SERVICE DASHBOARD)
    // =========================================================
    async checkWorkerSession() {
        const token = this.getWorkerToken();
        if (!token) {
            this.showWorkerLoginForm();
            return;
        }

        try {
            const res = await fetch('/api/karigar/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                this.activeWorker = data;
                this.renderWorkerDashboard(data);
            } else {
                localStorage.removeItem('bds_karigar_token');
                this.showWorkerLoginForm();
            }
        } catch (e) {
            console.warn("Could not authenticate karigar session:", e);
            this.showWorkerLoginForm();
        }
    },

    showWorkerLoginForm() {
        const loginSec = document.getElementById('karigarLoginSection');
        const dashSec = document.getElementById('karigarDashboardSection');
        if (loginSec) loginSec.classList.remove('hidden');
        if (dashSec) dashSec.classList.add('hidden');
    },

    async submitWorkerLogin(event) {
        event.preventDefault();
        const username = document.getElementById('karigarLoginUsername').value.trim();
        const password = document.getElementById('karigarLoginPassword').value.trim();
        const errorEl = document.getElementById('karigarLoginError');

        if (errorEl) errorEl.classList.add('hidden');

        try {
            const res = await fetch('/api/karigar/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('bds_karigar_token', data.token);
                await this.checkWorkerSession();
            } else {
                if (errorEl) {
                    errorEl.innerText = data.message || "Ghalat username ya password.";
                    errorEl.classList.remove('hidden');
                } else {
                    alert(data.message || "Login failed.");
                }
            }
        } catch (e) {
            console.error("Login error:", e);
            alert("Server se rabta nahi ho saka.");
        }
    },

    async workerLogout() {
        const token = this.getWorkerToken();
        if (token) {
            try {
                await fetch('/api/karigar/logout', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
            } catch (e) {}
        }
        localStorage.removeItem('bds_karigar_token');
        this.activeWorker = null;
        this.showWorkerLoginForm();
    },

    renderWorkerDashboard(data) {
        const loginSec = document.getElementById('karigarLoginSection');
        const dashSec = document.getElementById('karigarDashboardSection');
        if (loginSec) loginSec.classList.add('hidden');
        if (dashSec) dashSec.classList.remove('hidden');

        const { karigar, summary, work, payments } = data;

        // Populate worker header info
        const nameEl = document.getElementById('workerDisplayName');
        const craftEl = document.getElementById('workerDisplayCraft');
        const phoneEl = document.getElementById('workerDisplayPhone');
        const rateEl = document.getElementById('workerDisplayRate');

        if (nameEl) nameEl.innerText = karigar.name;
        if (craftEl) craftEl.innerText = karigar.craft || 'Ceiling Maker';
        if (phoneEl) phoneEl.innerText = karigar.phone || '—';
        if (rateEl) rateEl.innerText = `Rs. ${karigar.defaultRate || 12} / sq ft`;

        // Populate KPI cards
        const workEl = document.getElementById('workerStatTotalWork');
        const paidEl = document.getElementById('workerStatTotalPaid');
        const balanceEl = document.getElementById('workerStatBalanceDue');
        const itemsEl = document.getElementById('workerStatTotalItems');

        if (workEl) workEl.innerText = this.formatPKR(summary.totalWorkAmount);
        if (paidEl) paidEl.innerText = this.formatPKR(summary.totalPaidAmount);
        if (balanceEl) {
            balanceEl.innerText = this.formatPKR(summary.balanceDue);
            if (summary.balanceDue > 0) {
                balanceEl.className = "text-2xl font-black text-rose-600 font-mono";
            } else {
                balanceEl.className = "text-2xl font-black text-emerald-600 font-mono";
            }
        }
        if (itemsEl) itemsEl.innerText = summary.totalItems || 0;

        // Render Work History Table (Roznamcha)
        const workTbody = document.getElementById('workerWorkTableBody');
        if (workTbody) {
            if (work.length === 0) {
                workTbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-500 font-bold text-xs">Abhi tak koi kaam darj nahi hua.</td></tr>`;
            } else {
                workTbody.innerHTML = work.map(w => {
                    const itemsSummary = (w.items || []).map(it => 
                        `<div class="text-xs">
                            <span class="font-bold text-slate-900">• ${it.title}</span> 
                            <span class="text-slate-500 font-mono">(${it.length > 0 ? `${it.length}×${it.width} ft = ${it.sqFt} sq ft @ Rs. ${it.rate}` : ''} | Qty: ${it.quantity} | Total: ${this.formatPKR(it.totalAmount)})</span>
                         </div>`
                    ).join('');

                    return `
                        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td class="py-3 px-3 text-xs font-mono text-slate-700 whitespace-nowrap font-bold">${w.date}</td>
                            <td class="py-3 px-3 space-y-1">${itemsSummary}</td>
                            <td class="py-3 px-3 text-xs font-mono font-bold text-slate-800">${(w.totalSqFt || 0).toLocaleString()} sq ft</td>
                            <td class="py-3 px-3 text-xs font-mono font-black text-emerald-700 text-right">${this.formatPKR(w.totalAmount)}</td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Render Payments History Table (Adaigi)
        const payTbody = document.getElementById('workerPaymentsTableBody');
        if (payTbody) {
            if (payments.length === 0) {
                payTbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500 font-bold text-xs">Abhi tak koi adaigi record nahi hui.</td></tr>`;
            } else {
                payTbody.innerHTML = payments.map(p => `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td class="py-3 px-3 text-xs font-mono text-slate-700 font-bold">${p.date}</td>
                        <td class="py-3 px-3 text-xs font-mono font-black text-rose-700">${this.formatPKR(p.amount)}</td>
                        <td class="py-3 px-3 text-xs">
                            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900">${p.paymentMethod || 'Cash'}</span>
                        </td>
                        <td class="py-3 px-3 text-xs text-slate-600">${p.notes || '—'}</td>
                    </tr>
                `).join('');
            }
        }
    },

    switchWorkerTab(tabName) {
        document.querySelectorAll('.worker-tab-content').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`workerTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        if (target) target.classList.remove('hidden');

        const btnWork = document.getElementById('workerTabBtnWork');
        const btnPay = document.getElementById('workerTabBtnPayments');

        if (tabName === 'work') {
            if (btnWork) btnWork.className = "px-5 py-3 rounded-t-xl text-xs md:text-sm font-extrabold bg-[#0F172A] text-amber-300";
            if (btnPay) btnPay.className = "px-5 py-3 rounded-t-xl text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border-t border-x border-slate-200";
        } else {
            if (btnPay) btnPay.className = "px-5 py-3 rounded-t-xl text-xs md:text-sm font-extrabold bg-[#0F172A] text-amber-300";
            if (btnWork) btnWork.className = "px-5 py-3 rounded-t-xl text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border-t border-x border-slate-200";
        }
    },

    openWorkerPasswordModal() {
        document.getElementById('workerOldPassword').value = '';
        document.getElementById('workerNewPassword').value = '';
        const modal = document.getElementById('workerPasswordModal');
        if (modal) modal.classList.remove('hidden');
    },

    closeWorkerPasswordModal() {
        const modal = document.getElementById('workerPasswordModal');
        if (modal) modal.classList.add('hidden');
    },

    async submitWorkerPasswordChange(event) {
        event.preventDefault();
        const oldPassword = document.getElementById('workerOldPassword').value.trim();
        const newPassword = document.getElementById('workerNewPassword').value.trim();

        if (newPassword.length < 4) {
            alert("Naya password kam az kam 4 characters ka hona chahiye.");
            return;
        }

        const token = this.getWorkerToken();
        try {
            const res = await fetch('/api/karigar/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message || "Password kamyabi se tabdeel ho gaya.");
                this.closeWorkerPasswordModal();
            } else {
                alert(data.message || "Purana password ghalat hai.");
            }
        } catch (e) {
            console.error("Error changing worker password:", e);
            alert("Server error.");
        }
    },

    printWorkerStatement() {
        if (!this.activeWorker) return;
        const { karigar, summary, work, payments } = this.activeWorker;

        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${karigar.name} - Roznamcha Khata Statement</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body class="p-8 bg-white text-slate-800" onload="window.print(); window.close();">
                <div class="border-b border-amber-300 pb-4 mb-6">
                    <h1 class="text-2xl font-black text-slate-900 font-serif-luxury">BILAL DECOR STUDIO</h1>
                    <p class="text-xs text-slate-500">Karigar Ka Roznamcha & Khata Record</p>
                    <div class="mt-4 flex justify-between text-xs font-mono">
                        <div>Karigar: <b>${karigar.name}</b> (${karigar.craft || 'Ceiling Maker'})</div>
                        <div>Tareekh: <b>${new Date().toLocaleDateString('en-GB')}</b></div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4 p-4 bg-amber-50 rounded-xl mb-6 text-xs font-mono">
                    <div>Kul Kaam: <b>${this.formatPKR(summary.totalWorkAmount)}</b></div>
                    <div>Kul Wasool: <b>${this.formatPKR(summary.totalPaidAmount)}</b></div>
                    <div>Baqi Lena: <b class="text-rose-600">${this.formatPKR(summary.balanceDue)}</b></div>
                </div>

                <h3 class="font-bold text-sm text-slate-900 mb-2">Kaam Ka Record (Roznamcha)</h3>
                <table class="w-full text-left border-collapse text-xs mb-6">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-300">
                            <th class="p-2">Tareekh</th>
                            <th class="p-2">Items</th>
                            <th class="p-2">Total SqFt</th>
                            <th class="p-2 text-right">Rakam (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${work.map(w => `
                            <tr class="border-b border-slate-200">
                                <td class="p-2 font-mono">${w.date}</td>
                                <td class="p-2">${(w.items || []).map(i => `${i.title} (${i.length > 0 ? `${i.length}x${i.width}ft` : ''} Qty: ${i.quantity})`).join(', ')}</td>
                                <td class="p-2 font-mono">${w.totalSqFt}</td>
                                <td class="p-2 font-mono text-right font-bold">${this.formatPKR(w.totalAmount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h3 class="font-bold text-sm text-slate-900 mb-2">Adaigi / Wasooli Record</h3>
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-300">
                            <th class="p-2">Tareekh</th>
                            <th class="p-2">Rakam</th>
                            <th class="p-2">Tareeqa</th>
                            <th class="p-2">Tafseel</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(p => `
                            <tr class="border-b border-slate-200">
                                <td class="p-2 font-mono">${p.date}</td>
                                <td class="p-2 font-mono font-bold text-rose-700">${this.formatPKR(p.amount)}</td>
                                <td class="p-2">${p.paymentMethod}</td>
                                <td class="p-2 text-slate-600">${p.notes || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        win.document.close();
    }
};

window.KarigarApp = KarigarApp;
