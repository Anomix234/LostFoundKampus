let barang = JSON.parse(localStorage.getItem("campusFind")) || [
    { id: 1, nama: "iPhone 14", kategori: "Elektronik", lokasi: "Gedung Informatika", deskripsi: "iPhone warna hitam dengan casing transparan.", pelapor: "Rendra", status: "hilang", tanggal: "3 Oktober 2026", foto: "" },
    { id: 2, nama: "Tas Hitam", kategori: "Tas", lokasi: "Perpustakaan", deskripsi: "Tas ransel hitam ditemukan dekat meja baca.", pelapor: "Andi", status: "ditemukan", tanggal: "2 Oktober 2026", foto: "" }
];

let statusAktif = "semua";

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function simpan() {
    try {
        localStorage.setItem("campusFind", JSON.stringify(barang));
    } catch (e) {
        toast("⚠️ Penyimpanan penuh, coba foto yang lebih kecil.");
    }
}

function toast(pesan) {
    const t = $("toast");
    t.textContent = pesan;
    t.classList.add("show");
    clearTimeout(t.timer);
    t.timer = setTimeout(() => t.classList.remove("show"), 2500);
}

// ===== RENDER (filter status + pencarian + kategori + urutan) =====
function render() {
    const q = $("search").value.toLowerCase();
    const kat = $("filterKategori").value;
    const urut = $("urutan").value;

    let data = barang.filter(i =>
        (statusAktif === "semua" || i.status === statusAktif) &&
        (kat === "semua" || i.kategori === kat) &&
        (i.nama + i.lokasi + i.deskripsi).toLowerCase().includes(q)
    );
    if (urut === "lama") data = [...data].reverse();

    const c = $("daftarBarang");
    if (!data.length) {
        c.innerHTML = `<div class="card"><div class="card-content"><h3>😕 Tidak ada barang</h3>
            <p class="card-info">Data yang kamu cari tidak ditemukan.</p></div></div>`;
    } else {
        c.innerHTML = data.map(i => `
            <div class="card">
                ${i.foto ? `<img src="${i.foto}" class="card-image">` : `<div class="card-image"></div>`}
                <div class="card-content">
                    <span class="badge ${i.status}">${i.status === "hilang" ? "🔴 HILANG" : "🟢 DITEMUKAN"}</span>
                    <h3>${esc(i.nama)}</h3>
                    <p class="card-info">📂 ${esc(i.kategori)}</p>
                    <p class="card-info">📍 ${esc(i.lokasi)}</p>
                    <p class="card-info">📅 ${esc(i.tanggal)}</p>
                    <button class="detail-btn" onclick="lihatDetail(${i.id})">🔎 Lihat Detail</button>
                    <div class="card-actions">
                        ${i.status === "hilang"
                            ? `<button class="btn-found" onclick="tandaiDitemukan(${i.id})">✅ Tandai Ditemukan</button>`
                            : `<button class="btn-delete" onclick="hapusBarang(${i.id})">🗑️ Hapus</button>`}
                    </div>
                </div>
            </div>`).join("");
    }
    updateStatistik();
}

function updateStatistik() {
    $("totalBarang").textContent = barang.length;
    $("totalHilang").textContent = barang.filter(x => x.status === "hilang").length;
    $("totalDitemukan").textContent = barang.filter(x => x.status === "ditemukan").length;
}

function filterBarang(status) {
    statusAktif = status;
    document.querySelectorAll("nav button").forEach(b =>
        b.classList.toggle("active", b.dataset.status === status));
    render();
}

// ===== HAPUS & UBAH STATUS =====
function hapusBarang(id) {
    const item = barang.find(x => x.id === id);
    if (!item || item.status !== "ditemukan") return;
    if (!confirm(`Hapus laporan "${item.nama}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
    barang = barang.filter(x => x.id !== id);
    simpan();
    render();
    toast("🗑️ Laporan berhasil dihapus");
}

function tandaiDitemukan(id) {
    const item = barang.find(x => x.id === id);
    if (!item) return;
    item.status = "ditemukan";
    simpan();
    render();
    toast("✅ Barang ditandai sudah ditemukan");
}

// ===== FORM =====
function bukaForm() { $("modal").classList.add("active"); }
function tutupForm() { $("modal").classList.remove("active"); }

function simpanLaporan(event) {
    event.preventDefault();
    const file = $("foto").files[0];
    if (file && file.size > 2 * 1024 * 1024) {
        toast("⚠️ Ukuran foto maksimal 2 MB");
        return;
    }
    if (file) {
        const reader = new FileReader();
        reader.onload = e => buatData(e.target.result);
        reader.readAsDataURL(file);
    } else buatData("");

    function buatData(foto) {
        barang.unshift({
            id: Date.now(),
            nama: $("namaBarang").value.trim(),
            kategori: $("kategori").value,
            lokasi: $("lokasi").value.trim(),
            deskripsi: $("deskripsi").value.trim(),
            pelapor: $("pelapor").value.trim(),
            status: document.querySelector('input[name="status"]:checked').value,
            tanggal: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
            foto
        });
        simpan();
        render();
        document.querySelector("#modal form").reset();
        tutupForm();
        toast("✅ Laporan berhasil dipublikasikan!");
    }
}

// ===== DETAIL (modal) =====
function lihatDetail(id) {
    const i = barang.find(x => x.id === id);
    if (!i) return;
    $("detailBox").innerHTML = `
        <div class="modal-header"><h2>📦 ${esc(i.nama)}</h2>
            <button class="close" onclick="tutupDetail()">✕</button></div>
        <div class="detail-box">
            ${i.foto ? `<img src="${i.foto}" class="detail-img">` : ""}
            <span class="badge ${i.status}">${i.status === "hilang" ? "🔴 HILANG" : "🟢 DITEMUKAN"}</span>
            <p>📂 <b>Kategori:</b> ${esc(i.kategori)}</p>
            <p>📍 <b>Lokasi:</b> ${esc(i.lokasi)}</p>
            <p>📅 <b>Tanggal:</b> ${esc(i.tanggal)}</p>
            <p>👤 <b>Pelapor:</b> ${esc(i.pelapor)}</p>
            <p>📝 ${esc(i.deskripsi)}</p>
        </div>`;
    $("detailModal").classList.add("active");
}
function tutupDetail() { $("detailModal").classList.remove("active"); }

// ===== DARK MODE (tersimpan) =====
function toggleDarkMode() {
    const gelap = document.body.classList.toggle("dark");
    localStorage.setItem("campusFindDark", gelap ? "1" : "0");
}
if (localStorage.getItem("campusFindDark") === "1") document.body.classList.add("dark");

// Tutup modal dengan Esc / klik latar
document.addEventListener("keydown", e => { if (e.key === "Escape") { tutupForm(); tutupDetail(); } });
$("modal").addEventListener("click", e => { if (e.target === $("modal")) tutupForm(); });

render();


// =======================
// PENGATURAN TAMPILAN (background & logo)
// =======================

const DEFAULT_TAMPILAN = { warna: "", bgGambar: "", teks: "gelap", logoGambar: "", logoEmoji: "🎓", nama: "Campus Find" };
let tampilan = { ...DEFAULT_TAMPILAN, ...JSON.parse(localStorage.getItem("campusFindTampilan") || "{}") };

function simpanTampilan() {
    try {
        localStorage.setItem("campusFindTampilan", JSON.stringify(tampilan));
    } catch (e) {
        toast("⚠️ Gambar terlalu besar untuk disimpan, pakai yang lebih kecil.");
    }
}

function terapkanTampilan() {
    let st = document.getElementById("bgStyle");
    if (!st) { st = document.createElement("style"); st.id = "bgStyle"; document.head.appendChild(st); }
    st.textContent = (tampilan.warna || tampilan.bgGambar)
        ? `body, body.dark { ${tampilan.warna ? `background-color:${tampilan.warna} !important;` : ""}
            ${tampilan.bgGambar ? `background-image:url("${tampilan.bgGambar}") !important;` : ""} }`
        : "";
    document.body.classList.toggle("teks-terang", tampilan.teks === "terang");

    if ($("logoBox")) $("logoBox").innerHTML = tampilan.logoGambar
        ? `<img src="${tampilan.logoGambar}" alt="logo">`
        : esc(tampilan.logoEmoji);
    if ($("namaAppSidebar")) $("namaAppSidebar").textContent = tampilan.nama;
    if ($("namaAppTop")) $("namaAppTop").textContent = tampilan.nama;
    document.title = tampilan.nama;
}

function bacaGambar(input, maxMB, callback) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
        toast(`⚠️ Ukuran gambar maksimal ${maxMB} MB`);
        input.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = e => callback(e.target.result);
    reader.readAsDataURL(file);
}

function ubahWarna(v) { tampilan.warna = v; tampilan.bgGambar = ""; $("bgColor").value = v; terapkanTampilan(); simpanTampilan(); }
function ubahBgGambar(input) { bacaGambar(input, 2, d => { tampilan.bgGambar = d; terapkanTampilan(); simpanTampilan(); }); }
function hapusBgGambar() { tampilan.bgGambar = ""; terapkanTampilan(); simpanTampilan(); }
function ubahTeks(v) { tampilan.teks = v; terapkanTampilan(); simpanTampilan(); }
function ubahNamaApp(v) { tampilan.nama = v.trim() || "Campus Find"; terapkanTampilan(); simpanTampilan(); }
function ubahLogoEmoji(v) { tampilan.logoEmoji = v || "🎓"; tampilan.logoGambar = ""; terapkanTampilan(); simpanTampilan(); }
function ubahLogoGambar(input) { bacaGambar(input, 1, d => { tampilan.logoGambar = d; terapkanTampilan(); simpanTampilan(); }); }

function resetTampilan() {
    tampilan = { ...DEFAULT_TAMPILAN };
    localStorage.removeItem("campusFindTampilan");
    terapkanTampilan();
    isiFormPengaturan();
    toast("↺ Tampilan dikembalikan ke default");
}

function isiFormPengaturan() {
    $("bgColor").value = tampilan.warna || "#f5f7fb";
    $("teksWarna").value = tampilan.teks;
    $("namaApp").value = tampilan.nama;
    $("logoEmoji").value = tampilan.logoGambar ? "" : tampilan.logoEmoji;
}

function bukaBg() { isiFormPengaturan(); $("bgModal").classList.add("active"); }
function tutupBg() { $("bgModal").classList.remove("active"); }
document.addEventListener("keydown", e => { if (e.key === "Escape") tutupBg(); });

function bukaPengaturan() { isiFormPengaturan(); $("pengaturan").classList.add("active"); }
function tutupPengaturan() { $("pengaturan").classList.remove("active"); }
document.addEventListener("keydown", e => { if (e.key === "Escape") tutupPengaturan(); });

terapkanTampilan();