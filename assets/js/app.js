/**
 * Bilal Decor Studio - Main Application Controller (Roman Urdu & PDF System)
 */

const App = {
    currentCategory: 'all',
    selectedProduct: null,
    cart: [],
    currentView: 'home',
    modalImages: [],
    modalImageIndex: 0,

    init() {
        this.cart = Store.getCart();
        this.updateCartBadge();
        this.applySettings();
        this.renderProducts();
        this.bindEvents();

        if (window.Admin && Admin.renderNewProductImagesList) {
            Admin.renderNewProductImagesList();
        }

        if (window.Tracker) {
            Tracker.renderHistory();
            Tracker.renderActivePipeline();
        }

        if (window.KarigarApp) {
            KarigarApp.init();
        }

        window.addEventListener('hashchange', () => this.handleHashChange());
        this.handleHashChange();

        console.log("Bilal Decor Studio App initialized with Roman Urdu & PDF Invoice System.");
    },

    applySettings() {
        const settings = Store.getSettings();
        
        document.querySelectorAll('.btn-whatsapp-dynamic').forEach(el => {
            el.href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Assalam-o-Alaikum Bilal Decor Studio! Mujhe marquee ceiling aur chadar ke rates aur quotation chahiye thi.')}`;
        });

        const topPhone = document.getElementById('topBarPhone');
        if (topPhone) {
            topPhone.innerText = settings.phoneDisplay;
            topPhone.href = `tel:${settings.phoneDisplay.replace(/[^0-9+]/g, '')}`;
        }

        const jzNo = document.getElementById('payJazzcashNo');
        const jzTitle = document.getElementById('payJazzcashTitle');
        const epNo = document.getElementById('payEasypaisaNo');
        const epTitle = document.getElementById('payEasypaisaTitle');
        const bankName = document.getElementById('payBankName');
        const bankTitle = document.getElementById('payBankTitle');
        const bankAcc = document.getElementById('payBankAcc');
        const bankIban = document.getElementById('payBankIban');

        if (jzNo) jzNo.innerText = settings.jazzcash.number;
        if (jzTitle) jzTitle.innerText = settings.jazzcash.title;
        if (epNo) epNo.innerText = settings.easypaisa.number;
        if (epTitle) epTitle.innerText = settings.easypaisa.title;
        if (bankName) bankName.innerText = settings.bank.bankName;
        if (bankTitle) bankTitle.innerText = settings.bank.title;
        if (bankAcc) bankAcc.innerText = settings.bank.accountNo;
        if (bankIban) bankIban.innerText = settings.bank.iban;
    },

    bindEvents() {
        const cityFilter = document.getElementById('historyCityFilter');
        if (cityFilter) {
            cityFilter.addEventListener('change', (e) => {
                Tracker.renderHistory(e.target.value);
            });
        }

        // Keyboard arrow navigation for multi-image product modal
        window.addEventListener('keydown', (e) => {
            const modal = document.getElementById('productDetailModal');
            if (modal && !modal.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') {
                    this.prevModalImage();
                } else if (e.key === 'ArrowRight') {
                    this.nextModalImage();
                } else if (e.key === 'Escape') {
                    this.closeProductModal();
                }
            }
        });
    },

    handleHashChange() {
        const hash = window.location.hash.replace('#', '') || 'home';
        this.navigateTo(hash);
    },

    navigateTo(viewName) {
        this.currentView = viewName;
        
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.add('hidden');
        });

        const target = document.getElementById(`view-${viewName}`) || document.getElementById('view-home');
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        this.closeMobileMenu();

        if (viewName === 'admin') {
            this.handleAdminView();
        }

        if (viewName === 'karigar' && window.KarigarApp) {
            KarigarApp.checkWorkerSession();
        }
    },

    filterCategory(category) {
        this.currentCategory = category;
        
        document.querySelectorAll('.catalog-tab').forEach(btn => {
            if (btn.dataset.category === category) {
                btn.className = "catalog-tab px-5 py-2.5 rounded-full text-xs md:text-sm font-extrabold bg-[#0F172A] text-amber-300 shadow-md transition";
            } else {
                btn.className = "catalog-tab px-5 py-2.5 rounded-full text-xs md:text-sm font-bold bg-white border border-amber-200/80 text-slate-700 hover:text-amber-800 hover:border-amber-400 transition shadow-sm";
            }
        });

        this.renderProducts();
    },

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        let products = Store.getProducts();
        if (this.currentCategory !== 'all') {
            products = products.filter(p => p.category === this.currentCategory);
        }

        grid.innerHTML = products.map(prod => `
            <div class="product-card luxury-card rounded-2xl overflow-hidden flex flex-col group bg-white border border-amber-300/40 shadow-sm hover:shadow-xl transition">
                <div class="relative h-64 overflow-hidden bg-slate-100">
                    <img src="${prod.images[0]}" alt="${prod.title}" class="product-card-img w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    <div class="absolute top-3 left-3 bg-[#0F172A] text-amber-300 border border-amber-400/40 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-md flex items-center space-x-1">
                        <span class="font-mono">Rs. ${prod.ratePerSqFt}</span>
                        <span class="text-[10px] font-normal text-amber-200">/ sq. ft</span>
                    </div>

                    ${prod.badge ? `
                        <div class="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-amber-400/50 text-amber-900 px-3 py-0.5 rounded-full text-[11px] font-bold shadow-sm">
                            ${prod.badge}
                        </div>
                    ` : ''}

                    <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                        <div class="flex items-center space-x-1.5 flex-wrap gap-1">
                            <span class="px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[11px] text-amber-200 font-medium">
                                ${prod.categoryName}
                            </span>
                            ${(prod.images && prod.images.length > 1) ? `
                                <span class="px-2 py-0.5 rounded-md bg-amber-950/80 backdrop-blur-md text-[10px] text-amber-300 font-bold border border-amber-400/30 flex items-center gap-1 shadow-xs">
                                    <span>📷</span><span>${prod.images.length} Photos</span>
                                </span>
                            ` : ''}
                        </div>
                        <span class="flex items-center text-amber-300 font-bold drop-shadow shrink-0 ml-1">
                            ★ ${prod.rating} <span class="text-white/80 font-normal ml-1">(${prod.reviewCount})</span>
                        </span>
                    </div>
                </div>

                <div class="p-5 flex-1 flex flex-col justify-between bg-white">
                    <div>
                        <h3 class="font-bold text-slate-900 text-base group-hover:text-amber-800 transition mb-1 leading-snug">
                            ${prod.titleRoman || prod.title}
                        </h3>
                        <p class="text-xs text-slate-500 font-sans mb-2 line-clamp-1">
                            ${prod.title}
                        </p>
                        <p class="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                            ${prod.description}
                        </p>
                    </div>

                    <div class="pt-3 border-t border-slate-100 flex items-center space-x-2">
                        <button onclick="App.openProductModal('${prod.id}')" class="btn-3d-gold flex-1 py-2.5 px-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 transition">
                            <span>📐 Size aur Bill Calculate</span>
                        </button>
                        <button onclick="App.openProductModal('${prod.id}')" class="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition" title="Details">
                            👁️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (window.Tilt3D) {
            setTimeout(() => Tilt3D.bindCardTilt(), 50);
        }
    },

    openProductModal(productId) {
        const products = Store.getProducts();
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        this.selectedProduct = prod;

        document.getElementById('modalProdTitleUrdu').innerText = prod.titleRoman || prod.title;
        document.getElementById('modalProdTitleEn').innerText = prod.title;
        document.getElementById('modalProdCategory').innerText = prod.categoryName;
        document.getElementById('modalProdRate').innerText = `Rs. ${prod.ratePerSqFt} / sq. ft`;
        document.getElementById('modalProdDesc').innerText = prod.description;
        document.getElementById('modalProdFabric').innerText = prod.fabricType || 'Royal Velvet';
        
        // Multi-image gallery initialization
        this.modalImages = (Array.isArray(prod.images) && prod.images.length > 0)
            ? prod.images
            : (prod.images ? [prod.images] : (prod.image ? [prod.image] : ["assets/images/royal_gold_ceiling.jpg"]));
        this.modalImageIndex = 0;
        this.renderModalGallery();

        const featContainer = document.getElementById('modalFeaturesList');
        featContainer.innerHTML = (prod.features || []).map(f => `
            <li class="flex items-center space-x-2 text-xs text-slate-700">
                <span class="text-amber-700 font-bold">✓</span>
                <span>${f}</span>
            </li>
        `).join('');

        const videoSection = document.getElementById('modalVideoSection');
        if (prod.videoUrl) {
            videoSection.classList.remove('hidden');
            document.getElementById('modalVideoIframe').src = prod.videoUrl;
        } else {
            videoSection.classList.add('hidden');
            document.getElementById('modalVideoIframe').src = "";
        }

        document.getElementById('calcInputLength').value = prod.defaultLength || 40;
        document.getElementById('calcInputWidth').value = prod.defaultWidth || 25;
        document.getElementById('calcInputQty').value = 1;

        this.renderProductReviews(prod.id);
        this.calculateModalPrice();

        document.getElementById('productDetailModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    },

    renderModalGallery() {
        const mainImg = document.getElementById('modalMainImage');
        if (mainImg && this.modalImages.length > 0) {
            mainImg.src = this.modalImages[this.modalImageIndex];
        }

        const counter = document.getElementById('modalImgCounter');
        if (counter) {
            counter.innerText = `${this.modalImageIndex + 1} / ${this.modalImages.length}`;
            if (this.modalImages.length <= 1) {
                counter.classList.add('hidden');
            } else {
                counter.classList.remove('hidden');
            }
        }

        const prevBtn = document.getElementById('modalPrevImgBtn');
        const nextBtn = document.getElementById('modalNextImgBtn');
        if (prevBtn && nextBtn) {
            if (this.modalImages.length > 1) {
                prevBtn.classList.remove('hidden');
                nextBtn.classList.remove('hidden');
            } else {
                prevBtn.classList.add('hidden');
                nextBtn.classList.add('hidden');
            }
        }

        const thumbContainer = document.getElementById('modalThumbnails');
        if (thumbContainer) {
            thumbContainer.innerHTML = this.modalImages.map((img, idx) => `
                <button onclick="App.setModalImage(${idx})" class="w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${idx === this.modalImageIndex ? 'border-amber-600 ring-2 ring-amber-500/50 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-amber-400'}" title="Tasveer ${idx + 1}">
                    <img src="${img}" class="w-full h-full object-cover" alt="" onerror="this.src='assets/images/royal_gold_ceiling.jpg'">
                </button>
            `).join('');
        }
    },

    setModalImage(idx) {
        if (idx >= 0 && idx < this.modalImages.length) {
            this.modalImageIndex = idx;
            this.renderModalGallery();
        }
    },

    prevModalImage() {
        if (!this.modalImages || this.modalImages.length <= 1) return;
        this.modalImageIndex = (this.modalImageIndex - 1 + this.modalImages.length) % this.modalImages.length;
        this.renderModalGallery();
    },

    nextModalImage() {
        if (!this.modalImages || this.modalImages.length <= 1) return;
        this.modalImageIndex = (this.modalImageIndex + 1) % this.modalImages.length;
        this.renderModalGallery();
    },

    changeModalImage(imgSrc) {
        const foundIdx = this.modalImages.indexOf(imgSrc);
        if (foundIdx !== -1) {
            this.setModalImage(foundIdx);
        } else {
            const mainImg = document.getElementById('modalMainImage');
            if (mainImg) mainImg.src = imgSrc;
        }
    },

    closeProductModal() {
        document.getElementById('productDetailModal').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        document.getElementById('modalVideoIframe').src = "";
        this.selectedProduct = null;
        this.modalImages = [];
        this.modalImageIndex = 0;
    },

    applyPresetDimension(length, width) {
        document.getElementById('calcInputLength').value = length;
        document.getElementById('calcInputWidth').value = width;
        this.calculateModalPrice();
    },

    calculateModalPrice() {
        if (!this.selectedProduct) return;

        const length = parseFloat(document.getElementById('calcInputLength')?.value) || 0;
        const width = parseFloat(document.getElementById('calcInputWidth')?.value) || 0;
        const qty = parseInt(document.getElementById('calcInputQty')?.value, 10) || 1;
        const rate = this.selectedProduct.ratePerSqFt;

        const result = Calculator.compute(length, width, rate, qty);

        const elSqFt = document.getElementById('calcDisplaySqFt');
        const elRate = document.getElementById('calcDisplayRate');
        const elUnit = document.getElementById('calcDisplayUnitPrice');
        const elTotal = document.getElementById('calcDisplayGrandTotal');
        const elUrdu = document.getElementById('calcDisplayGrandTotalUrdu');

        if (elSqFt) elSqFt.innerText = result.sqFt.toLocaleString() + " sq ft";
        if (elRate) elRate.innerText = "Rs. " + result.rate;
        if (elUnit) elUnit.innerText = Calculator.formatPKR(result.unitPrice);
        if (elTotal) elTotal.innerText = Calculator.formatPKR(result.grandTotal);
        if (elUrdu) elUrdu.innerText = Calculator.formatPKR(result.grandTotal);

        // Dynamic BDS Smart AI Delivery Estimator
        if (window.AIScheduler) {
            const estimate = AIScheduler.calculate({
                quantity: qty,
                sqFt: result.sqFt,
                category: this.selectedProduct.category
            });
            AIScheduler.renderWidget('modalAIEstimatorWidget', estimate);
        }

        return result;
    },

    renderProductReviews(productId) {
        const container = document.getElementById('modalReviewsList');
        if (!container) return;

        const allReviews = Store.getReviews();
        const reviews = allReviews.filter(r => r.productId === productId);

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                    Is design par abhi koi review nahi hai. Aap pehle customer ban kar review submit kar sakte hain!
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(rev => `
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-xs">
                            ${rev.customerName.charAt(0)}
                        </span>
                        <div>
                            <p class="font-bold text-slate-900">${rev.customerName}</p>
                            <span class="text-[11px] text-amber-800 font-semibold">📍 ${rev.city} ${rev.businessName ? `• ${rev.businessName}` : ''}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-amber-500">★★★★★</div>
                        <span class="text-[10px] text-slate-400 font-medium">${rev.date}</span>
                    </div>
                </div>
                <p class="text-slate-700 leading-relaxed">${rev.comment}</p>
            </div>
        `).join('');
    },

    submitCustomerReview(event) {
        event.preventDefault();
        if (!this.selectedProduct) return;

        const name = document.getElementById('reviewCustName')?.value.trim();
        const city = document.getElementById('reviewCustCity')?.value.trim();
        const marquee = document.getElementById('reviewCustMarquee')?.value.trim();
        const comment = document.getElementById('reviewCustComment')?.value.trim();

        if (!name || !city || !comment) {
            alert("Barahe meharbani apna naam, shehar aur raye darj karein.");
            return;
        }

        const newReview = {
            id: 'rev-' + Date.now(),
            productId: this.selectedProduct.id,
            customerName: name,
            businessName: marquee,
            city: city,
            rating: 5,
            date: "Taza Tareen",
            comment: comment
        };

        const reviews = Store.getReviews();
        reviews.unshift(newReview);
        Store.saveReviews(reviews);

        alert("Aap ka qeemti review shamil ho gaya hai. Shukriya!");
        document.getElementById('customerReviewForm').reset();
        this.renderProductReviews(this.selectedProduct.id);
    },

    addToCartFromModal() {
        if (!this.selectedProduct) return;

        const calc = this.calculateModalPrice();
        if (!calc || !calc.isValid) {
            alert("Barahe meharbani lambai aur chaurai sahi darj karein.");
            return;
        }

        const cartItem = {
            cartItemId: 'item-' + Date.now(),
            productId: this.selectedProduct.id,
            title: this.selectedProduct.titleRoman || this.selectedProduct.title,
            titleEn: this.selectedProduct.title,
            image: this.selectedProduct.images[0],
            length: calc.length,
            width: calc.width,
            sqFt: calc.sqFt,
            rate: calc.rate,
            quantity: calc.quantity,
            total: calc.grandTotal
        };

        this.cart.push(cartItem);
        Store.saveCart(this.cart);
        this.updateCartBadge();
        this.closeProductModal();

        alert(`"${cartItem.title}" (${calc.length}x${calc.width} ft) Cart me shamil kar liya gaya.`);
        this.openCartModal();
    },

    orderDirectWhatsApp() {
        if (!this.selectedProduct) return;
        const calc = this.calculateModalPrice();
        const settings = Store.getSettings();

        const message = 
`*Assalam-o-Alaikum Bilal Decor Studio!*
Mujhe ye marquee chadar ka order confirm karna hai:
- *Design:* ${this.selectedProduct.titleRoman || this.selectedProduct.title}
- *Size:* ${calc.length} x ${calc.width} feet (${calc.sqFt} sq ft)
- *Rate:* Rs. ${calc.rate} / sq ft
- *Quantity:* ${calc.quantity} sets
- *Total Amount:* ${Calculator.formatPKR(calc.grandTotal)}

Barahe meharbani delivery timeframe aur account details tasdeeq kar dein.`;

        const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    updateCartBadge() {
        const count = this.cart.length;
        document.querySelectorAll('.cart-count-badge').forEach(el => {
            el.innerText = count;
            if (count > 0) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    },

    openCartModal() {
        this.renderCartItems();
        document.getElementById('cartCheckoutModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    },

    closeCartModal() {
        document.getElementById('cartCheckoutModal').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    },

    renderCartItems() {
        const container = document.getElementById('cartItemsList');
        const emptyState = document.getElementById('cartEmptyState');
        const checkoutForm = document.getElementById('cartCheckoutForm');
        const subtotalEl = document.getElementById('cartSubtotal');
        const grandTotalEl = document.getElementById('cartGrandTotal');

        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = "";
            emptyState.classList.remove('hidden');
            checkoutForm.classList.add('hidden');
            if (subtotalEl) subtotalEl.innerText = "Rs. 0";
            if (grandTotalEl) grandTotalEl.innerText = "Rs. 0";
            return;
        }

        emptyState.classList.add('hidden');
        checkoutForm.classList.remove('hidden');

        const total = this.cart.reduce((sum, item) => sum + item.total, 0);

        container.innerHTML = this.cart.map((item, index) => `
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="flex items-center space-x-3">
                    <img src="${item.image}" class="w-14 h-14 object-cover rounded-lg border border-slate-300" alt="">
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm">${item.title}</h4>
                        <p class="text-amber-800 font-bold text-xs mt-0.5">
                            Size: ${item.length} x ${item.width} ft (${item.sqFt.toLocaleString()} sq ft)
                        </p>
                        <p class="text-slate-500 text-[11px]">
                            Rate: Rs. ${item.rate}/sq ft | Qty: ${item.quantity}
                        </p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <span class="font-mono font-bold text-slate-900 text-sm">${Calculator.formatPKR(item.total)}</span>
                    <button onclick="App.removeFromCart(${index})" class="text-red-500 hover:text-red-700 p-1 font-bold" title="Remove">
                        ✕
                    </button>
                </div>
            </div>
        `).join('');

        if (subtotalEl) subtotalEl.innerText = Calculator.formatPKR(total);
        if (grandTotalEl) grandTotalEl.innerText = Calculator.formatPKR(total);

        // Render BDS Smart AI Delivery Estimator for Cart
        if (window.AIScheduler) {
            const cartEstimate = AIScheduler.calculateCart(this.cart);
            AIScheduler.renderWidget('cartAIEstimatorWidget', cartEstimate);
        }
    },

    removeFromCart(index) {
        this.cart.splice(index, 1);
        Store.saveCart(this.cart);
        this.updateCartBadge();
        this.renderCartItems();
    },

    submitOnlineOrder(event) {
        event.preventDefault();
        if (this.cart.length === 0) return;

        const name = document.getElementById('checkoutCustName')?.value.trim();
        const phone = document.getElementById('checkoutCustPhone')?.value.trim();
        const city = document.getElementById('checkoutCustCity')?.value.trim();
        const marquee = document.getElementById('checkoutCustMarquee')?.value.trim();
        const address = document.getElementById('checkoutCustAddress')?.value.trim();

        if (!name || !phone || !city) {
            alert("Barahe meharbani apna naam, phone number aur shehar darj karein.");
            return;
        }

        const totalAmount = this.cart.reduce((sum, item) => sum + item.total, 0);
        const orderId = "BDS-" + Math.floor(1000 + Math.random() * 9000);
        const passcode = Math.floor(1000 + Math.random() * 9000).toString();

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const phoneMasked = cleanPhone.length > 7 ? cleanPhone.slice(0, 4) + "-****" + cleanPhone.slice(-3) : phone;

        // BDS Smart AI Dynamic Dispatch Prediction
        let expectedDispatch = "5 se 6 working days";
        let aiScheduleInfo = null;
        if (window.AIScheduler) {
            aiScheduleInfo = AIScheduler.calculateCart(this.cart);
            expectedDispatch = `${aiScheduleInfo.durationText} (Tawaqqo Tareekh: ${aiScheduleInfo.targetDateText})`;
        }

        const newOrder = {
            orderId,
            passcode,
            clientName: name + (marquee ? ` (${marquee})` : ''),
            clientPhone: phone,
            phoneMasked,
            city,
            marqueeName: marquee,
            deliveryAddress: address,
            items: [...this.cart],
            totalAmount,
            advancePaid: 0,
            remainingBalance: totalAmount,
            paymentStatus: "Payment Slip Pending",
            status: "pending",
            statusText: "Order Mosool Hua. Slip verified hone par cutting shuru hogi.",
            expectedDispatch,
            aiScheduleInfo,
            cargoDetails: address || "Local Cargo Adda",
            createdAt: new Date().toISOString().slice(0, 10)
        };

        const orders = Store.getOrders();
        orders.unshift(newOrder);
        Store.saveOrders(orders);

        // Record into Customer Database (for Excel & ML dataset)
        if (window.CustomerDB) {
            CustomerDB.addRecord({
                customerId: "CUST-" + Math.floor(1000 + Math.random() * 9000),
                date: new Date().toISOString().slice(0, 10),
                customerName: name,
                phone: phone,
                city: city,
                marqueeName: marquee,
                designTitle: this.cart[0]?.title || "Marquee Ceiling",
                category: "Marquee Ceiling",
                length_ft: this.cart[0]?.length || 0,
                width_ft: this.cart[0]?.width || 0,
                total_sqft: this.cart.reduce((s, i) => s + (i.sqFt || 0), 0),
                rate_sqft: this.cart[0]?.rate || 65,
                quantity: this.cart.reduce((s, i) => s + (i.quantity || 1), 0),
                totalAmount_PKR: totalAmount,
                advancePaid_PKR: 0,
                balanceDue_PKR: totalAmount,
                paymentStatus: "Pending",
                orderStatus: "Order Placed"
            });
        }

        this.cart = [];
        Store.saveCart(this.cart);
        this.updateCartBadge();

        this.closeCartModal();
        this.showOrderSuccessModal(newOrder);

        if (window.Tracker) {
            Tracker.renderActivePipeline();
        }
    },

    showOrderSuccessModal(order) {
        document.getElementById('successOrderId').innerText = "#" + order.orderId;
        document.getElementById('successPasscode').innerText = order.passcode;
        document.getElementById('successTotalAmount').innerText = Calculator.formatPKR(order.totalAmount);
        
        const settings = Store.getSettings();
        const itemsSummary = (order.items || []).map(i => `- ${i.title} (${i.length}x${i.width} ft)`).join('\n');
        const message = 
`*Assalam-o-Alaikum Bilal Decor Studio!*
Maine website par order register kiya hai:
- *Order ID:* #${order.orderId}
- *Naam:* ${order.clientName}
- *City:* ${order.city}
- *Total Amount:* ${Calculator.formatPKR(order.totalAmount)}
- *Details:*
${itemsSummary}

Payment screenshot sath me bhej raha hoon. Barahe meharbani confirm karein.`;

        const btnWhatsApp = document.getElementById('btnSuccessWhatsAppSlip');
        if (btnWhatsApp) {
            btnWhatsApp.onclick = () => {
                const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            };
        }

        // Direct PDF Button on Success Modal
        const btnPDF = document.getElementById('btnSuccessDownloadPDF');
        if (btnPDF) {
            btnPDF.onclick = () => {
                Invoice.generateFromOrder(order.orderId);
            };
        }

        document.getElementById('orderSuccessModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    },

    closeSuccessModal() {
        document.getElementById('orderSuccessModal').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    },

    formatYouTubeEmbedUrl(url) {
        if (!url) return '';
        const clean = String(url).trim();
        if (clean.includes('youtube.com/embed/')) {
            if (!clean.includes('autoplay=')) {
                return clean + (clean.includes('?') ? '&autoplay=1&rel=0' : '?autoplay=1&rel=0');
            }
            return clean;
        }

        let videoId = '';
        const youtuMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (youtuMatch) {
            videoId = youtuMatch[1];
        } else {
            const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (watchMatch) {
                videoId = watchMatch[1];
            } else {
                const shortsMatch = clean.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
                if (shortsMatch) {
                    videoId = shortsMatch[1];
                }
            }
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        return clean;
    },

    playHeaderVideo(videoKey) {
        const settings = Store.getSettings();
        const video = settings.headerVideos ? settings.headerVideos[videoKey] : null;
        if (!video) return;

        const modal = document.getElementById('headerVideoModal');
        const iframe = document.getElementById('headerVideoIframe');
        const title = document.getElementById('headerVideoTitle');

        if (title) title.innerText = video.title;
        if (iframe) iframe.src = this.formatYouTubeEmbedUrl(video.url);

        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        }
    },

    closeHeaderVideoModal() {
        const modal = document.getElementById('headerVideoModal');
        const iframe = document.getElementById('headerVideoIframe');
        if (iframe) iframe.src = "";
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    },

    async handleAdminView() {
        const loginSection = document.getElementById('adminLoginSection');
        const panelSection = document.getElementById('adminDashboardSection');

        if (Admin.isLoggedIn()) {
            if (loginSection) loginSection.classList.add('hidden');
            if (panelSection) panelSection.classList.remove('hidden');
            Admin.renderStats();
            Admin.renderOrdersTable();
            Admin.initOrderCreator();
            Admin.renderAdminProducts();
            Admin.loadSettingsForm();
            Admin.loadSecurityStatus();
            if (window.Analytics) {
                Analytics.render();
            }
        } else {
            if (loginSection) loginSection.classList.remove('hidden');
            if (panelSection) panelSection.classList.add('hidden');
        }
    },

    async submitAdminLogin(event) {
        event.preventDefault();
        const pass = document.getElementById('adminLoginPassword')?.value;
        const res = await Admin.login(pass);
        if (res.success) {
            this.handleAdminView();
        } else {
            alert(res.message);
        }
    },

    copyText(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const original = btnElement.innerText;
            btnElement.innerText = "Copy Ho Gaya! ✓";
            btnElement.classList.add('text-emerald-700', 'font-bold');
            setTimeout(() => {
                btnElement.innerText = original;
                btnElement.classList.remove('text-emerald-700', 'font-bold');
            }, 2000);
        });
    },

    toggleMobileMenu() {
        const menu = document.getElementById('mobileNavDrawer');
        if (menu) menu.classList.toggle('hidden');
    },

    closeMobileMenu() {
        const menu = document.getElementById('mobileNavDrawer');
        if (menu) menu.classList.add('hidden');
    }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
