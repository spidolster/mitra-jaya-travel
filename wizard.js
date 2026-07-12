/**
 * Popup pemesanan (wizard): Pilih Layanan -> Pilih Rute -> Pilih Seat (reguler) -> Konfirmasi -> WhatsApp.
 * Data rute/harga disuntikkan dari PHP lewat wp_localize_script sebagai window.MJT_DATA
 * (lihat mjt_enqueue_assets() di functions.php).
 */
(function () {
	var D = window.MJT_DATA || {};
	var waLink = function (pesan) {
		return 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(pesan);
	};
	var WA_IC = '<svg width="17" height="17" fill="currentColor" aria-hidden="true"><use href="#ic-wa"/></svg>';

	var LAYANAN_OPSI = [
		{ id: 'bandara', ikon: '✈️', nama: 'Travel Bandara',   desk: 'Antar jemput dari / ke bandara' },
		{ id: 'reguler', ikon: '🚌', nama: 'Travel Reguler',   desk: 'Harga per kursi' },
		{ id: 'carter',  ikon: '🚐', nama: 'Carter (1 Mobil)', desk: 'Jadwal fleksibel, termasuk BBM' }
	];

	var modalEl, modalBody, pesanan = {};

	function bukaPesan(pre) {
		pesanan = Object.assign({}, pre || {});
		renderPesan();
		modalEl.hidden = false;
		document.body.style.overflow = 'hidden';
	}
	function tutupPesan() {
		modalEl.hidden = true;
		document.body.style.overflow = '';
	}

	function daftarRute(layanan) {
		if (layanan === 'reguler') {
			return (D.ruteReguler || []).map(function (r) {
				return { nama: r.rute, tol: r.tol, harga: 'mulai ' + r.seatTengahHarga };
			});
		}
		if (layanan === 'carter') {
			return (D.ruteCarter || []).map(function (r) {
				return { nama: r.rute, tol: r.tol, harga: r.harga };
			});
		}
		return (D.ruteBandara || []).map(function (r) {
			return { nama: r.tujuan, tol: false, harga: r.harga };
		});
	}

	function setJudul(judul, sub) {
		document.getElementById('modalTitle').textContent = judul;
		document.getElementById('modalSub').textContent = sub;
	}

	function renderPesan() {
		var s = pesanan;
		var html = '';
		var tombolKembali = '<button class="link-kembali" data-aksi="kembali">‹ Kembali</button>';

		if (s.layanan === undefined) {
			setJudul('Pilih Layanan', 'Mau pesan layanan yang mana?');
			html = LAYANAN_OPSI.map(function (o) {
				return '<button class="opsi" data-aksi="layanan" data-val="' + o.id + '">' +
					'<span><b>' + o.ikon + ' ' + o.nama + '</b><small>' + o.desk + '</small></span></button>';
			}).join('');

		} else if (s.rute === undefined) {
			setJudul('Pilih Rute', 'Pilih rute perjalanan Anda.');
			html = tombolKembali + daftarRute(s.layanan).map(function (r, i) {
				return '<button class="opsi" data-aksi="rute" data-val="' + i + '">' +
					'<span><b>' + r.nama + '</b>' + (r.tol ? '<small>🛣️ Termasuk Tarif Tol</small>' : '') + '</span>' +
					'<span class="opsi-harga">' + r.harga + '</span></button>';
			}).join('');

		} else if (s.layanan === 'reguler' && s.seat === undefined) {
			var r = D.ruteReguler[s.rute];
			setJudul('Pilih Tempat Duduk', r.rute);
			var seats = [
				{ nama: r.seatTengahNama, harga: r.seatTengahHarga },
				{ nama: r.seatDepanNama,  harga: r.seatDepanHarga }
			];
			html = tombolKembali + seats.map(function (st, i) {
				return '<button class="opsi" data-aksi="seat" data-val="' + i + '">' +
					'<span><b>' + st.nama + '</b></span><span class="opsi-harga">' + st.harga + '</span></button>';
			}).join('');

		} else {
			setJudul('Konfirmasi Pesanan', 'Cek dulu, lalu lanjut ke WhatsApp.');
			var namaLayanan, namaRute, detailSeat = '', harga, pesanWa;
			if (s.layanan === 'reguler') {
				var rr = D.ruteReguler[s.rute];
				var st = s.seat === 0
					? { nama: rr.seatTengahNama, harga: rr.seatTengahHarga }
					: { nama: rr.seatDepanNama,  harga: rr.seatDepanHarga };
				namaLayanan = 'Travel Reguler'; namaRute = rr.rute;
				detailSeat = '<div><span class="lbl">Tempat duduk</span><span class="val">' + st.nama + '</span></div>';
				harga = st.harga;
				pesanWa = 'Halo ' + D.namaBisnis + ', saya mau pesan Travel Reguler rute ' + rr.rute + ', ' + st.nama + '.';
			} else if (s.layanan === 'carter') {
				var rc = D.ruteCarter[s.rute];
				namaLayanan = 'Carter (1 Mobil)'; namaRute = rc.rute; harga = rc.harga;
				pesanWa = 'Halo ' + D.namaBisnis + ', saya mau pesan Carter rute ' + rc.rute + '.';
			} else {
				var rb = D.ruteBandara[s.rute];
				namaLayanan = 'Antar Jemput Bandara'; namaRute = rb.tujuan; harga = rb.harga;
				pesanWa = 'Halo ' + D.namaBisnis + ', saya mau pesan Antar Jemput Bandara tujuan ' + rb.tujuan + '.';
			}
			html = tombolKembali +
				'<div class="ringkas">' +
				'<div><span class="lbl">Layanan</span><span class="val">' + namaLayanan + '</span></div>' +
				'<div><span class="lbl">Rute</span><span class="val">' + namaRute + '</span></div>' +
				detailSeat +
				'<div><span class="lbl">Harga</span><span class="val harga-final">' + harga + '</span></div>' +
				'</div>' +
				'<a class="btn btn-wa btn-pesan" href="' + waLink(pesanWa) + '" target="_blank" rel="noopener">' + WA_IC + ' Lanjut ke WhatsApp</a>';
		}
		modalBody.innerHTML = html;
	}

	document.addEventListener('DOMContentLoaded', function () {
		modalEl = document.getElementById('pesanModal');
		modalBody = document.getElementById('modalBody');
		if (!modalEl || !modalBody) return;

		window.bukaPesan = bukaPesan;
		window.tutupPesan = tutupPesan;

		document.getElementById('modalClose').addEventListener('click', tutupPesan);
		modalEl.addEventListener('click', function (e) { if (e.target === modalEl) tutupPesan(); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modalEl.hidden) tutupPesan(); });

		modalBody.addEventListener('click', function (e) {
			var b = e.target.closest('[data-aksi]');
			if (!b) return;
			var aksi = b.dataset.aksi, val = b.dataset.val;
			if (aksi === 'layanan') pesanan.layanan = val;
			else if (aksi === 'rute') pesanan.rute = Number(val);
			else if (aksi === 'seat') pesanan.seat = Number(val);
			else if (aksi === 'kembali') {
				if (pesanan.seat !== undefined) delete pesanan.seat;
				else if (pesanan.rute !== undefined) delete pesanan.rute;
				else delete pesanan.layanan;
			}
			renderPesan();
		});
	});
})();
