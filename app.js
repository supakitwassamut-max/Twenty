const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwDJ8kPLa-67Xlg9DcayHkCaOGaXRoSJafgEulXiOm1ZF8cZemKlQaSHwRm9cDrzh4N/exec";

let bikeData = [];

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

// เปิดแสดงรายละเอียด Modal
function openDetails(bikeId) {
    if (!bikeData || bikeData.length === 0) return;

    const bike = bikeData.find(item => String(item.id).trim() === String(bikeId).trim());
    
    if (!bike) {
        alert("ไม่พบข้อมูลรถคันนี้ (ID: " + bikeId + ")");
        return;
    }

    if (modalImg) modalImg.src = bike.img || '';
    if (modalBrand) modalBrand.innerText = bike.brand || '-';
    if (modalName) modalName.innerText = bike.name || '-';
    if (modalYear) modalYear.innerText = bike.year || '-';
    if (modalDown) modalDown.innerText = bike.down || '-';
    
    const priceNum = Number(bike.price);
    if (modalPrice) {
        modalPrice.innerText = !isNaN(priceNum) ? `฿${priceNum.toLocaleString()}` : `฿0`;
    }
    
    if (modalDecorations) {
        modalDecorations.innerText = bike.decorations ? bike.decorations : "สภาพเดิมๆ โรงงาน";
    }

    if (modalStatus) {
        modalStatus.innerText = bike.status || 'ว่าง';
        modalStatus.className = "px-3 py-1 text-xs font-bold rounded-full text-white";
        if (bike.status === "ว่าง") modalStatus.classList.add("bg-green-600");
        else if (bike.status === "ติดจอง") modalStatus.classList.add("bg-orange-500");
        else if (bike.status === "ขายแล้ว") modalStatus.classList.add("bg-red-600");
        else modalStatus.classList.add("bg-green-600");
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

function closeDetails() {
    if (detailModal) {
        detailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function displayBikes(bikes) {
    if (!bikeGrid) return;
    bikeGrid.innerHTML = '';
    if (bikeCount) bikeCount.innerText = bikes.length;

    if (bikes.length === 0) {
        bikeGrid.innerHTML = `<p class="text-gray-400 col-span-full text-center py-12">❌ ไม่พบรถรุ่นที่ตรงกับเงื่อนไขของคุณ</p>`;
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
                    <div class="mt-2"><span class="text-xs text-gray-400">เงินดาวน์: <span class="text-white font-semibold">${bike.down}</span></span></div>
                </div>
                <div class="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <span class="text-xl font-black text-yellow-500">฿${priceDisplay}</span>
                    <button onclick="openDetails('${bike.id}')" class="bg-yellow-500 text-black text-xs font-bold px-4 py-2 rounded hover:bg-yellow-400 transition">ดูรายละเอียด</button>
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
function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const message = document.getElementById('contact-message').value;

    const formData = {
        action: "contact",
        name: name,
        phone: phone,
        message: message
    };

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        alert('✅ ส่งข้อความสำเร็จแล้ว! เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด');
        document.getElementById('contactForm').reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาดในการส่งข้อความ');
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
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        alert(`🎉 สมัครสมาชิกสำเร็จ! ยินดีต้อนรับคุณ ${username}`);
        document.getElementById('registerForm').reset();
        switchPage('login');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาดในการสมัครสมาชิก');
    });
}

function handleLogin(event) {
    event.preventDefault();
    alert("เข้าสู่ระบบสำเร็จ!");
    switchPage('home');
}