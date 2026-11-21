/**
 * Bilal Decor Studio - Custom 3D In-App Popup & Toast System
 * Replaces default ugly browser alerts with branded luxury 3D modal dialogs.
 */

const Popup = {
    overlayEl: null,
    toastContainerEl: null,
    activeCallback: null,

    init() {
        this.createDOM();
        this.overrideNativeAlert();
    },

    createDOM() {
        if (document.getElementById('customPopupOverlay')) return;

        // 1. Modal Overlay
        const overlay = document.createElement('div');
        overlay.id = 'customPopupOverlay';
        overlay.className = 'fixed inset-0 z-[100] hidden flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity duration-200';
        overlay.innerHTML = `
            <div id="customPopupCard" class="custom-popup-card relative max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-amber-300 text-center space-y-4">
                <!-- 3D Floating Icon Badge -->
                <div id="customPopupIconContainer" class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg border border-amber-300/80 transition-transform">
                    <span id="customPopupIcon">✨</span>
                </div>

                <!-- Title & Content in Simple Roman Urdu -->
                <div>
                    <h3 id="customPopupTitle" class="text-xl font-black text-slate-900 font-serif-luxury tracking-wide">
                        Tawajja Farmayein
                    </h3>
                    <p id="customPopupMessage" class="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                        Message yahan show hoga.
                    </p>
                </div>

                <!-- Action Buttons -->
                <div id="customPopupActions" class="pt-2 flex items-center justify-center gap-3">
                    <button id="customPopupBtnPrimary" onclick="Popup.close(true)" class="btn-3d-gold px-8 py-3 rounded-xl text-white font-extrabold text-xs shadow-md">
                        Theek Hai (OK)
                    </button>
                    <button id="customPopupBtnCancel" onclick="Popup.close(false)" class="hidden px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300">
                        Nahi (Cancel)
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlayEl = overlay;

        // 2. Toast Container
        const toastContainer = document.createElement('div');
        toastContainer.id = 'customToastContainer';
        toastContainer.className = 'fixed top-5 right-5 z-[110] flex flex-col space-y-2 pointer-events-none';
        document.body.appendChild(toastContainer);
        this.toastContainerEl = toastContainer;
    },

    /**
     * Show Modal Alert in simple Roman Urdu
     */
    show(options = {}) {
        this.createDOM();
        const {
            title = "Bilal Decor Studio",
            message = "",
            type = "info", // success, warning, info, error
            confirmText = "Theek Hai (OK)",
            cancelText = null,
            onConfirm = null,
            onCancel = null
        } = typeof options === 'string' ? { message: options } : options;

        const titleEl = document.getElementById('customPopupTitle');
        const msgEl = document.getElementById('customPopupMessage');
        const iconEl = document.getElementById('customPopupIcon');
        const iconBox = document.getElementById('customPopupIconContainer');
        const btnPrimary = document.getElementById('customPopupBtnPrimary');
        const btnCancel = document.getElementById('customPopupBtnCancel');

        titleEl.innerText = title;
        msgEl.innerText = message;
        btnPrimary.innerText = confirmText;

        // Style according to type
        if (type === 'success') {
            iconEl.innerText = "✓";
            iconBox.className = "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-emerald-200 shadow-lg";
            btnPrimary.className = "btn-3d-emerald px-8 py-3 rounded-xl text-white font-extrabold text-xs shadow-md";
        } else if (type === 'warning') {
            iconEl.innerText = "⚠️";
            iconBox.className = "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl bg-amber-100 text-amber-900 border border-amber-300 shadow-amber-200 shadow-lg";
            btnPrimary.className = "btn-3d-gold px-8 py-3 rounded-xl text-white font-extrabold text-xs shadow-md";
        } else if (type === 'error') {
            iconEl.innerText = "✕";
            iconBox.className = "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black bg-red-100 text-red-800 border border-red-300 shadow-red-200 shadow-lg";
            btnPrimary.className = "px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md";
        } else {
            iconEl.innerText = "✨";
            iconBox.className = "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl bg-[#FAF7F0] text-amber-900 border border-amber-300 shadow-amber-200 shadow-lg";
            btnPrimary.className = "btn-3d-gold px-8 py-3 rounded-xl text-white font-extrabold text-xs shadow-md";
        }

        if (cancelText) {
            btnCancel.innerText = cancelText;
            btnCancel.classList.remove('hidden');
        } else {
            btnCancel.classList.add('hidden');
        }

        this.activeCallback = { onConfirm, onCancel };
        this.overlayEl.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    },

    close(isConfirmed = true) {
        if (!this.overlayEl) return;
        this.overlayEl.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');

        if (this.activeCallback) {
            if (isConfirmed && typeof this.activeCallback.onConfirm === 'function') {
                this.activeCallback.onConfirm();
            } else if (!isConfirmed && typeof this.activeCallback.onCancel === 'function') {
                this.activeCallback.onCancel();
            }
            this.activeCallback = null;
        }
    },

    /**
     * Show non-blocking toast (sliding pill top-right)
     */
    toast(message, type = "success", duration = 3000) {
        this.createDOM();
        const toast = document.createElement('div');
        toast.className = `toast-slide-in pointer-events-auto flex items-center space-x-3 p-3.5 px-4 rounded-2xl bg-white border border-amber-300 shadow-2xl text-xs max-w-sm`;

        let icon = "✨";
        let colorClass = "text-amber-800";
        if (type === 'success') { icon = "✅"; colorClass = "text-emerald-800"; }
        if (type === 'warning') { icon = "⚠️"; colorClass = "text-amber-800"; }
        if (type === 'error') { icon = "❌"; colorClass = "text-red-800"; }

        toast.innerHTML = `
            <span class="text-base">${icon}</span>
            <div class="flex-1 font-bold ${colorClass}">${message}</div>
            <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-700 text-sm">✕</button>
        `;

        this.toastContainerEl.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(80px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    /**
     * Override native browser alert() to use our 3D in-app modal
     */
    overrideNativeAlert() {
        const self = this;
        window._nativeAlert = window.alert;
        window.alert = function(msg) {
            // Determine type by content
            const str = String(msg || '');
            let type = 'info';
            let title = 'Bilal Decor Studio';

            if (str.includes('Mubarak') || str.includes('shamil') || str.includes('kamyabi') || str.includes('save') || str.includes('update')) {
                type = 'success';
                title = 'Zabardast!';
            } else if (str.includes('Barahe meharbani') || str.includes('nahi') || str.includes('Theek nahi')) {
                type = 'warning';
                title = 'Tawajja Farmayein';
            }

            self.show({
                title,
                message: str,
                type,
                confirmText: "Theek Hai (OK)"
            });
        };
    }
};

window.Popup = Popup;

document.addEventListener('DOMContentLoaded', () => {
    Popup.init();
});
