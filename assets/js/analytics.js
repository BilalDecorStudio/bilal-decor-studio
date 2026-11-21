/**
 * Bilal Decor Studio - Advanced Business Analytics & Sales Intelligence Engine
 * Features:
 * - Dynamic Duration Filters: 1 Mahina (Weeks), 3 Mahine, 6 Mahine, 12 Mahine, Lifetime
 * - Month-over-Month Sales Comparison Widget (Is Mahine vs Pichla Mahina)
 * - Metric Toggles: Combo (Sales + Fabric), Only Sales (Revenue), Only Fabric (Sq Ft)
 * - Seasonality & Cash Flow Recovery Insights
 * - Detailed Monthly Performance Table
 */

const Analytics = {
    charts: {},
    currentDuration: '6m', // '1m' | '3m' | '6m' | '12m' | 'lifetime'
    currentMetric: 'combo', // 'combo' | 'revenue' | 'fabric'

    // Master historical baseline data (12 months + lifetime yearly)
    fullHistory: [
        { month: "Dec 2023", revenue: 1350000, sqft: 21000, orders: 10, advance: 920000, growth: "+22%" },
        { month: "Jan 2024", revenue: 1520000, sqft: 23500, orders: 11, advance: 1050000, growth: "+13%" },
        { month: "Feb 2024", revenue: 1410000, sqft: 22000, orders: 10, advance: 980000, growth: "-7%" },
        { month: "Mar 2024", revenue: 850000, sqft: 13000, orders: 6, advance: 600000, growth: "-40%" },
        { month: "Apr 2024", revenue: 620000, sqft: 9500, orders: 5, advance: 420000, growth: "-27%" },
        { month: "May 2024", revenue: 540000, sqft: 8200, orders: 4, advance: 370000, growth: "-13%" },
        { month: "Jun 2024", revenue: 480000, sqft: 7500, orders: 4, advance: 330000, growth: "-11%" },
        { month: "Jul 2024", revenue: 620000, sqft: 9800, orders: 5, advance: 430000, growth: "+29%" },
        { month: "Aug 2024", revenue: 750000, sqft: 11400, orders: 6, advance: 510000, growth: "+21%" },
        { month: "Sep 2024", revenue: 980000, sqft: 15200, orders: 8, advance: 680000, growth: "+31%" },
        { month: "Oct 2024", revenue: 1240000, sqft: 19800, orders: 9, advance: 860000, growth: "+26%" },
        { month: "Nov 2024", revenue: 1467025, sqft: 22685, orders: 11, advance: 1020000, growth: "+18.3%" }
    ],

    // Weekly breakdown for current month (Nov 2024)
    currentMonthWeeks: [
        { label: "Hafta 1 (1-7 Nov)", revenue: 310000, sqft: 4800, orders: 2 },
        { label: "Hafta 2 (8-14 Nov)", revenue: 385000, sqft: 5900, orders: 3 },
        { label: "Hafta 3 (15-21 Nov)", revenue: 440000, sqft: 6800, orders: 3 },
        { label: "Hafta 4 (22-30 Nov)", revenue: 332025, sqft: 5185, orders: 3 }
    ],

    // Lifetime multi-year data
    lifetimeHistory: [
        { label: "2022 (Pura Saal)", revenue: 8400000, sqft: 130000, orders: 62, growth: "Base Year" },
        { label: "2023 (Pura Saal)", revenue: 11200000, sqft: 175000, orders: 84, growth: "+33.3%" },
        { label: "2024 (To Date)", revenue: 11847025, sqft: 184585, orders: 89, growth: "+18.5%" }
    ],

    init() {
        if (window.Chart) {
            Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
            Chart.defaults.color = "#64748B";
        }
    },

    /**
     * Switch duration filter (1m, 3m, 6m, 12m, lifetime)
     */
    setDuration(duration) {
        this.currentDuration = duration;
        this.updateFilterButtons();
        this.render();
    },

    /**
     * Switch chart metric (combo, revenue, fabric)
     */
    setMetric(metric) {
        this.currentMetric = metric;
        this.updateMetricButtons();
        this.renderMonthlySalesChart();
    },

    updateFilterButtons() {
        document.querySelectorAll('.analytics-duration-btn').forEach(btn => {
            const dur = btn.dataset.duration;
            if (dur === this.currentDuration) {
                btn.className = "analytics-duration-btn px-4 py-2 rounded-xl text-xs font-black bg-[#0F172A] text-amber-300 shadow-sm border border-[#0F172A] transition";
            } else {
                btn.className = "analytics-duration-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition";
            }
        });
    },

    updateMetricButtons() {
        document.querySelectorAll('.analytics-metric-btn').forEach(btn => {
            const m = btn.dataset.metric;
            if (m === this.currentMetric) {
                btn.className = "analytics-metric-btn px-3 py-1.5 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs";
            } else {
                btn.className = "analytics-metric-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200";
            }
        });
    },

    /**
     * Get slice of data matching active duration filter
     */
    getActiveDataset() {
        let history = [...this.fullHistory];

        // Incorporate any extra customer orders dynamically into latest month
        const liveOrders = (window.CustomerDB && CustomerDB.customers) ? CustomerDB.customers : [];
        if (liveOrders.length > 0) {
            const liveTotal = liveOrders.reduce((sum, c) => sum + (c.totalAmount_PKR || 0), 0);
            const liveSqFt = liveOrders.reduce((sum, c) => sum + (c.total_sqft || 0), 0);
            if (liveTotal > 0 && liveTotal > history[history.length - 1].revenue) {
                history[history.length - 1].revenue = liveTotal;
                history[history.length - 1].sqft = liveSqFt;
            }
        }

        switch (this.currentDuration) {
            case '1m':
                return {
                    type: 'weekly',
                    data: this.currentMonthWeeks,
                    labels: this.currentMonthWeeks.map(w => w.label),
                    revenues: this.currentMonthWeeks.map(w => w.revenue),
                    sqfts: this.currentMonthWeeks.map(w => w.sqft),
                    title: "Is Mahine ki Weekly Sales (Nov 2024)",
                    subtitle: "Hafta-ba-hafta sales volume aur fabric production"
                };
            case '3m': {
                const slice3 = history.slice(-3);
                return {
                    type: 'monthly',
                    data: slice3,
                    labels: slice3.map(m => m.month),
                    revenues: slice3.map(m => m.revenue),
                    sqfts: slice3.map(m => m.sqft),
                    title: "Pichlay 3 Mahine ki Sales (Quarterly Trend)",
                    subtitle: "Sep 2024 se Nov 2024 tak ka shandar wedding season turnover"
                };
            }
            case '6m': {
                const slice6 = history.slice(-6);
                return {
                    type: 'monthly',
                    data: slice6,
                    labels: slice6.map(m => m.month),
                    revenues: slice6.map(m => m.revenue),
                    sqfts: slice6.map(m => m.sqft),
                    title: "Pichlay 6 Mahine ki Sales (Half-Yearly Trend)",
                    subtitle: "Jun 2024 se Nov 2024 tak ka sales aur fabric graph"
                };
            }
            case '12m':
                return {
                    type: 'monthly',
                    data: history,
                    labels: history.map(m => m.month),
                    revenues: history.map(m => m.revenue),
                    sqfts: history.map(m => m.sqft),
                    title: "Pichlay 12 Mahine ki Sales (Annual / Full Year)",
                    subtitle: "Dec 2023 se Nov 2024 tak ka poora saalana business report"
                };
            case 'lifetime':
                return {
                    type: 'yearly',
                    data: this.lifetimeHistory,
                    labels: this.lifetimeHistory.map(y => y.label),
                    revenues: this.lifetimeHistory.map(y => y.revenue),
                    sqfts: this.lifetimeHistory.map(y => y.sqft),
                    title: "Lifetime Business Growth (All-Time Record)",
                    subtitle: "2022 se le kar 2024 tak ka kul business turnover aur record"
                };
            default:
                return this.getActiveDataset();
        }
    },

    render() {
        if (!window.Chart) {
            console.warn("Chart.js not loaded");
            return;
        }

        this.updateFilterButtons();
        this.updateMetricButtons();
        this.renderKPIs();
        this.renderMonthComparison();
        this.renderMonthlySalesChart();
        this.renderCityDistributionChart();
        this.renderCategoryChart();
        this.renderBreakdownTable();
    },

    /**
     * Render Month-over-Month Comparison Widget:
     * Specially built to show "Last month itni sale thi, is month itni sale hai"
     */
    renderMonthComparison() {
        const container = document.getElementById('analyticsMonthComparisonBox');
        if (!container) return;

        const current = this.fullHistory[this.fullHistory.length - 1]; // Nov 2024
        const last = this.fullHistory[this.fullHistory.length - 2];    // Oct 2024

        const revDiff = current.revenue - last.revenue;
        const pctDiff = ((revDiff / last.revenue) * 100).toFixed(1);
        const sqftDiff = current.sqft - last.sqft;
        const isGrowth = revDiff >= 0;

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                <!-- Current Month Card -->
                <div class="md:col-span-5 bg-white p-5 rounded-2xl border-2 border-emerald-500/40 shadow-xs relative overflow-hidden">
                    <div class="flex items-center justify-between mb-2">
                        <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                            <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span>Is Mahine ki Sale (${current.month})</span>
                        </span>
                        <span class="text-[11px] font-bold text-slate-500">${current.orders} Marquee Orders</span>
                    </div>
                    <p class="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                        ${Calculator.formatPKR(current.revenue)}
                    </p>
                    <div class="flex items-center space-x-3 mt-2 text-xs text-slate-600">
                        <span>📐 Fabric: <strong class="text-slate-900">${current.sqft.toLocaleString()} sq ft</strong></span>
                        <span>•</span>
                        <span>💵 Advance: <strong class="text-emerald-700">${Calculator.formatPKR(current.advance)}</strong></span>
                    </div>
                </div>

                <!-- Comparison Badge / Center Diff -->
                <div class="md:col-span-2 text-center py-2">
                    <div class="inline-flex flex-col items-center justify-center p-3 rounded-2xl ${isGrowth ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}">
                        <span class="text-lg font-black ${isGrowth ? 'text-emerald-700' : 'text-rose-700'}">
                            ${isGrowth ? '↑' : '↓'} ${Math.abs(pctDiff)}%
                        </span>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-0.5">
                            ${isGrowth ? 'Izafa (Growth)' : 'Kami'}
                        </span>
                        <span class="text-[11px] font-bold ${isGrowth ? 'text-emerald-800' : 'text-rose-800'} mt-1 font-mono">
                            ${isGrowth ? '+' : ''}${Calculator.formatPKR(revDiff)}
                        </span>
                    </div>
                </div>

                <!-- Last Month Card -->
                <div class="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div class="flex items-center justify-between mb-2">
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            <span>Pichlay Mahine ki Sale (${last.month})</span>
                        </span>
                        <span class="text-[11px] font-bold text-slate-500">${last.orders} Marquee Orders</span>
                    </div>
                    <p class="text-2xl sm:text-3xl font-black text-slate-700 font-mono tracking-tight">
                        ${Calculator.formatPKR(last.revenue)}
                    </p>
                    <div class="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                        <span>📐 Fabric: <strong class="text-slate-800">${last.sqft.toLocaleString()} sq ft</strong></span>
                        <span>•</span>
                        <span>💵 Advance: <strong class="text-slate-700">${Calculator.formatPKR(last.advance)}</strong></span>
                    </div>
                </div>

            </div>

            <!-- Context Bar -->
            <div class="mt-4 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
                <p>
                    🔥 <strong>Business Summary:</strong> Pichlay mahine ki nisbat is mahine sales me <strong class="text-emerald-700 font-bold">${Calculator.formatPKR(revDiff)}</strong> (${pctDiff}%) aur fabric production me <strong class="text-emerald-700 font-bold">+${sqftDiff.toLocaleString()} sq ft</strong> ka behtareen izafa hua hai.
                </p>
                <span class="text-[11px] px-2.5 py-1 rounded-md bg-amber-100/80 text-amber-900 font-bold w-max shrink-0">
                    👑 Peak Shadi Season Active
                </span>
            </div>
        `;
    },

    renderKPIs() {
        const dataset = this.getActiveDataset();
        const totalRevenue = dataset.revenues.reduce((s, r) => s + r, 0);
        const totalSqFt = dataset.sqfts.reduce((s, r) => s + r, 0);

        let totalOrders = 0;
        if (dataset.data) {
            totalOrders = dataset.data.reduce((s, d) => s + (d.orders || 1), 0);
        }
        const avgOrderVal = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 133365;

        // Current recovery rate (around 70%)
        const collectionRate = 72;

        const elRev = document.getElementById('analyticsKpiRevenue');
        const elAov = document.getElementById('analyticsKpiAOV');
        const elSqFt = document.getElementById('analyticsKpiSqFt');
        const elCollection = document.getElementById('analyticsKpiCollection');

        if (elRev) elRev.innerText = Calculator.formatPKR(totalRevenue);
        if (elAov) elAov.innerText = Calculator.formatPKR(avgOrderVal);
        if (elSqFt) elSqFt.innerText = totalSqFt.toLocaleString() + " sq ft";
        if (elCollection) elCollection.innerText = collectionRate + "%";
    },

    /**
     * Main Sales & Production Chart with Dynamic Filter Support
     */
    renderMonthlySalesChart() {
        const ctx = document.getElementById('monthlySalesChart');
        if (!ctx) return;

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const dataset = this.getActiveDataset();

        // Update chart title & subtitle in DOM
        const titleEl = document.getElementById('mainChartTitle');
        const subTitleEl = document.getElementById('mainChartSubtitle');
        if (titleEl) titleEl.innerText = dataset.title;
        if (subTitleEl) subTitleEl.innerText = dataset.subtitle;

        // Build datasets based on metric toggle (combo | revenue | fabric)
        const chartDatasets = [];

        if (this.currentMetric === 'combo' || this.currentMetric === 'fabric') {
            chartDatasets.push({
                type: 'line',
                label: 'Fabric Production (Sq Ft)',
                data: dataset.sqfts,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                borderWidth: 3,
                pointBackgroundColor: '#065F46',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: this.currentMetric === 'fabric',
                yAxisID: this.currentMetric === 'fabric' ? 'y' : 'y1'
            });
        }

        if (this.currentMetric === 'combo' || this.currentMetric === 'revenue') {
            chartDatasets.push({
                type: 'bar',
                label: 'Sales Revenue (PKR)',
                data: dataset.revenues,
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx: cCtx, chartArea } = chart;
                    if (!chartArea) return '#C59A3F';
                    const gradient = cCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, '#8E6B1E');
                    gradient.addColorStop(0.5, '#C59A3F');
                    gradient.addColorStop(1, '#F3E5A5');
                    return gradient;
                },
                borderRadius: 8,
                borderSkipped: false,
                yAxisID: 'y'
            });
        }

        const scalesConfig = {
            x: {
                grid: { display: false },
                ticks: { font: { weight: 'bold', size: 11 } }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: '#F1ECE1' },
                ticks: {
                    callback: function(value) {
                        if (value >= 10000000) return 'Rs. ' + (value / 10000000).toFixed(1) + ' Crore';
                        if (value >= 100000) return 'Rs. ' + (value / 100000).toFixed(1) + ' Lakh';
                        return 'Rs. ' + value.toLocaleString();
                    }
                }
            }
        };

        if (this.currentMetric === 'combo') {
            scalesConfig.y1 = {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: {
                    callback: function(value) {
                        return value.toLocaleString() + ' sq ft';
                    }
                }
            };
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dataset.labels,
                datasets: chartDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { weight: 'bold', size: 12 },
                            usePointStyle: true,
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0F172A',
                        titleColor: '#FBBF24',
                        bodyColor: '#FFFFFF',
                        padding: 14,
                        cornerRadius: 12,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('PKR')) {
                                    return ' 💰 Sales: ' + Calculator.formatPKR(context.parsed.y);
                                } else {
                                    return ' 📐 Fabric: ' + context.parsed.y.toLocaleString() + ' sq ft';
                                }
                            }
                        }
                    }
                },
                scales: scalesConfig
            }
        });
    },

    /**
     * Render Detailed Monthly Performance Table
     */
    renderBreakdownTable() {
        const tbody = document.getElementById('analyticsBreakdownTableBody');
        if (!tbody) return;

        const dataset = this.getActiveDataset();
        const rows = dataset.data || [];

        tbody.innerHTML = rows.map((r, idx) => {
            const growthClass = (r.growth && r.growth.includes('+')) ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100';
            const label = r.month || r.label || `Period ${idx + 1}`;
            const orders = r.orders || '-';
            const avgRate = (r.revenue && r.sqft) ? Math.round(r.revenue / r.sqft) : 65;

            return `
                <tr class="border-b border-slate-100 hover:bg-amber-50/40 transition text-xs">
                    <td class="py-3 px-3 font-bold text-slate-900">${label}</td>
                    <td class="py-3 px-3 font-mono font-bold text-amber-900">${Calculator.formatPKR(r.revenue)}</td>
                    <td class="py-3 px-3 font-mono text-slate-700">${r.sqft.toLocaleString()} sq ft</td>
                    <td class="py-3 px-3 font-bold text-center text-slate-800">${orders}</td>
                    <td class="py-3 px-3 text-slate-600">Rs. ${avgRate} / sq ft</td>
                    <td class="py-3 px-3 text-right">
                        <span class="px-2 py-0.5 rounded-md font-bold text-[11px] ${growthClass}">
                            ${r.growth || '-'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Graph 2: City-wise Distribution (Donut Chart)
     */
    renderCityDistributionChart() {
        const ctx = document.getElementById('cityDistributionChart');
        if (!ctx) return;

        if (this.charts.city) {
            this.charts.city.destroy();
        }

        const cityMap = {
            "Lahore": 548000,
            "Gujranwala": 392000,
            "Faisalabad": 302000,
            "Multan": 288000,
            "Rawalpindi": 175000,
            "Sialkot": 147000,
            "Sargodha": 114900
        };

        const labels = Object.keys(cityMap);
        const values = Object.values(cityMap);

        const colors = [
            '#C59A3F', // Gold (Lahore)
            '#059669', // Emerald (Gujranwala)
            '#3B82F6', // Blue (Faisalabad)
            '#8B5CF6', // Purple (Multan)
            '#EC4899', // Pink (Rawalpindi)
            '#F59E0B', // Amber (Sialkot)
            '#0F172A'  // Slate (Sargodha)
        ];

        this.charts.city = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            font: { size: 11, weight: '600' },
                            padding: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0F172A',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((context.parsed / total) * 100).toFixed(1);
                                return ` ${context.label}: ${Calculator.formatPKR(context.parsed)} (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: '62%'
            }
        });
    },

    /**
     * Graph 3: Product Category Breakdown (Horizontal Bar)
     */
    renderCategoryChart() {
        const ctx = document.getElementById('categoryBreakdownChart');
        if (!ctx) return;

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const labels = ['Stage Chadar & Backdrop', 'Main Hall Ceiling', 'Entrance Rahdari Canopy'];
        const values = [640000, 563000, 264025];

        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (PKR)',
                    data: values,
                    backgroundColor: ['#C59A3F', '#059669', '#3B82F6'],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0F172A',
                        callbacks: {
                            label: function(context) {
                                return ` Sales: ${Calculator.formatPKR(context.parsed.x)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            callback: function(val) {
                                return 'Rs. ' + (val / 100000).toFixed(1) + 'L';
                            }
                        }
                    }
                }
            }
        });
    }
};

window.Analytics = Analytics;

document.addEventListener('DOMContentLoaded', () => {
    Analytics.init();
});
