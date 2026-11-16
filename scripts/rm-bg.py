from PIL import Image

img = Image.open("public/rb-logo.png").convert("RGBA")
px = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        m = min(r, g, b)
        if m > 218:
            alpha = max(0, 255 - (m - 218) * 12)
            px[x, y] = (r, g, b, min(a, alpha))

img.save("public/logo.png")
print(f"done — {w}x{h}, transparent bg written to public/logo.png")
