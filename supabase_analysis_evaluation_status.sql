-- Tambahan kolom status untuk menampilkan level evaluasi Angka Mati 4D: 4D, 3D, 2D, TIDAK MASUK.
-- Aman dijalankan walaupun tabel sudah ada.

alter table analysis_evaluations
add column if not exists status text;
