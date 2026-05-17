# UI Folder

Folder ini dipakai sebagai pusat organisasi visual app.

Saat ini file visual utama masih berada di:

```txt
src/design-system.css
```

File itu sudah menjadi single source untuk:

- Tailwind import
- Google Fonts
- theme / color tokens
- base typography
- ukuran font
- card / panel
- input / button
- dashboard cards
- result cards
- chip angka AI / BBFS
- validation rows
- bottom navigation
- login screen
- responsive mobile polish

Rencana struktur UI yang aman:

```txt
src/ui/
  README.md
  layout/
    AppShell.tsx
    PageHeader.tsx
    BottomNav.tsx
  primitives/
    Panel.tsx
    Button.tsx
    StatCard.tsx
    ResultCard.tsx
```

Catatan:
- Jangan pindahkan logic prediksi/data ke folder ini.
- Folder ini khusus visual dan layout reusable.
- `design-system.css` bisa dipindah ke `src/ui/design-system.css` nanti setelah struktur UI stabil.
