/**
 * Bilal Decor Studio - Core Data Store (Roman Urdu & English)
 * B2B Marquee Ceilings, Drapery & Stage Decor Manufacturer
 */

const STORAGE_KEYS = {
    PRODUCTS: 'bds_products_v2',
    ORDERS: 'bds_orders_v2',
    CLIENT_HISTORY: 'bds_client_history_v2',
    SETTINGS: 'bds_settings_v2',
    REVIEWS: 'bds_reviews_v2',
    ADMIN_SESSION: 'bds_admin_session_v2',
    CART: 'bds_cart_v2'
};

const defaultSettings = {
    businessName: "Bilal Decor Studio",
    tagline: "Premium Marquee Ceiling, Chadrein aur Decoration Manufacturer - Wholesale B2B Rates",
    whatsappNumber: "923001234567",
    phoneDisplay: "0300-1234567",
    email: "info@bilaldecorstudio.com",
    address: "Circular Road / Marquee Market Hub, Lahore & Gujranwala, Pakistan",
    jazzcash: {
        number: "0300-1234567",
        title: "Bilal Decor Studio"
    },
    easypaisa: {
        number: "0345-1234567",
        title: "Bilal Decor Studio"
    },
    bank: {
        bankName: "Meezan Bank Ltd",
        title: "Bilal Decor Studio",
        accountNo: "0102-0108928371",
        iban: "PK36MEZN0001020108928371"
    },
    headerVideos: {
        video1: {
            title: "Shahi Stage Chadar - Live Event Look",
            url: "https://www.youtube.com/embed/ScMzIvxBSi4",
            source: "embed"
        },
        video2: {
            title: "Grand Hall Ceiling aur Rahdari Fall Drapery",
            url: "https://www.youtube.com/embed/EngW7tLk6R8",
            source: "embed"
        }
    }
};

const initialProducts = [
    {
        id: "prod-1",
        title: "Royal Mughal Gold Velvet Stage Chadar",
        titleRoman: "Shahi Mughal Gold Velvet Stage Chadar",
        category: "stage",
        categoryName: "Stage Chadar (Stage Ceiling)",
        ratePerSqFt: 65,
        minSqFt: 250,
        defaultLength: 40,
        defaultWidth: 25,
        description: "Premium imported heavy golden velvet fabric, haath ki bareek nafees pleats aur shandar stage fall ke sath. Ye chadar stage par royal aur khushnuma look banati hai. Washable aur wrinkle-free.",
        badge: "Sab Se Zyada Maqbool (Bestseller)",
        rating: 4.9,
        reviewCount: 38,
        inStock: true,
        fabricType: "Imported Korean Royal Velvet",
        images: [
            "assets/images/royal_gold_ceiling.jpg",
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
        features: [
            "Bareek aur mazboot interlock double silai",
            "Har 3 feet par mazboot lohay ke hook / rings baraye asan hanging",
            "Aag se mehfooz (Fire Retardant) option dastiyab",
            "Lighting aur jhoomer ke liye special weight-bearing points"
        ]
    },
    {
        id: "prod-2",
        title: "Emerald Green & Champagne Pleated Hall Ceiling",
        titleRoman: "Zamurradi aur Champagne Dual Tone Hall Ceiling",
        category: "hall",
        categoryName: "Hall Ceiling (Main Hall)",
        ratePerSqFt: 55,
        minSqFt: 500,
        defaultLength: 60,
        defaultWidth: 40,
        description: "Bare marquee halls ke liye dual-tone champagne silk aur royal emerald green fabric ka behtareen jor. Hall ko shandar height aur kushadgi deta hai. Decorators ki pehli pasand.",
        badge: "Premium Quality",
        rating: 4.8,
        reviewCount: 29,
        inStock: true,
        fabricType: "Silk Satin + Heavy Pleated Jersey",
        images: [
            "assets/images/emerald_hall_ceiling.jpg",
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "",
        features: [
            "Dual color pleating jo hall lights me chamakti hai",
            "Tez hawa me bhi urhne se mehfooz heavy base",
            "Custom hall dimensions ke mutabiq tayyari",
            "Sath me match pillar covers dastiyab"
        ]
    },
    {
        id: "prod-3",
        title: "Crown Royal Entrance Rahdari Canopy Draping",
        titleRoman: "Shahi Dakhila aur Rahdari Canopy Chadar",
        category: "entrance",
        categoryName: "Rahdari Chadar (Entrance Corridor)",
        ratePerSqFt: 70,
        minSqFt: 300,
        defaultLength: 80,
        defaultWidth: 15,
        description: "Mehmano ke isteqbaliya aur main gate walkway ke liye lambi mehrabi pleated chadar. Dono taraf khubsurat frill aur falling waves. Grand entry par shandar impression banati hai.",
        badge: "Grand Entry Special",
        rating: 5.0,
        reviewCount: 42,
        inStock: true,
        fabricType: "Triple Pleated Chiffon & Silk",
        images: [
            "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "https://www.youtube.com/embed/EngW7tLk6R8",
        features: [
            "Rahdari ki lambai ke hisab se joint-free lambi silai",
            "Floor lights aur fairy lights hang karne ke liye loops",
            "Side curtains ke sath full matching set dastiyab",
            "Asan folding aur munasib wazan baraye cargo transport"
        ]
    },
    {
        id: "prod-4",
        title: "Ruby Crimson Bridal Velvet Stage Backdrop & Ceiling",
        titleRoman: "Surkh Makhmal Bridal Stage Chadar aur Backdrop",
        category: "stage",
        categoryName: "Stage Chadar (Stage Ceiling)",
        ratePerSqFt: 75,
        minSqFt: 250,
        defaultLength: 35,
        defaultWidth: 20,
        description: "Khas Barat aur Nikkah ki shahanah taqreebat ke liye gehri surkh makhmal, zari border aur crystal tassels ke sath. Photography aur videos me rang be-misaal nazar aate hain.",
        badge: "Bridal Favorite",
        rating: 4.9,
        reviewCount: 31,
        inStock: true,
        fabricType: "Heavy Weight Crimson Micro Velvet",
        images: [
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "",
        features: [
            "Khalis velvet kapra jis par daagh aur dhool nahi theherti",
            "Golden lace aur tassels ka royal border",
            "Markazi jhoomer lagane ke liye heavy hook",
            "Backdrop aur ceiling ka mukammal matching set"
        ]
    },
    {
        id: "prod-5",
        title: "Starry Night Crystal Chandelier Central Ceiling",
        titleRoman: "Crystal Jhoomer Central Canopy Ceiling",
        category: "hall",
        categoryName: "Hall Ceiling (Main Hall)",
        ratePerSqFt: 80,
        minSqFt: 400,
        defaultLength: 50,
        defaultWidth: 50,
        description: "Central jhoomer ke gird circular waves me phailne wali organza aur silk combination. Jab darmiyani jhoomer on hota hai to poori chat sitaron ki tarah chamakti hai.",
        badge: "Luxury Edition",
        rating: 4.8,
        reviewCount: 22,
        inStock: true,
        fabricType: "Organza Sheer + Starlight Silk",
        images: [
            "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "",
        features: [
            "Center cut-out size aapki marzi ke mutabiq banaya jaye ga",
            "100% wrinkle-free imported sheer fabric",
            "Light reflection ko 40% barhata hai",
            "Bare marquee structures ke liye ideal"
        ]
    },
    {
        id: "prod-6",
        title: "Royal Ivory & Gold Geometric Architectural Ceiling",
        titleRoman: "Royal Ivory aur Gold Geometric Chat Design",
        category: "hall",
        categoryName: "Hall Ceiling (Main Hall)",
        ratePerSqFt: 60,
        minSqFt: 400,
        defaultLength: 50,
        defaultWidth: 30,
        description: "Ivory sufaid aur golden ka behtareen combination. Riwayati aur modern marquees dono ke liye perfect. Hall ko saaf, roshan aur modern 5-star look deta hai.",
        badge: "Modern Design",
        rating: 4.7,
        reviewCount: 19,
        inStock: true,
        fabricType: "Matte Poly Silk Blend",
        images: [
            "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "",
        features: [
            "Geometric box pleats jo girte nahi hain",
            "Dhulai ke baad rang kharab nahi hota",
            "Payedar double stitch overlocking",
            "Halka wazan aur asan handling"
        ]
    },
    {
        id: "prod-7",
        title: "Grand Corridor Pleated Walkway Runner & Valance",
        titleRoman: "Grand Corridor Pleated Walkway aur Valance Set",
        category: "entrance",
        categoryName: "Rahdari Chadar (Entrance Corridor)",
        ratePerSqFt: 65,
        minSqFt: 200,
        defaultLength: 60,
        defaultWidth: 12,
        description: "Dakhila raste ki unchi chaton ke liye lahrati hui falling waves. Side bail aur khubsurat tassels ke sath jo har qadam par shahanah isteqbal ka ehsas dilati hai.",
        badge: "Rahdari Special",
        rating: 4.9,
        reviewCount: 26,
        inStock: true,
        fabricType: "Crushed Velvet + Satin Border",
        images: [
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "",
        features: [
            "12 feet se 20 feet tak ki chaurai me dastiyab",
            "Jhulne wali mehrabi fall (Swags)",
            "Theme colors ke mutabiq customization dastiyab"
        ]
    },
    {
        id: "prod-8",
        title: "Modular Fast-Install Banquet Ceiling Panels",
        titleRoman: "Modular Fast-Install Banquet Ceiling Panels",
        category: "stage",
        categoryName: "Stage Chadar (Stage Ceiling)",
        ratePerSqFt: 50,
        minSqFt: 200,
        defaultLength: 30,
        defaultWidth: 20,
        description: "Decorators ke liye special modular panels system. Sirf 15 minute me tayyar ho jata hai. Baar baar use hone ke liye mazboot aur waqt bachane wala hal.",
        badge: "Waqt Bachane Wala",
        rating: 4.8,
        reviewCount: 34,
        inStock: true,
        fabricType: "High Density Twill Poly-Fabric",
        images: [
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
        ],
        videoUrl: "",
        features: [
            "Modular panel system baraye fori tausee",
            "Kam labor aur tez raftar installation",
            "Mukhtalif sizes me ba-asani jora ja sakta hai"
        ]
    }
];

const initialReviews = [
    {
        id: "rev-1",
        productId: "prod-1",
        customerName: "Chaudhry Nadeem",
        businessName: "Crown Marquee",
        city: "Gujranwala",
        rating: 5,
        date: "14 Nov 2024",
        comment: "Bilal Decor Studio ki stage chadar ka kapra aur silai intehai lajawab hai. Ham ne 50x30 feet ki chadar mangwai thi, fixing ke baad stage ki look badal gayi. Customers ne bohat tareef ki."
    },
    {
        id: "rev-2",
        productId: "prod-1",
        customerName: "Malik Usman",
        businessName: "Grand Palace Banquet",
        city: "Lahore",
        rating: 5,
        date: "08 Nov 2024",
        comment: "Fi square feet rate market se bohat munasib tha aur quality bilkul A1. Sab se achi baat ye thi ke waqt par delivery mili. Ab hum har season ke orders yahin se banwate hain."
    },
    {
        id: "rev-3",
        productId: "prod-2",
        customerName: "Rana Rizwan",
        businessName: "Shehnai Events",
        city: "Faisalabad",
        rating: 5,
        date: "02 Nov 2024",
        comment: "Emerald aur champagne ceiling ne hall me jaan daal di. Pleats itni safai se bani hain ke light me shine karti hain. Poore Faisalabad me aisa maal nahi milta."
    },
    {
        id: "rev-4",
        productId: "prod-3",
        customerName: "Haji Mushtaq Ahmed",
        businessName: "Al-Mustafa Tent & Decor",
        city: "Rawalpindi",
        rating: 5,
        date: "28 Oct 2024",
        comment: "80 feet ki rahdari chadar baghair kisi fault ke tayyar ho kar pohanchi. Hook aur hangers bohat mazboot lage huay hain. Paisa wasool product hai."
    },
    {
        id: "rev-5",
        productId: "prod-4",
        customerName: "Sardar Farooq Khan",
        businessName: "Regal Event Complex",
        city: "Multan",
        rating: 5,
        date: "20 Oct 2024",
        comment: "Surkh makhmal ki chadar ki fall aur zari border ki nafasat kamal hai. Barat event par dulha aur dulhan ki family ne khas shukriya ada kiya."
    },
    {
        id: "rev-6",
        productId: "prod-5",
        customerName: "Babar Decorators",
        businessName: "Dream Wedding Hall",
        city: "Sialkot",
        rating: 5,
        date: "15 Oct 2024",
        comment: "Crystal jhoomer wali chadar ne hamara hall modern 5-star level par la khara kiya. Bilal bhai ka rawaiya aur guidance bohat achi rahi."
    }
];

const initialClientHistory = [
    {
        id: "hist-1",
        clientName: "Chaudhry Nadeem (Crown Marquee)",
        city: "Gujranwala",
        date: "14 Nov 2024",
        designName: "Royal Mughal Gold Stage (50 x 30 ft)",
        totalSqFt: 1500,
        rate: 65,
        totalAmount: 97500,
        phoneMasked: "0301-****482",
        clientPhone: "0301-4433482",
        status: "Mukammal aur Delivered (Installed)"
    },
    {
        id: "hist-2",
        clientName: "Malik Usman (Grand Palace Banquet)",
        city: "Lahore",
        date: "08 Nov 2024",
        designName: "Emerald & Champagne Hall Ceiling (100 x 50 ft)",
        totalSqFt: 5000,
        rate: 55,
        totalAmount: 275000,
        phoneMasked: "0321-****910",
        clientPhone: "0321-8899910",
        status: "Mukammal aur Delivered (Installed)"
    },
    {
        id: "hist-3",
        clientName: "Rana Rizwan (Shehnai Marquee)",
        city: "Faisalabad",
        date: "02 Nov 2024",
        designName: "Crown Entrance Rahdari Canopy (120 x 15 ft)",
        totalSqFt: 1800,
        rate: 70,
        totalAmount: 126000,
        phoneMasked: "0300-****553",
        clientPhone: "0300-7711553",
        status: "Mukammal aur Delivered (Installed)"
    },
    {
        id: "hist-4",
        clientName: "Haji Mushtaq Ahmed (Pearl Continental Marquee)",
        city: "Rawalpindi",
        date: "28 Oct 2024",
        designName: "Ruby Crimson Bridal Backdrop (40 x 25 ft)",
        totalSqFt: 1000,
        rate: 75,
        totalAmount: 75000,
        phoneMasked: "0333-****112",
        clientPhone: "0333-5566112",
        status: "Mukammal aur Delivered (Installed)"
    },
    {
        id: "hist-5",
        clientName: "Sardar Farooq Khan (Regal Event Complex)",
        city: "Multan",
        date: "20 Oct 2024",
        designName: "Starry Night Central Canopy (60 x 60 ft)",
        totalSqFt: 3600,
        rate: 80,
        totalAmount: 288000,
        phoneMasked: "0302-****784",
        clientPhone: "0302-9988784",
        status: "Mukammal aur Delivered (Installed)"
    },
    {
        id: "hist-6",
        clientName: "Babar Decorators (Dream Wedding Hall)",
        city: "Sialkot",
        date: "15 Oct 2024",
        designName: "Royal Ivory Floral Ceiling (70 x 35 ft)",
        totalSqFt: 2450,
        rate: 60,
        totalAmount: 147000,
        phoneMasked: "0345-****639",
        clientPhone: "0345-3344639",
        status: "Mukammal aur Delivered (Installed)"
    },
    {
        id: "hist-7",
        clientName: "Mian Zahid (Al-Jannat Marquee)",
        city: "Sargodha",
        date: "05 Oct 2024",
        designName: "Grand Corridor Pleated Runner (80 x 12 ft)",
        totalSqFt: 960,
        rate: 65,
        totalAmount: 62400,
        phoneMasked: "0306-****891",
        clientPhone: "0306-2211891",
        status: "Mukammal aur Delivered (Installed)"
    }
];

const initialOrders = [
    {
        orderId: "BDS-1092",
        passcode: "8921",
        clientName: "Mian Tariq (Royal Palm)",
        clientPhone: "0300-1238921",
        phoneMasked: "0300-****921",
        city: "Lahore",
        marqueeName: "The Royal Palm Marquee, Raiwind Road",
        items: [
            {
                productId: "prod-1",
                title: "Shahi Mughal Gold Velvet Stage Chadar",
                length: 45,
                width: 25,
                sqFt: 1125,
                rate: 65,
                quantity: 1,
                total: 73125
            }
        ],
        totalAmount: 73125,
        advancePaid: 30000,
        remainingBalance: 43125,
        paymentStatus: "Advance Paid (JazzCash Slip Verified)",
        status: "stitching",
        statusText: "Silai aur Falling check ho rahi hai (In Stitching)",
        expectedDispatch: "Kal sham 5 baje",
        cargoDetails: "M&P / Niazi Cargo Adda, Raiwind Road",
        createdAt: "2024-11-17 14:30"
    },
    {
        orderId: "BDS-1093",
        passcode: "3310",
        clientName: "Hammad Raza (Al-Raza Marquee)",
        clientPhone: "0312-9873310",
        phoneMasked: "0312-****310",
        city: "Gujranwala",
        marqueeName: "Al-Raza Marquee, GT Road",
        items: [
            {
                productId: "prod-3",
                title: "Shahi Dakhila aur Rahdari Canopy Chadar",
                length: 90,
                width: 15,
                sqFt: 1350,
                rate: 70,
                quantity: 1,
                total: 94500
            }
        ],
        totalAmount: 94500,
        advancePaid: 50000,
        remainingBalance: 44500,
        paymentStatus: "Advance Paid (Meezan Bank Transfer)",
        status: "cutting",
        statusText: "Fabric cutting mukammal, silai marhala shuru (Cutting Done)",
        expectedDispatch: "Parson subah",
        cargoDetails: "Farhan Cargo Adda, Gujranwala",
        createdAt: "2024-11-17 17:15"
    },
    {
        orderId: "BDS-1094",
        passcode: "5542",
        clientName: "Sheikh Zeeshan (Koh-i-Noor)",
        clientPhone: "0322-6655542",
        phoneMasked: "0322-****542",
        city: "Faisalabad",
        marqueeName: "Koh-i-Noor Banquet, Jaranwala Road",
        items: [
            {
                productId: "prod-2",
                title: "Zamurradi aur Champagne Dual Tone Hall Ceiling",
                length: 80,
                width: 40,
                sqFt: 3200,
                rate: 55,
                quantity: 1,
                total: 176000
            }
        ],
        totalAmount: 176000,
        advancePaid: 80000,
        remainingBalance: 96000,
        paymentStatus: "Advance Verified (Bank Transfer)",
        status: "verified",
        statusText: "Payment Tasdeeq Shuda - Maal processing mein hai",
        expectedDispatch: "3 din baad",
        cargoDetails: "Faisal Movers Cargo, Faisalabad",
        createdAt: "2024-11-18 09:40"
    },
    {
        orderId: "BDS-1095",
        passcode: "1298",
        clientName: "Zubair Ahmed (Gulshan Marquee)",
        clientPhone: "0304-4431298",
        phoneMasked: "0304-****298",
        city: "Sargodha",
        marqueeName: "Gulshan Marquee, University Road",
        items: [
            {
                productId: "prod-4",
                title: "Surkh Makhmal Bridal Stage Chadar aur Backdrop",
                length: 35,
                width: 20,
                sqFt: 700,
                rate: 75,
                quantity: 1,
                total: 52500
            }
        ],
        totalAmount: 52500,
        advancePaid: 52500,
        remainingBalance: 0,
        paymentStatus: "Mukammal Paid (EasyPaisa)",
        status: "dispatched",
        statusText: "Cargo rawana ho chuka hai - Bilty #SGD-9821",
        expectedDispatch: "Aaj sham tak delivery",
        cargoDetails: "Khan Baba Cargo Adda, Sargodha (Bilty #89210)",
        createdAt: "2024-11-16 11:20"
    }
];

class Store {
    static get(key, defaultValue) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : defaultValue;
        } catch (e) {
            console.error("Storage read error:", e);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("Storage write error:", e);
            return false;
        }
    }

    static getProducts() {
        return this.get(STORAGE_KEYS.PRODUCTS, initialProducts);
    }

    static saveProducts(products) {
        return this.set(STORAGE_KEYS.PRODUCTS, products);
    }

    static getOrders() {
        return this.get(STORAGE_KEYS.ORDERS, initialOrders);
    }

    static saveOrders(orders) {
        return this.set(STORAGE_KEYS.ORDERS, orders);
    }

    static getClientHistory() {
        return this.get(STORAGE_KEYS.CLIENT_HISTORY, initialClientHistory);
    }

    static saveClientHistory(history) {
        return this.set(STORAGE_KEYS.CLIENT_HISTORY, history);
    }

    static getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS, defaultSettings);
    }

    static saveSettings(settings) {
        return this.set(STORAGE_KEYS.SETTINGS, settings);
    }

    static getReviews() {
        return this.get(STORAGE_KEYS.REVIEWS, initialReviews);
    }

    static saveReviews(reviews) {
        return this.set(STORAGE_KEYS.REVIEWS, reviews);
    }

    static getCart() {
        return this.get(STORAGE_KEYS.CART, []);
    }

    static saveCart(cart) {
        return this.set(STORAGE_KEYS.CART, cart);
    }
}

window.Store = Store;
window.STORAGE_KEYS = STORAGE_KEYS;
