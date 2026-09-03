const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwtvbez6xm5RxA6gxoDV_m-IIQJa_dgQcUV9QASA-9EH0ViIoSeE5RMadyCMomsAD2P/exec";

let bikeData = []; // ประกาศตัวแปรเก็บข้อมูลรถทั้งหมด
let currentSelectedBike = null; 
let pendingRentalData = null; 
let currentUser = null; // เก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่ (ต้องล็อกอินก่อนถึงจะจองรถได้)

// โหลดสถานะการล็อกอินที่ค้างไว้จาก sessionStorage (ถ้ามี ผู้ใช้จะไม่ต้องล็อกอินซ้ำเมื่อรีเฟรชหน้า)
(function restoreSession() {
    const saved = sessionStorage.getItem('twentyUser');
    if (saved) currentUser = saved;
})();

// ฟังก์ชันโหลดข้อมูลจาก Google Sheets
async function loadBikesFromSheet() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if (data && data.length > 0) {
            bikeData = data;
        } else {
            bikeData = typeof defaultBikeData !== 'undefined' ? defaultBikeData : [];
        }
        
        displayBikes(bikeData);
    } catch (error) {
        console.error("ไม่สามารถดึงข้อมูลจาก Google Sheets ได้:", error);
        bikeData = typeof defaultBikeData !== 'undefined' ? defaultBikeData : []; 
        displayBikes(bikeData);
    }
}

loadBikesFromSheet();

// ดึง Elements จาก DOM
const bikeGrid = document.getElementById('bikeGrid');
const bikeCount = document.getElementById('bikeCount');
const brandFilter = document.getElementById('brandFilter');
const priceFilter = document.getElementById('priceFilter');
const resetBtn = document.getElementById('resetBtn');

const detailModal = document.getElementById('detailModal');
const modalImg = document.getElementById('modalImg');
const modalBrand = document.getElementById('modalBrand');
const modalName = document.getElementById('modalName');
const modalStatus = document.getElementById('modalStatus');
const modalYear = document.getElementById('modalYear');
const modalEngine = document.getElementById('modalEngine');
const modalHP = document.getElementById('modalHP');
const modalTorque = document.getElementById('modalTorque');
const modalWeight = document.getElementById('modalWeight');
const modalSeat = document.getElementById('modalSeat');
const modalDecorations = document.getElementById('modalDecorations');
const modalDown = document.getElementById('modalDown');
const modalPrice = document.getElementById('modalPrice');
const rentalWeeks = document.getElementById('rentalWeeks');
const pickupLocation = document.getElementById('pickupLocation');

// ฟังก์ชันเปลี่ยนหน้าเว็บ (Routing System)
function switchPage(pageId) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.add('hidden'));

    const selectedPage = document.getElementById(`page-${pageId}`);
    if (selectedPage) selectedPage.classList.remove('hidden');

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('text-yellow-500', 'font-semibold');
        btn.classList.add('text-white');
    });

    const activeNavBtn = document.getElementById(`nav-${pageId}`);
    if (activeNavBtn) {
        activeNavBtn.classList.remove('text-white');
        activeNavBtn.classList.add('text-yellow-500', 'font-semibold');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ปรับปุ่ม "เข้าสู่ระบบ" บน nav ให้แสดงชื่อผู้ใช้เมื่อล็อกอินอยู่
function updateAuthUI() {
    const navAuthText = document.getElementById('navAuthText');
    if (!navAuthText) return;
    navAuthText.innerText = currentUser ? currentUser : 'เข้าสู่ระบบ';
}

// กดปุ่มบน nav: ถ้ายังไม่ล็อกอิน ให้ไปหน้าล็อกอิน / ถ้าล็อกอินอยู่แล้ว ให้ถามออกจากระบบ
function handleNavAuthClick() {
    if (currentUser) {
        if (confirm(`ออกจากระบบบัญชี "${currentUser}" หรือไม่?`)) {
            handleLogout();
        }
    } else {
        switchPage('login');
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('twentyUser');
    updateAuthUI();
    switchPage('home');
}

updateAuthUI(); // อัปเดต UI ตามสถานะที่โหลดมาตอนเปิดหน้าเว็บ

// เปิดแสดงรายละเอียด Modal พร้อมตั้งค่าราคาเริ่มต้น
function openDetails(bikeId) {
    if (!bikeData || bikeData.length === 0) return;

    const bike = bikeData.find(item => String(item.id).trim() === String(bikeId).trim());
    
    if (!bike) {
        alert("ไม่พบข้อมูลรถคันนี้ (ID: " + bikeId + ")");
        return;
    }

    currentSelectedBike = bike; 

    if (modalImg) modalImg.src = bike.img || '';
    if (modalBrand) modalBrand.innerText = bike.brand || '-';
    if (modalName) modalName.innerText = bike.name || '-';
    if (modalYear) modalYear.innerText = bike.year || '-';
    if (modalDown) modalDown.innerText = bike.down || '-';
    
    if (rentalWeeks) rentalWeeks.value = "4";
    calculateRentalPrice(); 
    
    if (modalDecorations) {
        modalDecorations.innerText = bike.decorations ? bike.decorations : "สภาพเดิมๆ โรงงาน";
    }

    if (modalStatus) {
        modalStatus.innerText = bike.status || 'ว่าง';
        modalStatus.className = "px-3 py-1 text-xs font-bold rounded-full text-white";
        
        if (bike.status === "ว่าง") {
            modalStatus.classList.add("bg-green-600");
        } else if (bike.status === "ไม่ว่าง") {
            modalStatus.classList.add("bg-gray-600"); 
        } else if (bike.status === "ติดจอง") {
            modalStatus.classList.add("bg-orange-500");
        } else if (bike.status === "ขายแล้ว") {
            modalStatus.classList.add("bg-red-600");
        } else {
            modalStatus.classList.add("bg-green-600");
        }
    }

    const specs = bike.specs || {};
    if (modalEngine) modalEngine.innerText = specs.cc || bike.cc || "-";
    if (modalHP) modalHP.innerText = specs.hp || bike.hp || "-";
    if (modalTorque) modalTorque.innerText = specs.torque || bike.torque || "-";
    if (modalWeight) modalWeight.innerText = specs.weight || bike.weight || "-";
    if (modalSeat) modalSeat.innerText = specs.seat || bike.seat || "-";

    if (detailModal) detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// คำนวณราคาเช่าตามจำนวนสัปดาห์
function calculateRentalPrice() {
    if (!currentSelectedBike) return;
    
    const basePrice = Number(currentSelectedBike.price) || 0; 
    const weeklyRate = basePrice > 0 ? basePrice * 0.25 : 3500; 
    const weeks = parseInt(rentalWeeks.value) || 1;
    
    let total = weeklyRate * weeks;
    if (weeks >= 4) {
        total = total * 0.9; 
    }

    if (modalPrice) {
        modalPrice.innerText = `฿${Math.round(total).toLocaleString()}`;
    }
}

function closeDetails() {
    if (detailModal) {
        detailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// พาผู้ใช้ไปหน้าติดต่อเราพร้อมเก็บข้อมูลรถไว้รอส่ง (ต้องล็อกอินก่อนเท่านั้น)
function bookBikeRental() {
    if (!currentSelectedBike) return;

    // ต้องเข้าสู่ระบบก่อนถึงจะจองรถได้
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบสมาชิกก่อนทำการจองรถ');
        closeDetails();
        switchPage('login');
        return;
    }

    const weeks = rentalWeeks.value;
    const location = pickupLocation.value;
    const priceText = modalPrice.innerText;

    pendingRentalData = {
        bikeInfo: `${currentSelectedBike.name} (ID: ${currentSelectedBike.id})`,
        weeks: weeks + " สัปดาห์",
        location: location,
        totalPrice: priceText
    };

    closeDetails();
    switchPage('contact');

    const nameField = document.getElementById('contact-name');
    if (nameField && !nameField.value) nameField.value = currentUser;

    const messageField = document.getElementById('contact-message');
    if (messageField) {
        messageField.value = `[แจ้งจองรถเช่า]\nรุ่น: ${currentSelectedBike.name}\nระยะเวลา: ${weeks} สัปดาห์\nจุดรับรถ: ${location}\nราคารวม: ${priceText}`;
    }
}

function displayBikes(bikes) {
    if (!bikeGrid) return;
    bikeGrid.innerHTML = '';
    if (bikeCount) bikeCount.innerText = bikes.length;

    if (bikes.length === 0) {
        bikeGrid.innerHTML = `<p class="text-gray-400 col-span-full text-center py-12">❌ ไม่พบรถรุ่นที่ตรงกับเงื่อนไขของคุณ หรือยังไม่ได้ใส่ข้อมูลใน Google Sheets</p>`;
        return;
    }

    bikes.forEach(bike => {
        const card = document.createElement('div');
        card.className = "bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg hover:border-yellow-500 transition duration-300 flex flex-col justify-between";
        
        let statusColor = "bg-green-600";
        if (bike.status === "ติดจอง") statusColor = "bg-orange-500";
        if (bike.status === "ขายแล้ว") statusColor = "bg-red-600";

        const priceDisplay = !isNaN(Number(bike.price)) ? Number(bike.price).toLocaleString() : '0';

        card.innerHTML = `
            <div class="relative cursor-pointer" onclick="openDetails('${bike.id}')">
                <img src="${bike.img}" alt="${bike.name}" class="w-full h-48 object-cover">
                <span class="absolute top-3 left-3 ${statusColor} text-xs font-bold px-3 py-1 rounded-full text-white">${bike.status || 'ว่าง'}</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <span class="text-xs text-yellow-500 font-bold uppercase tracking-wide">${bike.brand} · ปี ${bike.year}</span>
                    <h3 class="text-base font-bold mt-1 text-white line-clamp-2 cursor-pointer hover:text-yellow-400 transition" onclick="openDetails('${bike.id}')">${bike.name}</h3>
                    <div class="mt-2"><span class="text-xs text-gray-400">เงินประกัน/ดาวน์: <span class="text-white font-semibold">${bike.down}</span></span></div>
                </div>
                <div class="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <span class="text-lg font-black text-yellow-500">฿${priceDisplay} <span class="text-xs text-gray-400 font-normal">/เริ่มต้น</span></span>
                    <button onclick="openDetails('${bike.id}')" class="bg-yellow-500 text-black text-xs font-bold px-4 py-2 rounded hover:bg-yellow-400 transition">เลือกเช่า/ดูเพิ่ม</button>
                </div>
            </div>
        `;
        bikeGrid.appendChild(card);
    });
}

function filterBikes() {
    const selectedBrand = brandFilter.value;
    const selectedPrice = priceFilter.value;

    const filtered = bikeData.filter(bike => {
        let matchBrand = selectedBrand === 'all' || bike.brand.toLowerCase() === selectedBrand.toLowerCase();
        let matchPrice = true;
        if (selectedPrice === 'under200k') matchPrice = Number(bike.price) <= 200000;
        if (selectedPrice === 'over200k') matchPrice = Number(bike.price) > 200000;
        return matchBrand && matchPrice;
    });
    displayBikes(filtered);
}

if (brandFilter) brandFilter.addEventListener('change', filterBikes);
if (priceFilter) priceFilter.addEventListener('change', filterBikes);
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (brandFilter) brandFilter.value = 'all';
        if (priceFilter) priceFilter.value = 'all';
        displayBikes(bikeData);
    });
}

// ================= ฟังก์ชันส่งข้อมูลติดต่อเข้า Google Sheets =================
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const message = document.getElementById('contact-message').value;

    let formData = {};

    if (pendingRentalData && !currentUser) {
        alert('เซสชันเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่ก่อนยืนยันการจอง');
        pendingRentalData = null;
        switchPage('login');
        return;
    }

    if (pendingRentalData) {
        formData = {
            action: "rental",
            customerName: name,
            phone: phone,
            bikeInfo: pendingRentalData.bikeInfo,
            weeks: pendingRentalData.weeks,
            location: pendingRentalData.location,
            totalPrice: pendingRentalData.totalPrice
        };
        pendingRentalData = null; 
    } else {
        formData = {
            action: "contact",
            name: name,
            phone: phone,
            message: message
        };
    }

    alert('⏳ กำลังส่งข้อมูล กรุณารอสักครู่...');

    // หมายเหตุ: ใช้ Content-Type: text/plain เพื่อเลี่ยง CORS preflight ที่ Apps Script รับไม่ได้
    // และไม่ใช้ mode: 'no-cors' เพื่อให้เห็น response จริงจาก server (debug ง่ายขึ้น)
    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Server response:', result);
        if (result.result === 'success') {
            alert('✅ ส่งข้อมูลสำเร็จแล้ว!');
            document.getElementById('contactForm').reset();
        } else {
            alert('❌ เกิดข้อผิดพลาดจาก server: ' + (result.message || 'ไม่ทราบสาเหตุ'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message);
    });
}

// ================= ฟังก์ชันสมัครสมาชิกเข้า Google Sheets =================
function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert("❌ รหัสผ่านไม่ตรงกัน");
        return;
    }

    const formData = {
        action: "register",
        username: username,
        email: email,
        password: password
    };

    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Server response:', result);
        if (result.result === 'success') {
            alert(`🎉 สมัครสมาชิกสำเร็จ! ยินดีต้อนรับคุณ ${username}`);
            document.getElementById('registerForm').reset();
            switchPage('login');
        } else {
            alert('❌ เกิดข้อผิดพลาดจาก server: ' + (result.message || 'ไม่ทราบสาเหตุ'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + error.message);
    });
}

// ================= ฟังก์ชันเข้าสู่ระบบ (ตรวจสอบจริงกับ Google Sheet) =================
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const formData = {
        action: "login",
        username: username,
        password: password
    };

    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Server response:', result);
        if (result.result === 'success') {
            currentUser = result.username || username;
            sessionStorage.setItem('twentyUser', currentUser);
            updateAuthUI();
            document.getElementById('loginForm').reset();
            alert(`✅ เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับคุณ ${currentUser}`);
            switchPage('home');
        } else {
            alert('❌ ' + (result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message);
    });
}
