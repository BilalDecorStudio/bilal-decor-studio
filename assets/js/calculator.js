/**
 * Bilal Decor Studio - Dimension & Square Feet Calculator Logic
 */

const Calculator = {
    /**
     * Calculate square feet and total price
     * @param {number} lengthInFeet
     * @param {number} widthInFeet
     * @param {number} ratePerSqFt
     * @param {number} quantity
     * @returns {Object} calculation results
     */
    compute(lengthInFeet, widthInFeet, ratePerSqFt, quantity = 1) {
        const length = Math.max(0, parseFloat(lengthInFeet) || 0);
        const width = Math.max(0, parseFloat(widthInFeet) || 0);
        const rate = Math.max(0, parseFloat(ratePerSqFt) || 0);
        const qty = Math.max(1, parseInt(quantity, 10) || 1);

        const sqFt = Math.round(length * width);
        const unitPrice = Math.round(sqFt * rate);
        const grandTotal = Math.round(unitPrice * qty);

        return {
            length,
            width,
            rate,
            quantity: qty,
            sqFt,
            unitPrice,
            grandTotal,
            isValid: length > 0 && width > 0 && rate > 0
        };
    },

    /**
     * Format number to Pakistani Rupee currency string
     * e.g. 75000 -> Rs. 75,000
     */
    formatPKR(amount) {
        if (isNaN(amount) || amount === null || amount === undefined) return "Rs. 0";
        return "Rs. " + Number(amount).toLocaleString('en-PK');
    },

    /**
     * Format in Urdu text
     */
    formatUrdu(amount) {
        if (isNaN(amount)) return "0 روپے";
        return Number(amount).toLocaleString('en-PK') + " روپے";
    },

    /**
     * Quick preset dimensions helper for marquees
     */
    presets: [
        { label: "چھوٹا اسٹیج (Small Stage)", length: 30, width: 20, desc: "600 sq ft" },
        { label: "معیاری اسٹیج (Standard Stage)", length: 40, width: 25, desc: "1,000 sq ft" },
        { label: "شاہی بڑا اسٹیج (Royal Grand Stage)", length: 50, width: 30, desc: "1,500 sq ft" },
        { label: "معیاری راہداری (Entrance Corridor)", length: 60, width: 15, desc: "900 sq ft" },
        { label: "لمبی شاہی راہداری (Grand Rahdari)", length: 100, width: 18, desc: "1,800 sq ft" },
        { label: "درمیانہ ہال سیلنگ (Medium Hall)", length: 60, width: 40, desc: "2,400 sq ft" },
        { label: "گرینڈ مارکی ہال (Grand Marquee)", length: 100, width: 50, desc: "5,000 sq ft" }
    ]
};

window.Calculator = Calculator;
