/**
 * Bilal Decor Studio - Customer Database & Excel / ML Export Engine
 * Automatically saves all customer leads and orders.
 * Supports downloading native Excel (.XLSX), ML Dataset (.CSV), and JSON backup.
 */

const CustomerDB = {
    customers: [],

    async init() {
        await this.loadCustomers();
        this.renderAdminCustomerTable();
        this.renderDatabaseStats();
        console.log("CustomerDB Engine Initialized.");
    },

    /**
     * Load customers from Server API or LocalStorage
     */
    async loadCustomers() {
        try {
            const token = window.Admin ? Admin.getToken() : null;
            const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const res = await fetch('/api/customers', { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    this.customers = data;
                    Store.set('bds_customers_cache', data);
                    return;
                }
            }
        } catch (e) {
            console.warn("Server API not reachable or unauthorized, loading from cache/store");
        }

        // Fallback to cached or seeded store data
        this.customers = Store.get('bds_customers_cache', this.getSeededCustomers());
    },

    getSeededCustomers() {
        return [
            {
                customerId: "CUST-1001",
                date: "2024-11-14",
                customerName: "Chaudhry Nadeem",
                phone: "0301-4433482",
                city: "Gujranwala",
                marqueeName: "Crown Marquee",
                designTitle: "Royal Mughal Gold Stage Chadar",
                category: "Stage",
                length_ft: 50,
                width_ft: 30,
                total_sqft: 1500,
                rate_sqft: 65,
                quantity: 1,
                totalAmount_PKR: 97500,
                advancePaid_PKR: 97500,
                balanceDue_PKR: 0,
                paymentStatus: "Paid",
                orderStatus: "Delivered"
            },
            {
                customerId: "CUST-1002",
                date: "2024-11-08",
                customerName: "Malik Usman",
                phone: "0321-8899910",
                city: "Lahore",
                marqueeName: "Grand Palace Banquet",
                designTitle: "Emerald & Champagne Hall Ceiling",
                category: "Hall",
                length_ft: 100,
                width_ft: 50,
                total_sqft: 5000,
                rate_sqft: 55,
                quantity: 1,
                totalAmount_PKR: 275000,
                advancePaid_PKR: 275000,
                balanceDue_PKR: 0,
                paymentStatus: "Paid",
                orderStatus: "Delivered"
            },
            {
                customerId: "CUST-1003",
                date: "2024-11-02",
                customerName: "Rana Rizwan",
                phone: "0300-7711553",
                city: "Faisalabad",
                marqueeName: "Shehnai Events",
                designTitle: "Crown Entrance Rahdari Canopy",
                category: "Entrance",
                length_ft: 120,
                width_ft: 15,
                total_sqft: 1800,
                rate_sqft: 70,
                quantity: 1,
                totalAmount_PKR: 126000,
                advancePaid_PKR: 126000,
                balanceDue_PKR: 0,
                paymentStatus: "Paid",
                orderStatus: "Delivered"
            },
            {
                customerId: "CUST-1004",
                date: "2024-10-28",
                customerName: "Haji Mushtaq Ahmed",
                phone: "0333-5566112",
                city: "Rawalpindi",
                marqueeName: "Pearl Continental Marquee",
                designTitle: "Ruby Crimson Bridal Stage Backdrop",
                category: "Stage",
                length_ft: 40,
                width_ft: 25,
                total_sqft: 1000,
                rate_sqft: 75,
                quantity: 1,
                totalAmount_PKR: 75000,
                advancePaid_PKR: 75000,
                balanceDue_PKR: 0,
                paymentStatus: "Paid",
                orderStatus: "Delivered"
            },
            {
                customerId: "CUST-1005",
                date: "2024-10-20",
                customerName: "Sardar Farooq Khan",
                phone: "0302-9988784",
                city: "Multan",
                marqueeName: "Regal Event Complex",
                designTitle: "Starry Night Central Canopy",
                category: "Hall",
                length_ft: 60,
                width_ft: 60,
                total_sqft: 3600,
                rate_sqft: 80,
                quantity: 1,
                totalAmount_PKR: 288000,
                advancePaid_PKR: 288000,
                balanceDue_PKR: 0,
                paymentStatus: "Paid",
                orderStatus: "Delivered"
            },
            {
                customerId: "CUST-1006",
                date: "2024-10-15",
                customerName: "Babar Decorators",
                phone: "0345-3344639",
                city: "Sialkot",
                marqueeName: "Dream Wedding Hall",
                designTitle: "Royal Ivory Floral Ceiling",
                category: "Hall",
                length_ft: 70,
                width_ft: 35,
                total_sqft: 2450,
                rate_sqft: 60,
                quantity: 1,
                totalAmount_PKR: 147000,
                advancePaid_PKR: 147000,
                balanceDue_PKR: 0,
                paymentStatus: "Paid",
                orderStatus: "Delivered"
            },
            {
                customerId: "CUST-1007",
                date: "2024-10-05",
                customerName: "Mian Zahid",
                phone: "0306-2211891",
                city: "Sargodha",
                marqueeName: "Al-Jannat Marquee",
                designTitle: "Grand Corridor Pleated Runner",
                category: "Entrance",
                length_ft: 80,
                width_ft: 12,
                total_sqft: 960,
                rate_sqft: 65,
                quantity: 1,
                totalAmount_PKR: 62400,
                advancePaid_PKR: 62400,
                balanceDue_PKR: 0,
                paymentStatus: "Paid",
                orderStatus: "Delivered"
            },
            {
                customerId: "CUST-1008",
                date: "2024-11-17",
                customerName: "Mian Tariq",
                phone: "0300-1238921",
                city: "Lahore",
                marqueeName: "The Royal Palm Marquee",
                designTitle: "Royal Mughal Gold Velvet Stage Chadar",
                category: "Stage",
                length_ft: 45,
                width_ft: 25,
                total_sqft: 1125,
                rate_sqft: 65,
                quantity: 1,
                totalAmount_PKR: 73125,
                advancePaid_PKR: 30000,
                balanceDue_PKR: 43125,
                paymentStatus: "Advance Paid",
                orderStatus: "In Stitching"
            },
            {
                customerId: "CUST-1009",
                date: "2024-11-17",
                customerName: "Hammad Raza",
                phone: "0312-9873310",
                city: "Gujranwala",
                marqueeName: "Al-Raza Marquee",
                designTitle: "Crown Royal Entrance Rahdari Canopy",
                category: "Entrance",
                length_ft: 90,
                width_ft: 15,
                total_sqft: 1350,
                rate_sqft: 70,
                quantity: 1,
                totalAmount_PKR: 94500,
                advancePaid_PKR: 50000,
                balanceDue_PKR: 44500,
                paymentStatus: "Advance Paid",
                orderStatus: "Fabric Cutting"
            },
            {
                customerId: "CUST-1010",
                date: "2024-11-18",
                customerName: "Sheikh Zeeshan",
                phone: "0322-6655542",
                city: "Faisalabad",
                marqueeName: "Koh-i-Noor Banquet",
                designTitle: "Emerald Green & Champagne Pleated Hall",
                category: "Hall",
                length_ft: 80,
                width_ft: 40,
                total_sqft: 3200,
                rate_sqft: 55,
                quantity: 1,
                totalAmount_PKR: 176000,
                advancePaid_PKR: 80000,
                balanceDue_PKR: 96000,
                paymentStatus: "Advance Verified",
                orderStatus: "Processing"
            },
            {
                customerId: "CUST-1011",
                date: "2024-11-16",
                customerName: "Zubair Ahmed",
                phone: "0304-4431298",
                city: "Sargodha",
                marqueeName: "Gulshan Marquee",
                designTitle: "Ruby Crimson Bridal Velvet Backdrop",
                category: "Stage",
                length_ft: 35,
                width_ft: 20,
                total_sqft: 700,
                rate_sqft: 75,
                quantity: 1,
                totalAmount_PKR: 52500,
                advancePaid_PKR: 52500,
                balanceDue_PKR: 0,
                paymentStatus: "Paid Full",
                orderStatus: "Dispatched"
            }
        ];
    },

    /**
     * Add a new customer record from an order or lead
     * @param {Object} record
     */
    async addRecord(record) {
        record.customerId = record.customerId || ("CUST-" + Math.floor(1000 + Math.random() * 9000));
        record.date = record.date || new Date().toISOString().slice(0, 10);

        this.customers.unshift(record);
        Store.set('bds_customers_cache', this.customers);

        // Try pushing to backend server
        try {
            await fetch('/api/save-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
        } catch (e) {
            console.log("Recorded locally in database cache");
        }

        this.renderAdminCustomerTable();
        this.renderDatabaseStats();
    },

    /**
     * Render the Customer Database Table in Admin Portal
     */
    renderAdminCustomerTable(filterQuery = "") {
        const tbody = document.getElementById('adminCustomerTableBody');
        if (!tbody) return;

        let list = this.customers;
        if (filterQuery) {
            const q = filterQuery.toLowerCase();
            list = list.filter(c => 
                (c.customerName && c.customerName.toLowerCase().includes(q)) ||
                (c.phone && c.phone.includes(q)) ||
                (c.city && c.city.toLowerCase().includes(q)) ||
                (c.marqueeName && c.marqueeName.toLowerCase().includes(q))
            );
        }

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-8 text-center text-slate-500 font-medium">
                        Koi customer record nahi mila.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map((c, idx) => `
            <tr class="border-b border-slate-200 hover:bg-amber-50/50 transition text-xs">
                <td class="py-3 px-3">
                    <span class="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">${c.customerId}</span>
                    <div class="text-[10px] text-slate-400 mt-0.5">${c.date}</div>
                </td>
                <td class="py-3 px-3">
                    <p class="font-bold text-slate-900 text-sm">${c.customerName}</p>
                    <p class="text-xs text-amber-800 font-mono font-bold">📞 ${c.phone}</p>
                </td>
                <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        📍 ${c.city}
                    </span>
                    <p class="text-[11px] text-slate-500 mt-1">${c.marqueeName || '-'}</p>
                </td>
                <td class="py-3 px-3 max-w-xs truncate text-xs text-slate-700">
                    <p class="font-bold text-slate-900 truncate">${c.designTitle || '-'}</p>
                    <p class="text-[11px] text-slate-500">${c.length_ft}x${c.width_ft} ft (${c.total_sqft} sq ft) @ Rs. ${c.rate_sqft}</p>
                </td>
                <td class="py-3 px-3 font-mono font-bold text-slate-900">
                    ${Calculator.formatPKR(c.totalAmount_PKR)}
                    <div class="text-[10px] text-slate-500 font-normal">Advance: ${Calculator.formatPKR(c.advancePaid_PKR || 0)}</div>
                </td>
                <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded text-[11px] font-bold ${c.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${c.orderStatus || 'Active'}
                    </span>
                </td>
                <td class="py-3 px-3 text-right">
                    <button onclick="CustomerDB.exportSingleCustomer('${c.customerId}')" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300" title="Is Customer ka Record Dekhein">
                        📋 Detail
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderDatabaseStats() {
        const totalCust = this.customers.length;
        const totalSqFt = this.customers.reduce((sum, c) => sum + (c.total_sqft || 0), 0);
        const totalRev = this.customers.reduce((sum, c) => sum + (c.totalAmount_PKR || 0), 0);
        
        // Unique cities count
        const cities = new Set(this.customers.map(c => c.city).filter(Boolean));

        const elCust = document.getElementById('dbStatTotalCustomers');
        const elSqFt = document.getElementById('dbStatTotalSqFt');
        const elRev = document.getElementById('dbStatTotalRevenue');
        const elCities = document.getElementById('dbStatTotalCities');

        if (elCust) elCust.innerText = totalCust;
        if (elSqFt) elSqFt.innerText = totalSqFt.toLocaleString() + " sq ft";
        if (elRev) elRev.innerText = Calculator.formatPKR(totalRev);
        if (elCities) elCities.innerText = cities.size + " Shehar";
    },

    /**
     * Download Excel File (.XLSX) using SheetJS
     */
    downloadExcel() {
        if (this.customers.length === 0) {
            alert("Database me koi record nahi hai.");
            return;
        }

        // Format data specifically for clean Excel columns
        const excelRows = this.customers.map((c, index) => ({
            "S.No": index + 1,
            "Customer ID": c.customerId,
            "Date": c.date,
            "Customer Name": c.customerName,
            "Phone Number": c.phone,
            "City": c.city,
            "Marquee / Hall Name": c.marqueeName || "-",
            "Fabric Design Title": c.designTitle || "-",
            "Category": c.category || "Marquee Ceiling",
            "Length (Feet)": c.length_ft || 0,
            "Width (Feet)": c.width_ft || 0,
            "Total Area (Sq Ft)": c.total_sqft || 0,
            "Rate per Sq Ft (PKR)": c.rate_sqft || 0,
            "Quantity (Sets)": c.quantity || 1,
            "Total Amount (PKR)": c.totalAmount_PKR || 0,
            "Advance Paid (PKR)": c.advancePaid_PKR || 0,
            "Remaining Balance (PKR)": c.balanceDue_PKR || 0,
            "Payment Status": c.paymentStatus || "-",
            "Order Status": c.orderStatus || "-"
        }));

        if (window.XLSX) {
            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Customers_Database");

            // Auto-fit column widths
            const colWidths = [
                { wch: 6 },  // S.No
                { wch: 14 }, // Customer ID
                { wch: 14 }, // Date
                { wch: 22 }, // Customer Name
                { wch: 16 }, // Phone
                { wch: 14 }, // City
                { wch: 26 }, // Marquee
                { wch: 35 }, // Design
                { wch: 15 }, // Category
                { wch: 14 }, // Length
                { wch: 14 }, // Width
                { wch: 18 }, // Sq Ft
                { wch: 18 }, // Rate
                { wch: 14 }, // Qty
                { wch: 18 }, // Total
                { wch: 18 }, // Advance
                { wch: 20 }, // Balance
                { wch: 16 }, // Payment
                { wch: 16 }  // Order Status
            ];
            worksheet['!cols'] = colWidths;

            XLSX.writeFile(workbook, "Bilal_Decor_Studio_Customers.xlsx");
        } else {
            // Fallback to CSV
            this.downloadCSV();
        }
    },

    /**
     * Download CSV File (ML Dataset format)
     */
    downloadCSV() {
        if (this.customers.length === 0) return;

        const headers = [
            "Customer_ID", "Date", "Customer_Name", "Phone", "City",
            "Marquee_Name", "Design_Title", "Category", "Length_ft", "Width_ft",
            "Total_SqFt", "Rate_Per_SqFt", "Quantity", "Total_Amount_PKR",
            "Advance_Paid_PKR", "Balance_Due_PKR", "Payment_Status", "Order_Status"
        ];

        const clean = (val) => `"${String(val || '').replace(/"/g, '""').trim()}"`;

        const rows = this.customers.map(c => [
            clean(c.customerId),
            clean(c.date),
            clean(c.customerName),
            clean(c.phone),
            clean(c.city),
            clean(c.marqueeName),
            clean(c.designTitle),
            clean(c.category),
            c.length_ft || 0,
            c.width_ft || 0,
            c.total_sqft || 0,
            c.rate_sqft || 0,
            c.quantity || 1,
            c.totalAmount_PKR || 0,
            c.advancePaid_PKR || 0,
            c.balanceDue_PKR || 0,
            clean(c.paymentStatus),
            clean(c.orderStatus)
        ].join(','));

        const csvContent = "\uFEFF" + headers.join(',') + "\n" + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Bilal_Decor_Customers_ML_Dataset.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    /**
     * Download JSON Backup
     */
    downloadJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.customers, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = "Bilal_Decor_Database_Backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    exportSingleCustomer(customerId) {
        const cust = this.customers.find(c => c.customerId === customerId);
        if (!cust) return;

        alert(`Customer Profile:\n\nNaam: ${cust.customerName}\nPhone: ${cust.phone}\nCity: ${cust.city}\nMarquee: ${cust.marqueeName || '-'}\nTotal Orders: ${Calculator.formatPKR(cust.totalAmount_PKR)}`);
    }
};

window.CustomerDB = CustomerDB;

document.addEventListener('DOMContentLoaded', () => {
    CustomerDB.init();
});
