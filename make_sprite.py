from PIL import Image, ImageOps
from pathlib import Path
import math

# --------- CONFIG ----------
INPUT_DIR = Path("characters")
OUTPUT_DIR = Path("characters_spritesheet")

FRAME_SIZE = (256, 256)
FRAMES = 8          # smooth walk
ROWS = 2            # idle + walk
OUTPUT_SUFFIX = "_walk_spritesheet.png"
# ---------------------------

def make_frame(img, dx=0, dy=0, rot=0):
    frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
    t = img.rotate(rot, resample=Image.BICUBIC, expand=False)
    frame.paste(t, (int(dx), int(dy)), t)
    return frame

def build_sprite_sheet(src_path):
    img = Image.open(src_path).convert("RGBA")
    base = ImageOps.contain(img, FRAME_SIZE)

    sheet = Image.new(
        "RGBA",
        (FRAME_SIZE[0] * FRAMES, FRAME_SIZE[1] * ROWS),
        (0, 0, 0, 0)
    )

    # -------- IDLE ROW --------
    for i in range(FRAMES):
        phase = (i / FRAMES) * 2 * math.pi
        dy = math.sin(phase) * 4
        rot = math.sin(phase) * 1.5
        frame = make_frame(base, 0, dy, rot)
        sheet.paste(frame, (i * FRAME_SIZE[0], 0))

    # -------- WALK ROW --------
    for i in range(FRAMES):
        phase = (i / FRAMES) * 2 * math.pi
        dx = math.sin(phase) * 8
        dy = math.cos(phase * 2) * 5
        rot = math.sin(phase + math.pi / 4) * 4
        frame = make_frame(base, dx, dy, rot)
        sheet.paste(frame, (i * FRAME_SIZE[0], FRAME_SIZE[1]))

    output_name = src_path.stem + OUTPUT_SUFFIX
    output_path = OUTPUT_DIR / output_name
    sheet.save(output_path, "PNG")

    print(f"✔ Created {output_path}")

def main():
    if not INPUT_DIR.exists():
        print("❌ characters/ folder not found")
        return

    OUTPUT_DIR.mkdir(exist_ok=True)

    pngs = list(INPUT_DIR.glob("*.png"))
    if not pngs:
        print("❌ No PNG files found in characters/")
        return

    for png in pngs:
        try:
            build_sprite_sheet(png)
        except Exception as e:
            print(f"⚠ Failed {png.name}: {e}")

if __name__ == "__main__":
    main()
