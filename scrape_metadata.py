#!/usr/bin/env python3
"""
Gameologist metadata scraper.

This script scrapes channel metadata directly from data/input directory,
separate from Centroids/core. It filters videos according to gameologist rules:
- Gaming category only
- Duration >= 8 minutes (480 seconds)
- Never was live and is not live
- Upload date >= 2020-01-01

Obfuscation / hashing
---------------------
- Channel IDs are SHA-256 hashed (first 16 hex chars) with salt
  "im_not_a_fartologist". This MUST match atlas_gameologist.py and
  gameologist.js exactly, or client-side channel-ID lookup and all cluster /
  relationship keys will silently fail to match.
- Channel names, channel handles, and video IDs are XOR-encoded (hex) with
  XOR_KEY. This is obfuscation, not encryption: the key is public in
  gameologist.js. Its purpose is to eliminate the single bulk-lookup file
  (reverse_lookup.json) so that lazy scrapers cannot dump the whole channel
  list with one request.

Search policy
-------------
The client searches by CHANNEL HANDLE or CHANNEL ID only. Display names are
intentionally not matched (they collide between channels). We therefore store
the handle separately from the display name:

    "name"   — display name, XOR hex (display only)
    "handle" — channel handle without leading "@", XOR hex (search key)

No titles, URLs, timestamps, or transcripts are stored.

Output layout
-------------
    data/
      manifest.json
      shard_000.json, shard_001.json, ...  # Bundled channel data
      channel_clusters.json               # placeholder only
      burrows_channel_clusters.json       # placeholder only
      semantic_relationships.json         # placeholder only
      burrows_relationships.json          # placeholder only

NOTE: reverse_lookup.json is intentionally NOT produced. Resolution of
channel handles and video IDs happens client-side by XOR-decoding the
stored hex.
"""

import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime


# Must match atlas_gameologist.py / gameologist.js.
DEFAULT_HASH_SALT = "im_not_a_fartologist"

# Must match atlas_gameologist.py / gameologist.js exactly.
XOR_KEY = "im_not_a_fartologist_fart_pad_7c3a9f2e"

TARGET_SHARDS = 40


def _dump_compact(path: Path, obj: Any) -> None:
    """Write JSON without indentation or whitespace padding."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, separators=(",", ":"))


def xor_encode(value: str, key: str = XOR_KEY) -> str:
    """XOR-encode a UTF-8 string with a repeating key; return lowercase hex."""
    if value is None:
        value = ""
    key_bytes = key.encode("utf-8")
    data_bytes = str(value).encode("utf-8")
    out = bytearray(len(data_bytes))
    for i, b in enumerate(data_bytes):
        out[i] = b ^ key_bytes[i % len(key_bytes)]
    return out.hex()


def _extract_handle(video_meta: Dict, folder_name: str) -> str:
    _UC_ID = re.compile(r"UC[A-Za-z0-9_-]{22}")

    def _looks_like_channel_id(s: str) -> bool:
        return bool(s) and bool(_UC_ID.fullmatch(s))

    # 1. @handle embedded in a URL — most authoritative
    for field in ("uploader_url", "channel_url"):
        val = video_meta.get(field)
        if not val:
            continue
        m = re.search(r"@([^/?#]+)", str(val))
        if m:
            return m.group(1).strip()

    # 2. uploader_id with @ prefix (modern yt-dlp)
    val = video_meta.get("uploader_id")
    if val:
        s = str(val).strip()
        if s.startswith("@"):
            s = s[1:]
            if s and not _looks_like_channel_id(s):
                return s

    # 3. Folder name (Centroids input convention)
    if folder_name:
        s = folder_name.lstrip("@").strip()
        if s and not _looks_like_channel_id(s):
            return s

    # 4. Explicit handle fields (rare)
    for field in ("channel_handle", "uploader_handle", "handle"):
        val = video_meta.get(field)
        if val:
            s = str(val).strip().lstrip("@")
            if s and not _looks_like_channel_id(s):
                return s

    # 5. LAST RESORT — display name. Known to collide between channels;
    #    only reached when no real handle exists.
    val = video_meta.get("channel_name")
    if val:
        s = str(val).strip().lstrip("@")
        if s and not _looks_like_channel_id(s):
            return s

    return ""

class GameologistScraper:
    """Scrapes and processes metadata for gameologist from data/input."""

    def __init__(self, centroids_dir: Path, gameologist_dir: Path):
        self.centroids_dir = Path(centroids_dir)
        self.gameologist_dir = Path(gameologist_dir)
        self.gameologist_data_dir = self.gameologist_dir / "data"
        self.gameologist_data_dir.mkdir(parents=True, exist_ok=True)

        self.hash_salt = DEFAULT_HASH_SALT

    @staticmethod
    def hash_string(value: str, salt: str = DEFAULT_HASH_SALT) -> str:
        """SHA-256(value+salt), first 16 hex chars."""
        combined = (value or "") + salt
        return hashlib.sha256(combined.encode("utf-8")).hexdigest()[:16]

    def _write_channel_shards(self, channels: List[Dict]) -> List[str]:
        """Write channels into ~TARGET_SHARDS bundle files. Returns shard filenames."""
        if not channels:
            return []
        shard_size = max(1, math.ceil(len(channels) / TARGET_SHARDS))
        shard_files: List[str] = []
        for i in range(0, len(channels), shard_size):
            chunk = channels[i:i + shard_size]
            shard = {c["id"]: c for c in chunk}
            name = f"shard_{i // shard_size:03d}.json"
            _dump_compact(self.gameologist_data_dir / name, shard)
            shard_files.append(name)
        print(f"  Wrote {len(shard_files)} shard files (avg {len(channels) // len(shard_files)} channels per shard)")
        return shard_files

    def _write_manifest(self, shard_files: List[str]) -> None:
        manifest = {
            "version": "1.1",
            "data_version": "1.1",
            "generated": datetime.now().isoformat(),
            "shards": sorted(shard_files),
        }
        _dump_compact(self.gameologist_data_dir / "manifest.json", manifest)
        print(f"  Wrote manifest with {len(shard_files)} shard files")

    def load_channel_metadata(self, channel_name: str) -> Optional[List[Dict]]:
        """Load metadata for a specific channel from data/input."""
        metadata_path = (
            self.centroids_dir / "data" / "input" / channel_name / "metadata.json"
        )
        if not metadata_path.exists():
            return None

        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, list) else None
        except Exception as e:
            print(f"  Error loading metadata for {channel_name}: {e}")
            return None

    def filter_video_metadata(self, video_meta: Dict) -> bool:
        """
        Filter videos according to gameologist rules:
        - Category must be "Gaming"
        - Duration >= 8 minutes (480 seconds)
        - Never was live and is not live
        - Upload date >= 2020-01-01
        """
        if video_meta.get("category") != "Gaming":
            return False

        duration = video_meta.get("duration") or 0
        try:
            duration = int(duration)
        except (TypeError, ValueError):
            return False
        if duration < 480:
            return False

        if video_meta.get("was_live") or video_meta.get("is_live"):
            return False

        upload_date = video_meta.get("upload_date", "")
        if not isinstance(upload_date, str) or len(upload_date) != 8:
            return False
        try:
            year = int(upload_date[:4])
            month = int(upload_date[4:6])
            day = int(upload_date[6:8])
            video_date = datetime(year, month, day)
        except (ValueError, IndexError):
            return False
        return video_date >= datetime(2020, 1, 1)

    def scrape_channel_metadata(self, channel_name: str) -> Optional[Dict]:
        """
        Scrape and export filtered, hashed/obfuscated metadata for one channel.
        Returns None if no videos survive the filter.

        Output schema:
            {
              "id":     "<hashed_channel_id>",
              "name":   "<xor_hex_channel_name>",
              "handle": "<xor_hex_channel_handle>",
              "v":      [[<xor_hex_video_id>, <duration>, <YYYYMMDD int>], ...]
            }
        """
        metadata = self.load_channel_metadata(channel_name)
        if not metadata:
            return None

        filtered_videos = [v for v in metadata if self.filter_video_metadata(v)]
        if not filtered_videos:
            return None

        first_video = filtered_videos[0]
        channel_id_raw = first_video.get("channel_id", "") or ""
        channel_name_raw = first_video.get("channel_name", "") or ""
        channel_handle_raw = _extract_handle(first_video, channel_name)

        hashed_channel_id = self.hash_string(channel_id_raw)
        encoded_channel_name = xor_encode(channel_name_raw)
        encoded_channel_handle = xor_encode(channel_handle_raw)

        video_metadata: List[List[Any]] = []
        for video in filtered_videos:
            video_id_raw = video.get("id", "") or ""
            encoded_video_id = xor_encode(video_id_raw)

            try:
                duration_int = int(video.get("duration") or 0)
            except (TypeError, ValueError):
                duration_int = 0

            try:
                upload_date_int = int(video.get("upload_date", "0") or 0)
            except (TypeError, ValueError):
                upload_date_int = 0

            video_metadata.append([
                encoded_video_id,
                duration_int,
                upload_date_int,
            ])

        return {
            "id": hashed_channel_id,
            "name": encoded_channel_name,
            "handle": encoded_channel_handle,
            "v": video_metadata,
        }

    def scrape_all(self, channel_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Scrape metadata for all channels from data/input.
        If channel_names is not provided, discovers all channels in data/input.
        """
        print("\nScraping metadata for gameologist...")

        if channel_names is None:
            input_dir = self.centroids_dir / "data" / "input"
            if not input_dir.exists():
                print(f"Error: data/input directory not found at {input_dir}")
                return {}

            channel_names = [d.name for d in input_dir.iterdir() if d.is_dir()]
            print(f"  Discovered {len(channel_names)} channels in data/input")

        exported_channels: Dict[str, Dict] = {}
        for channel_name in channel_names:
            result = self.scrape_channel_metadata(channel_name)
            if result:
                exported_channels[channel_name] = result
                print(f"  Exported {channel_name}")
            else:
                print(f"  Skipped {channel_name} (no matching videos)")

        print(f"  Exported metadata for {len(exported_channels)} channels")

        shard_files = self._write_channel_shards(list(exported_channels.values()))
        self._write_manifest(shard_files)

        self._create_placeholders()

        print("  Gameologist metadata scraping complete!")
        return {"channels": exported_channels}

    def _create_placeholders(self) -> None:
        """Create empty placeholder files for relationships and clusters."""
        clusters_path = self.gameologist_data_dir / "channel_clusters.json"
        if not clusters_path.exists():
            _dump_compact(clusters_path, {})
            print("  Created placeholder: channel_clusters.json")

        burrows_clusters_path = (
            self.gameologist_data_dir / "burrows_channel_clusters.json"
        )
        if not burrows_clusters_path.exists():
            _dump_compact(burrows_clusters_path, {})
            print("  Created placeholder: burrows_channel_clusters.json")

        semantic_path = self.gameologist_data_dir / "semantic_relationships.json"
        if not semantic_path.exists():
            _dump_compact(semantic_path, {})
            print("  Created placeholder: semantic_relationships.json")

        burrows_path = self.gameologist_data_dir / "burrows_relationships.json"
        if not burrows_path.exists():
            _dump_compact(burrows_path, {})
            print("  Created placeholder: burrows_relationships.json")


def main():
    """Main entry point for the scraper."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Scrape metadata for gameologist from data/input"
    )
    parser.add_argument(
        "--centroids-dir",
        type=str,
        default=None,
        help="Path to Centroids directory (default: parent of gameologist directory)",
    )
    parser.add_argument(
        "--gameologist-dir",
        type=str,
        default=None,
        help="Path to gameologist directory (default: current directory)",
    )
    parser.add_argument(
        "--channels",
        type=str,
        nargs="+",
        default=None,
        help="Specific channel names to scrape (default: all channels in data/input)",
    )

    args = parser.parse_args()

    if args.gameologist_dir:
        gameologist_dir = Path(args.gameologist_dir).expanduser().resolve()
    else:
        gameologist_dir = Path(__file__).resolve().parent

    if args.centroids_dir:
        centroids_dir = Path(args.centroids_dir).expanduser().resolve()
    else:
        centroids_dir = gameologist_dir.parent

    scraper = GameologistScraper(
        centroids_dir=centroids_dir,
        gameologist_dir=gameologist_dir,
    )
    scraper.scrape_all(channel_names=args.channels)


if __name__ == "__main__":
    main()