"""Generate icon-192.png and icon-512.png for the PWA manifest."""
import struct, zlib, math

def make_icon(size, path):
    # Draw a dark circle bg with a recycling symbol ♻ using raw PNG
    # We'll create a simple colored square PNG: dark bg #09090f with a blue circle
    width = height = size
    bg = (9, 9, 15)       # #09090f
    ac = (79, 142, 247)   # #4f8ef7

    rows = []
    cx, cy, r = width // 2, height // 2, int(width * 0.42)
    ir = int(width * 0.22)  # inner radius for ring

    for y in range(height):
        row = []
        for x in range(width):
            dx, dy = x - cx, y - cy
            dist = math.sqrt(dx*dx + dy*dy)

            # outer circle fill
            if dist <= r:
                # ring between ir and r
                if dist >= ir:
                    row += list(ac)
                else:
                    # inner — draw recycling arrow hint
                    row += list(bg)
            else:
                # rounded square border fade
                row += list(bg)
        rows.append(bytes([0] + row))  # filter byte

    raw = b''.join(rows)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    sig  = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(sig + ihdr + idat + iend)
    print(f'  wrote {path} ({size}x{size})')

make_icon(192, 'public/icon-192.png')
make_icon(512, 'public/icon-512.png')
print('Done.')
