#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


RESAMPLE = Image.Resampling.LANCZOS


def ensure_parent(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)


def open_rgba(path):
    return Image.open(path).convert("RGBA")


def trim_alpha(image):
    bbox = image.getbbox()
    if bbox is None:
        raise ValueError("source image is fully transparent")
    return image.crop(bbox)


def chroma_alpha(image, key):
    red, green, blue = image.convert("RGB").split()
    if key == "green":
        dominant = green
        competing = ImageChops.lighter(red, blue)
    else:
        dominant = ImageChops.darker(red, blue)
        competing = green

    difference = ImageChops.subtract(dominant, competing)
    alpha = difference.point(lambda value: max(0, min(255, int((72 - value) * 4.72))))
    return alpha.filter(ImageFilter.GaussianBlur(0.55))


def process_chroma_key(args):
    image = open_rgba(args.source)
    image.putalpha(chroma_alpha(image, args.key))
    ensure_parent(args.output)
    image.save(args.output, "PNG", optimize=True)


def save_webp(image, path, size=None):
    output = image if size is None else image.resize(size, RESAMPLE)
    ensure_parent(path)
    output.save(path, "WEBP", lossless=True, quality=92, method=6)


def process_icon(args):
    subject = trim_alpha(open_rgba(args.source))
    subject.thumbnail((389, 389), RESAMPLE)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    offset = ((512 - subject.width) // 2, (512 - subject.height) // 2)
    canvas.alpha_composite(subject, offset)

    ensure_parent(args.master)
    canvas.save(args.master, "PNG", optimize=True)
    save_webp(canvas, args.webp_128, (128, 128))
    save_webp(canvas, args.webp_256, (256, 256))


def process_brand(args):
    image = trim_alpha(open_rgba(args.source))
    image.thumbnail((args.max_width, args.max_height), RESAMPLE)
    save_webp(image, args.output)


def process_texture(args):
    image = open_rgba(args.source)
    output = image.resize((args.size, args.size), RESAMPLE)
    save_webp(output, args.output)


def process_scenery(args):
    image = open_rgba(args.source)
    output = ImageOps.fit(
        image,
        (args.width, args.height),
        method=RESAMPLE,
        centering=(args.center_x, args.center_y),
    )
    save_webp(output, args.output)


def process_contact_sheet(args):
    sources = [open_rgba(source) for source in args.sources]
    cell = args.cell_size
    columns = max(1, args.columns)
    rows = (len(sources) + columns - 1) // columns
    sheet = Image.new("RGBA", (columns * cell, rows * cell), (244, 239, 225, 255))

    for index, image in enumerate(sources):
        image.thumbnail((cell - 24, cell - 24), RESAMPLE)
        x = (index % columns) * cell + (cell - image.width) // 2
        y = (index // columns) * cell + (cell - image.height) // 2
        sheet.alpha_composite(image, (x, y))

    ensure_parent(args.output)
    sheet.convert("RGB").save(args.output, "PNG", optimize=True)


def build_parser():
    parser = argparse.ArgumentParser(description="Normalize Trader Tycoon art assets")
    subparsers = parser.add_subparsers(dest="mode", required=True)

    chroma = subparsers.add_parser("chroma-key", help="convert a solid green or magenta backdrop to alpha")
    chroma.add_argument("source")
    chroma.add_argument("--output", required=True)
    chroma.add_argument("--key", choices=("green", "magenta"), required=True)
    chroma.set_defaults(func=process_chroma_key)

    icon = subparsers.add_parser("icon", help="normalize a transparent commodity icon")
    icon.add_argument("source")
    icon.add_argument("--master", required=True)
    icon.add_argument("--webp-128", dest="webp_128", required=True)
    icon.add_argument("--webp-256", dest="webp_256", required=True)
    icon.set_defaults(func=process_icon)

    brand = subparsers.add_parser("brand", help="trim and resize a transparent brand asset")
    brand.add_argument("source")
    brand.add_argument("--output", required=True)
    brand.add_argument("--max-width", type=int, default=1600)
    brand.add_argument("--max-height", type=int, default=480)
    brand.set_defaults(func=process_brand)

    texture = subparsers.add_parser("texture", help="resize a square seamless texture")
    texture.add_argument("source")
    texture.add_argument("--output", required=True)
    texture.add_argument("--size", type=int, default=512)
    texture.set_defaults(func=process_texture)

    scenery = subparsers.add_parser("scenery", help="crop scenery to a responsive aspect ratio")
    scenery.add_argument("source")
    scenery.add_argument("--output", required=True)
    scenery.add_argument("--width", type=int, required=True)
    scenery.add_argument("--height", type=int, required=True)
    scenery.add_argument("--center-x", type=float, default=0.5)
    scenery.add_argument("--center-y", type=float, default=0.5)
    scenery.set_defaults(func=process_scenery)

    contact = subparsers.add_parser("contact-sheet", help="build a visual consistency sheet")
    contact.add_argument("sources", nargs="+")
    contact.add_argument("--output", required=True)
    contact.add_argument("--columns", type=int, default=4)
    contact.add_argument("--cell-size", type=int, default=256)
    contact.set_defaults(func=process_contact_sheet)

    return parser


def main():
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
