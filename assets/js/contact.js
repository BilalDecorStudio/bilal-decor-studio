/**
 * Bilal Decor Studio - Warehouse Location & Contact Engine
 * Google Maps Live Integration & Inquiry Handler
 */

const ContactMap = {
    onViewShown() {
        if (window.App && App.applySettings) {
            App.applySettings();
        }
    },

    sendDirectWhatsApp() {
        const settings = (window.Store && Store.getSettings) ? Store.getSettings() : { whatsappNumber: "92300456043" };
        const name = document.getElementById('inqName')?.value || 'Guest Customer';
        const phone = document.getElementById('inqPhone')?.value || '-';
        const city = document.getElementById('inqCity')?.value || '-';
        const marquee = document.getElementById('inqMarquee')?.value || '-';
        const message = document.getElementById('inqMessage')?.value || 'Assalam-o-Alaikum, mujhe marquee decoration fabric rates chahiyein.';

        const text = encodeURIComponent(
            `*Bilal Decor Studio - New Inquiry*\n` +
            `👤 Naam: ${name}\n` +
            `📞 Phone: ${phone}\n` +
            `📍 Shehar: ${city}\n` +
            `🏛️ Marquee: ${marquee}\n` +
            `📝 Paigham: ${message}`
        );

        window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
    },

    handleInquirySubmit(e) {
        e.preventDefault();
        const name = document.getElementById('inqName')?.value || '';
        const phone = document.getElementById('inqPhone')?.value || '';
        const city = document.getElementById('inqCity')?.value || '';
        const marquee = document.getElementById('inqMarquee')?.value || '-';
        const message = document.getElementById('inqMessage')?.value || '';

        // Record lead into CustomerDB if available
        if (window.CustomerDB && CustomerDB.addRecord) {
            CustomerDB.addRecord({
                customerName: name,
                phone: phone,
                city: city,
                marqueeName: marquee,
                notes: "Website Contact Form: " + message,
                orderStatus: "Inquiry / Lead"
            });
        }

        if (window.App && App.showToast) {
            App.showToast("Shukriya! Aap ki inquiry darj ho chuki hai. Hamari team foran rabta karegi.");
        } else {
            alert("Shukriya " + name + "! Aap ki inquiry darj ho chuki hai. Hamari team foran rabta karegi.");
        }

        e.target.reset();
    }
};

window.ContactMap = ContactMap;
