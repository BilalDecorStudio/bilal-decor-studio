/**
 * Bilal Decor Studio - BDS Smart AI Production & Dispatch Estimator
 * 
 * Rules:
 * 1. Base Duration: 5 to 6 working days (standard for 1 to 3 chadrein).
 * 2. Order Volume: If order has > 3 chadrein, each additional chadar adds +1 day.
 * 3. Factory Queue Workload: If 5 or more active orders are in factory queue,
 *    adds +2 days per batch of 5 queued orders.
 * 4. Fabric Area: Large fabric areas (>2,500 sq ft or >5,000 sq ft) add +1 to +2 days for pleating & QC.
 * 5. Dynamic Calendar Target: Computes realistic dispatch date skipping Sundays.
 */

const AIScheduler = {
    BASE_MIN_DAYS: 5,
    BASE_MAX_DAYS: 6,
    CHADAR_THRESHOLD: 3,

    /**
     * Get active factory orders currently occupying workers (cutting or stitching)
     */
    getActiveQueue() {
        if (typeof window === 'undefined' || !window.Store) return { count: 3, orders: [] };
        const orders = Store.getOrders() || [];
        const active = orders.filter(o => 
            o.status === 'cutting' || 
            o.status === 'stitching' || 
            o.status === 'verified' ||
            o.status === 'pending'
        );
        return {
            count: active.length,
            orders: active
        };
    },

    /**
     * Calculate dynamic AI delivery timeframe
     * @param {Object} params
     * @param {number} params.quantity - Number of chadar sets
     * @param {number} params.sqFt - Total square footage
     * @param {string} params.category - stage / hall / entrance
     * @param {number} [params.customQueueCount] - Optional queue override
     */
    calculate({ quantity = 1, sqFt = 1000, category = 'stage', customQueueCount = null }) {
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        const totalSqFt = Math.max(0, parseFloat(sqFt) || 0);
        const queueInfo = this.getActiveQueue();
        const queueCount = customQueueCount !== null ? customQueueCount : queueInfo.count;

        let minDays = this.BASE_MIN_DAYS;
        let maxDays = this.BASE_MAX_DAYS;
        const reasons = [];

        // 1. Order Volume Rule (> 3 chadrein adds +1 day per extra chadar)
        let extraQtyDays = 0;
        if (qty > this.CHADAR_THRESHOLD) {
            extraQtyDays = (qty - this.CHADAR_THRESHOLD) * 1;
            minDays += extraQtyDays;
            maxDays += extraQtyDays;
            reasons.push({
                type: 'volume',
                title: 'Barha Order Volume',
                detail: `${qty} chadrein (${this.CHADAR_THRESHOLD} se ooper hone par +${extraQtyDays} din izafa shamil)`
            });
        } else {
            reasons.push({
                type: 'volume',
                title: 'Order Volume Normal',
                detail: `${qty} chadar (1 se 3 chadrein standard base duration me aati hain)`
            });
        }

        // 2. Factory Queue Rule (>= 5 active orders adds +2 days per batch of 5)
        let extraQueueDays = 0;
        if (queueCount >= 5) {
            const batches = Math.floor(queueCount / 5);
            extraQueueDays = batches * 2;
            minDays += extraQueueDays;
            maxDays += extraQueueDays;
            reasons.push({
                type: 'queue',
                title: 'Factory Queue Workload',
                detail: `Karkhane me is waqt ${queueCount} orders zair-e-kaam hain (+${extraQueueDays} din rush time)`
            });
        } else {
            reasons.push({
                type: 'queue',
                title: 'Factory Workload Clear',
                detail: `Factory me sirf ${queueCount} active orders hain (No queue delay)`
            });
        }

        // 3. Fabric Area / Complexity Factor (>2500 sq ft adds +1 day, >5000 adds +2 days)
        let extraAreaDays = 0;
        if (totalSqFt > 5000) {
            extraAreaDays = 2;
            minDays += extraAreaDays;
            maxDays += extraAreaDays;
            reasons.push({
                type: 'area',
                title: 'Mega Hall Area',
                detail: `${totalSqFt.toLocaleString()} sq ft fabric (+2 din bareek pleating, hooks aur QC test)`
            });
        } else if (totalSqFt > 2500) {
            extraAreaDays = 1;
            minDays += extraAreaDays;
            maxDays += extraAreaDays;
            reasons.push({
                type: 'area',
                title: 'Barha Size Fabric',
                detail: `${totalSqFt.toLocaleString()} sq ft fabric (+1 din double-seam reinforcement)`
            });
        }

        // 4. Target Calendar Dispatch Date Calculation
        const targetDate = this.computeTargetDispatchDate(maxDays);

        // 5. Workload Level
        let status = {
            level: 'optimal',
            label: 'Tez Tareen (Fast Track)',
            badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300'
        };

        if (queueCount >= 10 || qty >= 8) {
            status = {
                level: 'rush',
                label: 'High Rush (Heavy Factory Queue)',
                badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300'
            };
        } else if (queueCount >= 5 || qty > 3) {
            status = {
                level: 'moderate',
                label: 'Busy Production Queue',
                badgeClass: 'bg-blue-100 text-blue-900 border border-blue-300'
            };
        }

        return {
            minDays,
            maxDays,
            durationText: `${minDays} se ${maxDays} working days`,
            targetDateText: targetDate,
            quantity: qty,
            sqFt: totalSqFt,
            queueCount,
            extraQtyDays,
            extraQueueDays,
            extraAreaDays,
            status,
            reasons
        };
    },

    /**
     * Calculate aggregate estimate for cart items
     */
    calculateCart(cartItems = []) {
        if (!cartItems || cartItems.length === 0) {
            return this.calculate({ quantity: 1, sqFt: 1000 });
        }

        const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const totalSqFt = cartItems.reduce((sum, item) => sum + (item.sqFt || 0), 0);
        return this.calculate({ quantity: totalQty, sqFt: totalSqFt });
    },

    /**
     * Compute expected dispatch date skipping non-working days
     */
    computeTargetDispatchDate(daysToAdd) {
        const date = new Date();
        let added = 0;
        while (added < daysToAdd) {
            date.setDate(date.getDate() + 1);
            // Skip Sunday (0)
            if (date.getDay() !== 0) {
                added++;
            }
        }

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    },

    /**
     * Render the interactive AI Estimator Widget into any container element
     */
    renderWidget(targetContainerId, estimate) {
        const container = document.getElementById(targetContainerId);
        if (!container) return;

        container.innerHTML = `
            <div class="ai-estimator-box p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-50 border border-amber-300/80 shadow-sm transition hover:shadow-md">
                <!-- Header -->
                <div class="flex items-center justify-between pb-2.5 border-b border-amber-200/70">
                    <div class="flex items-center space-x-2">
                        <span class="w-6 h-6 rounded-lg bg-amber-200/80 flex items-center justify-center text-xs">🤖</span>
                        <span class="font-extrabold text-xs text-amber-950 font-sans tracking-wide">
                            BDS Smart AI Delivery Estimator
                        </span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${estimate.status.badgeClass}">
                        ${estimate.status.label}
                    </span>
                </div>

                <!-- Big Result -->
                <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <p class="text-[11px] text-slate-500">Tawaqqo Silai aur Rawangi Waqt:</p>
                        <h4 class="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                            ⏱️ ${estimate.durationText}
                        </h4>
                    </div>
                    <div class="sm:text-right">
                        <p class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tawaqqo Dispatch Tareekh:</p>
                        <span class="inline-block px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300 shadow-xs mt-0.5">
                            📅 ${estimate.targetDateText}
                        </span>
                    </div>
                </div>

                <!-- Smart AI Reasoning Pills -->
                <div class="pt-2.5 border-t border-amber-200/60 space-y-1.5 text-[11px]">
                    ${estimate.reasons.map(r => `
                        <div class="flex items-start space-x-1.5 text-slate-700">
                            <span class="text-amber-700 font-bold">⚡</span>
                            <span><strong>${r.title}:</strong> ${r.detail}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.AIScheduler = AIScheduler;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIScheduler;
}
