#!/usr/bin/env python3
"""Menggambar ruang kantor isometrik pixel-art untuk RIZPRAM HQ.

Output: public/office-iso.png (480x220, digambar 1:1, ditampilkan ~2x di kanvas)
Koordinat tile di DESKS harus sama dengan yang dipakai app/OfficeCanvas.js.
Jalankan ulang:  python3 tools/make-office.py
"""
from PIL import Image, ImageDraw

W, H = 356, 226
TW, TH = 34, 16          # lebar & tinggi satu tile isometrik
GX, GY = 13, 7           # jumlah tile
OX, OY = 123, 48         # titik asal grid
WALL = 42                # tinggi dinding

C = {
    "floor_a": (34, 45, 66), "floor_b": (29, 39, 58), "floor_ln": (25, 34, 51),
    "rug": (52, 44, 74), "rug_ln": (44, 37, 64),
    "wall_l": (18, 26, 40), "wall_r": (23, 32, 48), "wall_top": (38, 50, 74),
    "glass": (30, 56, 94), "glass_hi": (70, 118, 180), "lamp": (255, 214, 140),
    "desk_t": (96, 120, 158), "desk_l": (38, 50, 74), "desk_r": (58, 76, 110),
    "mon_b": (16, 23, 36), "mon_s": (74, 163, 255), "mon_s2": (120, 200, 255),
    "chair": (52, 68, 98), "chair_t": (76, 96, 132),
    "plant": (47, 107, 74), "plant_hi": (70, 146, 102), "pot": (62, 48, 40),
    "sofa": (62, 78, 112), "sofa_t": (88, 108, 148),
    "line": (11, 16, 26),
}


def pt(tx, ty, z=0):
    """Titik sudut grid (bukan tengah tile) di layar."""
    return (OX + (tx - ty) * (TW // 2), OY + (tx + ty) * (TH // 2) - z)


def mid(tx, ty, z=0):
    """Titik tengah tile."""
    return pt(tx + 0.5, ty + 0.5, z)


def floor_tile(d, tx, ty, fill, ln):
    d.polygon([pt(tx, ty), pt(tx + 1, ty), pt(tx + 1, ty + 1), pt(tx, ty + 1)],
              fill=fill, outline=ln)


def shadow(d, tx, ty, w, dp):
    d.polygon([pt(tx - .15, ty - .15), pt(tx + w + .15, ty - .15),
               pt(tx + w + .15, ty + dp + .15), pt(tx - .15, ty + dp + .15)],
              fill=(14, 20, 31))


def box(d, tx, ty, w, dp, h, top, left, right):
    """Kotak isometrik: alas dari (tx,ty) seluas w x dp tile, tinggi h piksel."""
    shadow(d, tx, ty, w, dp)
    a, b = pt(tx, ty, h), pt(tx + w, ty, h)
    c, e = pt(tx + w, ty + dp, h), pt(tx, ty + dp, h)
    cb, eb = pt(tx + w, ty + dp), pt(tx, ty + dp)
    bb = pt(tx + w, ty)
    d.polygon([e, c, cb, eb], fill=left)      # sisi menghadap kiri-bawah
    d.polygon([b, c, cb, bb], fill=right)     # sisi menghadap kanan-bawah
    d.polygon([a, b, c, e], fill=top)         # permukaan atas
    d.line([a, b, c, e, a], fill=C["line"])


def monitor(d, tx, ty, h):
    x, y = mid(tx, ty, h)
    d.rectangle([x - 8, y - 15, x + 8, y - 4], fill=C["mon_b"])
    d.rectangle([x - 7, y - 14, x + 7, y - 5], fill=C["mon_s"])
    d.rectangle([x - 7, y - 14, x + 7, y - 11], fill=C["mon_s2"])
    d.rectangle([x - 2, y - 4, x + 2, y - 1], fill=C["mon_b"])


def chair(d, tx, ty):
    x, y = mid(tx, ty)
    d.polygon([(x - 7, y + 4), (x + 7, y + 4), (x + 5, y + 8), (x - 5, y + 8)], fill=(14, 20, 31))
    d.rectangle([x - 6, y - 17, x + 6, y - 4], fill=C["chair"])
    d.rectangle([x - 6, y - 17, x + 6, y - 15], fill=C["chair_t"])
    d.line([(x - 6, y - 17), (x + 6, y - 17), (x + 6, y - 4), (x - 6, y - 4), (x - 6, y - 17)],
           fill=C["line"])
    d.polygon([(x, y - 6), (x + 9, y - 1), (x, y + 4), (x - 9, y - 1)], fill=C["chair_t"])
    d.line([(x, y - 6), (x + 9, y - 1), (x, y + 4), (x - 9, y - 1), (x, y - 6)], fill=C["line"])


def plant(d, tx, ty):
    x, y = mid(tx, ty)
    d.polygon([(x - 5, y - 2), (x + 5, y - 2), (x + 3, y + 7), (x - 3, y + 7)], fill=C["pot"])
    d.ellipse([x - 9, y - 20, x + 9, y - 1], fill=C["plant"])
    d.ellipse([x - 6, y - 18, x + 1, y - 8], fill=C["plant_hi"])


def desk(d, tx, ty, chair_side="S"):
    """Meja 2x1 tile + monitor + kursi di sisi tertentu."""
    box(d, tx, ty, 2, 1, 11, C["desk_t"], C["desk_l"], C["desk_r"])
    monitor(d, tx + 0.5, ty, 11)
    if chair_side == "S":
        chair(d, tx + 0.5, ty + 1)
    elif chair_side == "W":
        chair(d, tx - 0.6, ty + 0.2)
    else:
        chair(d, tx + 2.1, ty + 0.2)


def main():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # ---------- dinding ----------
    # dinding kiri-belakang (bidang tx = 0)
    a, b = pt(0, 0, WALL), pt(0, GY, WALL)
    d.polygon([a, b, pt(0, GY), pt(0, 0)], fill=C["wall_l"])
    d.polygon([a, b, (b[0], b[1] + 4), (a[0], a[1] + 4)], fill=C["wall_top"])
    # dinding kanan-belakang (bidang ty = 0)
    a2, b2 = pt(0, 0, WALL), pt(GX, 0, WALL)
    d.polygon([a2, b2, pt(GX, 0), pt(0, 0)], fill=C["wall_r"])
    d.polygon([a2, b2, (b2[0], b2[1] + 4), (a2[0], a2[1] + 4)], fill=C["wall_top"])

    # jendela kota di dinding kanan
    for i in range(4):
        t = 1.2 + i * 2.9
        p = pt(t, 0, WALL - 8)
        q = pt(t + 2.1, 0, WALL - 8)
        d.polygon([p, q, (q[0], q[1] + 22), (p[0], p[1] + 22)], fill=C["glass"])
        for k in range(5):
            lx = p[0] + 5 + k * 7
            ly = p[1] + 4 + k * 3 + (k % 2) * 5
            d.rectangle([lx, ly, lx + 3, ly + 4], fill=C["glass_hi"])
    # jendela dinding kiri
    for i in range(3):
        t = 0.8 + i * 2.2
        p = pt(0, t, WALL - 8)
        q = pt(0, t + 1.6, WALL - 8)
        d.polygon([p, q, (q[0], q[1] + 22), (p[0], p[1] + 22)], fill=C["glass"])
    # lampu gantung
    for lx, ly in [(3, 1), (8, 1), (5, 4)]:
        x, y = mid(lx, ly, WALL - 6)
        d.line([(x, y - 14), (x, y)], fill=(40, 52, 74))
        d.ellipse([x - 7, y - 2, x + 7, y + 4], fill=C["lamp"])

    # ---------- lantai ----------
    for ty in range(GY):
        for tx in range(GX):
            floor_tile(d, tx, ty, C["floor_a"] if (tx + ty) % 2 == 0 else C["floor_b"], C["floor_ln"])
    for ty in range(3, 5):
        for tx in range(4, 8):
            floor_tile(d, tx, ty, C["rug"], C["rug_ln"])

    # ---------- perabot, digambar dari belakang ke depan ----------
    # 8 meja untuk 8 agent + area meeting (meja approval), sofa, pojok kopi
    items = [
        (1, 0, "desk", "S"), (5, 0, "desk", "S"), (9, 0, "desk", "S"),
        (3, 0, "plant", None), (7, 0, "plant", None),
        (12, 0, "coffee", None),
        (0, 1, "plant", None),
        (11, 2, "desk", "W"),
        (4, 2, "sofa", None),
        (1, 3, "desk", "S"),
        (7, 3, "desk", "S"),
        (12, 3, "plant", None),
        (1, 5, "desk", "S"),
        (5, 5, "desk", "S"),
        (9, 5, "meeting", None),
        (0, 6, "plant", None),
    ]
    items.sort(key=lambda it: it[0] + it[1])
    for tx, ty, kind, side in items:
        if kind == "desk":
            desk(d, tx, ty, side)
        elif kind == "plant":
            plant(d, tx, ty)
        elif kind == "sofa":
            box(d, tx, ty, 2, 1, 8, C["sofa_t"], C["sofa"], C["sofa"])
            box(d, tx, ty, 2, 0.35, 15, C["sofa_t"], C["sofa"], C["sofa"])
        elif kind == "meeting":
            box(d, tx, ty, 3, 2, 10, C["desk_t"], C["desk_l"], C["desk_r"])
            for i in range(3):
                chair(d, tx + 0.5 + i, ty + 2)
            chair(d, tx - 0.6, ty + 0.6)
        elif kind == "coffee":
            box(d, tx, ty, 1, 1, 13, C["desk_t"], C["desk_l"], C["desk_r"])
            x, y = mid(tx, ty, 13)
            d.rectangle([x - 4, y - 12, x + 4, y - 3], fill=(96, 74, 60))
            d.rectangle([x - 3, y - 11, x + 3, y - 8], fill=(214, 160, 116))

    img.save("public/office-iso.png")
    print(f"public/office-iso.png {W}x{H} grid {GX}x{GY} tile {TW}x{TH} origin {OX},{OY}")


if __name__ == "__main__":
    main()
