"""Generate favicon.ico and favicon.png for the waste sorter app."""
import struct, zlib, math

def make_png(size, path):
    """Create a PNG with recycling symbol on dark background."""
    width = height = size
    bg = (9, 9, 15)        # dark background #09090f
    ac = (79, 142, 247)    # accent blue #4f8ef7
    gr = (34, 197, 94)     # green #22c55e

    rows = []
    cx, cy = width // 2, height // 2
    r_outer = int(width * 0.42)
    r_inner = int(width * 0.28)

    for y in range(height):
        row = []
        for x in range(width):
            dx, dy = x - cx, y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Draw recycling arrows as a ring
            # 3 segments positioned at 0°, 120°, 240°
            angle = math.atan2(dy, dx) * 180 / math.pi
            angle = (angle + 360) % 360
            
            # Check if in one of the 3 arrow segments
            in_segment = False
            for seg_angle in [30, 150, 270]:  # 3 arrows
                if abs(angle - seg_angle) < 35:  # arrow width
                    in_segment = True
                    break
            
            if r_inner < dist < r_outer and in_segment:
                # Arrow segments in green
                row += list(gr)
            elif dist <= r_inner * 0.6:
                # Small center dot in accent blue
                row += list(ac)
            else:
                # Background
                row += list(bg)
        rows.append(bytes([0] + row))  # PNG filter byte

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


def make_ico(png_path, ico_path):
    """Convert PNG to ICO format."""
    with open(png_path, 'rb') as f:
        png_data = f.read()
    
    # ICO header: reserved(2) + type(2) + count(2)
    ico_header = struct.pack('<HHH', 0, 1, 1)
    
    # ICO directory entry: w(1) h(1) colors(1) reserved(1) planes(2) bpp(2) size(4) offset(4)
    entry = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_data), 22)
    
    with open(ico_path, 'wb') as f:
        f.write(ico_header + entry + png_data)
    print(f'  wrote {ico_path}')


# Generate 32px PNG for favicon
make_png(32, 'frontend/public/favicon.png')
make_ico('frontend/public/favicon.png', 'frontend/public/favicon.ico')

# Also create a larger 180px for Apple touch icon
make_png(180, 'frontend/public/apple-touch-icon.png')

print('Done.')
