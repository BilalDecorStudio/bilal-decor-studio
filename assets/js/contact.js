/**
 * Bilal Decor Studio - Warehouse Location & Interactive Pin Engine
 * Leaflet.js Interactive Map with Draggable Marker, Custom Pinning, and Local Storage
 */

const ContactMap = {
    map: null,
    marker: null,
    defaultCoords: [31.4550, 74.3490], // Chungi Amer Sidhu, Ferozepur Road, Lahore
    currentCoords: [31.4550, 74.3490],
    isInitialized: false,

    init() {
        const mapContainer = document.getElementById('warehouseLiveMap');
        if (!mapContainer || this.isInitialized) return;

        // Check for previously saved pinned location
        try {
            const saved = localStorage.getItem('bds_pinned_warehouse_loc');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.lat && parsed.lng) {
                    this.currentCoords = [Number(parsed.lat), Number(parsed.lng)];
                }
            }
        } catch (e) {
            console.error("Error reading saved pin location:", e);
        }

        // Initialize Leaflet map
        if (typeof L !== 'undefined') {
            try {
                this.map = L.map('warehouseLiveMap', {
                    center: this.currentCoords,
                    zoom: 15,
                    scrollWheelZoom: false // prevents accidental scroll capture
                });

                // OpenStreetMap Tile Layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors • Bilal Decor Studio'
                }).addTo(this.map);

                // Custom Luxury Marker Icon
                const customIcon = L.divIcon({
                    className: 'custom-bds-pin',
                    html: `
                        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                            <div style="position: absolute; width: 28px; height: 28px; background: rgba(217, 119, 6, 0.4); border-radius: 50%;"></div>
                            <div style="width: 38px; height: 38px; background: #0F172A; border: 2.5px solid #D4AF37; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
                                <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
                            </div>
                        </div>
                    `,
                    iconSize: [44, 44],
                    iconAnchor: [22, 40],
                    popupAnchor: [0, -36]
                });

                // Add draggable marker
                this.marker = L.marker(this.currentCoords, {
                    draggable: true,
                    icon: customIcon
                }).addTo(this.map);

                const popupContent = `
                    <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #0F172A;">
                        <strong style="color: #92400E; font-size: 13px;">📍 Bilal Decor Studio Warehouse</strong><br>
                        <span>Chungi Amer Sidhu, Ferozepur Road, Lahore</span><br>
                        <span style="color: #065F46; font-weight: bold;">● Central Workshop & Fabrication Hub</span><br>
                        <small style="color: #64748B;">Pin ko drag karein exact gate set karne ke liye</small>
                    </div>
                `;

                this.marker.bindPopup(popupContent).openPopup();

                // On Marker Drag End
                this.marker.on('dragend', (e) => {
                    const position = e.target.getLatLng();
                    this.updateCoordinates(position.lat, position.lng);
                });

                // On Map Click (Pin anywhere)
                this.map.on('click', (e) => {
                    this.marker.setLatLng(e.latlng);
                    this.updateCoordinates(e.latlng.lat, e.latlng.lng);
                });

                this.isInitialized = true;
                this.updateCoordinates(this.currentCoords[0], this.currentCoords[1], false);
            } catch (err) {
                console.error("Map init error:", err);
                this._renderMapFallback();
            }
        } else {
            this._renderMapFallback();
        }
    },

    _renderMapFallback() {
        const container = document.getElementById('warehouseLiveMap');
        if (!container) return;
        container.innerHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                frameborder="0" 
                scrolling="no" 
                marginheight="0" 
                marginwidth="0" 
                src="https://www.openstreetmap.org/export/embed.html?bbox=74.3400%2C31.4500%2C74.3580%2C31.4600&amp;layer=mapnik&amp;marker=31.4550%2C74.3490"
                style="border: none; border-radius: 12px; width: 100%; height: 100%;">
            </iframe>
        `;
    },

    onViewShown() {
        setTimeout(() => {
            if (!this.isInitialized) {
                this.init();
            } else if (this.map) {
                this.map.invalidateSize();
                this.map.panTo(this.currentCoords);
            }
        }, 120);
    },

    updateCoordinates(lat, lng, showToast = true) {
        this.currentCoords = [lat, lng];
        const latFixed = Number(lat).toFixed(6);
        const lngFixed = Number(lng).toFixed(6);

        const latEl = document.getElementById('currentPinLat');
        const lngEl = document.getElementById('currentPinLng');
        if (latEl) latEl.innerText = latFixed;
        if (lngEl) lngEl.innerText = lngFixed;

        // Update Google Maps Link
        const btnGMap = document.getElementById('btnOpenGoogleMaps');
        if (btnGMap) {
            btnGMap.href = `https://www.google.com/maps?q=${latFixed},${lngFixed}`;
        }

        // Update badge
        const badge = document.getElementById('pinSaveStatusBadge');
        if (badge) {
            badge.classList.remove('hidden');
            badge.innerText = "📍 Pin Moved";
            badge.className = "px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-sans font-bold";
        }
    },

    savePinnedLocation() {
        try {
            const [lat, lng] = this.currentCoords;
            localStorage.setItem('bds_pinned_warehouse_loc', JSON.stringify({
                lat: Number(lat),
                lng: Number(lng),
                updatedAt: new Date().toISOString()
            }));

            const badge = document.getElementById('pinSaveStatusBadge');
            if (badge) {
                badge.classList.remove('hidden');
                badge.innerText = "✓ Saved";
                badge.className = "px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans font-bold";
            }

            if (window.App && App.showToast) {
                App.showToast("Warehouse ki exact location mehfooz ho gayi hai!");
            } else {
                alert("✓ Warehouse ki exact location mehfooz ho gayi hai!\n\nCoordinates: " + lat.toFixed(5) + ", " + lng.toFixed(5));
            }
        } catch (e) {
            console.error("Save error:", e);
        }
    },

    resetToDefault() {
        this.currentCoords = [...this.defaultCoords];
        localStorage.removeItem('bds_pinned_warehouse_loc');

        if (this.marker) {
            this.marker.setLatLng(this.defaultCoords);
        }
        if (this.map) {
            this.map.flyTo(this.defaultCoords, 15);
        }

        this.updateCoordinates(this.defaultCoords[0], this.defaultCoords[1]);
        const badge = document.getElementById('pinSaveStatusBadge');
        if (badge) {
            badge.classList.remove('hidden');
            badge.innerText = "Default Reset";
            badge.className = "px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-sans font-bold";
        }
    },

    shareWhatsAppLocation() {
        const [lat, lng] = this.currentCoords;
        const msg = encodeURIComponent(
            `*Bilal Decor Studio - Warehouse & Workshop Location*\n` +
            `📍 Chungi Amer Sidhu, Ferozepur Road, Lahore\n` +
            `📞 Phone: 0300-456043\n` +
            `🗺️ Google Maps Directions: https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    },

    sendDirectWhatsApp() {
        const name = document.getElementById('inqName')?.value || 'Guest Customer';
        const phone = document.getElementById('inqPhone')?.value || '-';
        const city = document.getElementById('inqCity')?.value || '-';
        const marquee = document.getElementById('inqMarquee')?.value || '-';
        const message = document.getElementById('inqMessage')?.value || 'Assalam-o-Alaikum, mujhe decoration fabric rates chahiyein.';

        const text = encodeURIComponent(
            `*Bilal Decor Studio - New Inquiry*\n` +
            `👤 Naam: ${name}\n` +
            `📞 Phone: ${phone}\n` +
            `📍 Shehar: ${city}\n` +
            `🏛️ Marquee: ${marquee}\n` +
            `📝 Paigham: ${message}`
        );

        window.open(`https://wa.me/92300456043?text=${text}`, '_blank');
    },

    handleInquirySubmit(e) {
        e.preventDefault();
        const name = document.getElementById('inqName').value;
        const phone = document.getElementById('inqPhone').value;
        const city = document.getElementById('inqCity').value;
        const marquee = document.getElementById('inqMarquee')?.value || '-';
        const message = document.getElementById('inqMessage').value;

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
            App.showToast("Shukriya! Aap ki inquiry darj ho chuki hai. Hamari team jald rabta karegi.");
        } else {
            alert("Shukriya " + name + "! Aap ki inquiry darj ho chuki hai. Hamari team foran rabta karegi.");
        }

        e.target.reset();
    }
};

window.ContactMap = ContactMap;
