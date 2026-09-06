#!/usr/bin/env python3
"""Download the optional PIXLS.US test images to an ignored local directory."""
import hashlib
from pathlib import Path
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / "public" / "reference"
CDN = "https://d2x313g9lpht1q.cloudfront.net/optimized/3X/"
ASSETS = (
    (
        "avatortest.png",
        "5/4/54aa108b10ff9e877f59b056448948307b8554c6_2_690x690.png",
        "29ab37f535d4ae9b440b52fdb51be044c20a459986e6dae281ebeaceedfd1462",
    ),
    (
        "mask.png",
        "f/3/f35c6f937c6c1525b12868c1468065350c6fa951_2_690x690.png",
        "20be669d9fb51c52fb88b2afcff8019834cf40c4fb7cbbbcd4536776ffa41dd9",
    ),
    (
        "contrast.png",
        "3/9/391b0cece0eb7d9ca36b5e1c88a91cd9d00e728f_2_690x299.png",
        "b9ade042cde59884017dc14b1a32577f487b7bd1508941b16c136ba876a1e5b1",
    ),
)


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, remote_path, expected_hash in ASSETS:
        destination = ROOT / name
        if destination.exists():
            if hashlib.sha256(destination.read_bytes()).hexdigest() != expected_hash:
                raise ValueError(f"{name} differs from the reference. Move it aside before retrying.")
            print(f"Verified existing {name}")
            continue
        request = urllib.request.Request(CDN + remote_path, headers={"User-Agent": "WaterdropLab/1.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            content = response.read(8 * 1024 * 1024 + 1)
        if hashlib.sha256(content).hexdigest() != expected_hash:
            raise ValueError(f"Checksum mismatch for {name}; no file was written.")
        temporary = destination.with_suffix(".download")
        try:
            temporary.write_bytes(content)
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)
        print(f"Downloaded {name}")
    print("Reference images are ready. Restart/rebuild the app if needed.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, urllib.error.URLError) as error:
        print(f"Reference download failed: {error}", file=sys.stderr)
        sys.exit(1)
