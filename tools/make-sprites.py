#!/usr/bin/env python3
"""Membuat sprite sheet pixel-art untuk 8 agent RIZPRAM HQ.

Output: public/agents.png  — 8 baris (agent) x 4 kolom (frame jalan), tiap sel 22x30.
Urutan baris harus sama dengan ORDER di app/OfficeCanvas.js.
Jalankan ulang:  python3 tools/make-sprites.py
"""
from PIL import Image, ImageDraw

W, H = 22, 30
FRAMES = 4

# nama, kulit, rambut, baju, celana, aksen (topi/kacamata/None)
AGENTS = [
    ("MAYA",  (240, 200, 172), (58, 42, 38),  (110, 168, 255), (44, 54, 74),  "bun"),
    ("NOVA",  (232, 188, 158), (34, 34, 42),  (37, 135, 255),  (36, 44, 62),  None),
    ("KAI",   (246, 210, 184), (168, 92, 220), (199, 125, 255), (48, 40, 66),  None),
    ("BEAT",  (214, 164, 126), (40, 32, 30),   (255, 143, 107), (40, 44, 58),  "cap"),
    ("DEX",   (238, 196, 166), (46, 38, 34),   (71, 214, 160),  (40, 48, 60),  "hood"),
    ("SCOUT", (226, 180, 146), (52, 40, 32),   (95, 208, 230),  (42, 50, 66),  "specs"),
    ("MONEY", (244, 206, 178), (62, 46, 36),   (255, 200, 97),  (46, 48, 62),  None),
    ("ECHO",  (236, 192, 164), (72, 44, 52),   (255, 127, 176), (44, 42, 60),  "long"),
]


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)


def draw_agent(d, ox, oy, skin, hair, shirt, pants, accent, frame):
    """Gambar satu karakter. frame 0..3 = siklus jalan."""
    # 0 & 2 = kaki rapat, 1 = kaki kiri melangkah, 3 = kaki kanan melangkah
    swing = [0, 1, 0, -1][frame]
    bob = [0, -1, 0, -1][frame]  # badan naik saat melangkah

    x, y = ox, oy + bob

    # --- kaki: melangkah = satu kaki maju-pendek, satu mundur-panjang ---
    if swing == 0:
        legs = [(7, 5, 0), (12, 5, 0)]
    elif swing > 0:
        legs = [(5, 3, 0), (13, 6, 1)]   # kiri maju & terangkat, kanan menjejak
    else:
        legs = [(6, 6, 1), (14, 3, 0)]   # kebalikannya
    for lx, ln, planted in legs:
        d.rectangle([x + lx, y + 22, x + lx + 2, y + 21 + ln], fill=pants)
        sx = lx - 1 if planted else lx
        d.rectangle([x + sx, y + 21 + ln, x + sx + 3, y + 22 + ln], fill=(26, 28, 36))

    # --- badan ---
    d.rectangle([x + 6, y + 13, x + 15, y + 22], fill=shirt)
    d.rectangle([x + 6, y + 13, x + 15, y + 14], fill=shade(shirt, 1.18))  # bahu terang
    d.rectangle([x + 6, y + 20, x + 15, y + 22], fill=shade(shirt, 0.82))  # bawah gelap

    # --- lengan (berlawanan dengan kaki) ---
    lo = -1 if swing < 0 else (2 if swing > 0 else 0)
    ro = -1 if swing > 0 else (2 if swing < 0 else 0)
    lx, rx = 4 + (1 if swing > 0 else 0), 16 - (1 if swing < 0 else 0)
    d.rectangle([x + lx, y + 15 + lo, x + lx + 1, y + 20 + lo], fill=shade(shirt, 0.86))
    d.rectangle([x + rx, y + 15 + ro, x + rx + 1, y + 20 + ro], fill=shade(shirt, 0.86))
    d.rectangle([x + lx, y + 20 + lo, x + lx + 1, y + 21 + lo], fill=skin)
    d.rectangle([x + rx, y + 20 + ro, x + rx + 1, y + 21 + ro], fill=skin)

    # --- leher & kepala ---
    d.rectangle([x + 10, y + 11, x + 12, y + 13], fill=shade(skin, 0.88))
    d.rectangle([x + 7, y + 3, x + 15, y + 12], fill=skin)
    d.rectangle([x + 7, y + 11, x + 15, y + 12], fill=shade(skin, 0.9))  # dagu

    # --- rambut ---
    if accent == "long":
        d.rectangle([x + 6, y + 2, x + 16, y + 8], fill=hair)
        d.rectangle([x + 5, y + 5, x + 6, y + 16], fill=hair)
        d.rectangle([x + 16, y + 5, x + 17, y + 16], fill=hair)
    elif accent == "bun":
        d.rectangle([x + 7, y + 2, x + 15, y + 7], fill=hair)
        d.rectangle([x + 8, y + 0, x + 14, y + 3], fill=hair)
        d.rectangle([x + 9, y - 2, x + 13, y + 1], fill=shade(hair, 1.25))
    elif accent == "cap":
        d.rectangle([x + 6, y + 1, x + 16, y + 5], fill=shade(shirt, 0.7))
        d.rectangle([x + 5, y + 5, x + 17, y + 6], fill=shade(shirt, 0.55))
    elif accent == "hood":
        d.rectangle([x + 7, y + 3, x + 15, y + 7], fill=hair)
        d.rectangle([x + 4, y + 1, x + 18, y + 6], fill=shade(shirt, 0.62))   # tudung belakang
        d.rectangle([x + 6, y + 4, x + 16, y + 7], fill=skin)                  # wajah terbuka
        d.rectangle([x + 4, y + 12, x + 18, y + 16], fill=shade(shirt, 0.72))  # tudung bahu
    else:
        d.rectangle([x + 7, y + 2, x + 15, y + 7], fill=hair)
        d.rectangle([x + 6, y + 4, x + 7, y + 9], fill=hair)
        d.rectangle([x + 15, y + 4, x + 16, y + 9], fill=hair)

    # --- wajah ---
    d.rectangle([x + 9, y + 8, x + 10, y + 9], fill=(28, 30, 40))
    d.rectangle([x + 12, y + 8, x + 13, y + 9], fill=(28, 30, 40))
    if accent == "specs":
        d.rectangle([x + 8, y + 7, x + 11, y + 10], outline=(224, 236, 255))
        d.rectangle([x + 11, y + 7, x + 14, y + 10], outline=(224, 236, 255))


def main():
    sheet = Image.new("RGBA", (W * FRAMES, H * len(AGENTS)), (0, 0, 0, 0))
    d = ImageDraw.Draw(sheet)
    for row, (name, skin, hair, shirt, pants, accent) in enumerate(AGENTS):
        for f in range(FRAMES):
            draw_agent(d, f * W, row * H, skin, hair, shirt, pants, accent, f)
    sheet.save("public/agents.png")
    print(f"public/agents.png  {sheet.width}x{sheet.height}  "
          f"({len(AGENTS)} agent x {FRAMES} frame, sel {W}x{H})")
    print("urutan baris:", ", ".join(a[0] for a in AGENTS))


if __name__ == "__main__":
    main()
