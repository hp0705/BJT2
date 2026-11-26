#!/usr/bin/env python3
"""
Generate pre-rendered Japanese MP3 audio using edge-tts (Microsoft Neural TTS, free).

Outputs:
  audio/words/{VOCAB_ID}.mp3
  audio/examples/{VOCAB_ID}.mp3
  audio/listening/{LR_ID}/{01..nn}.mp3
  audio/prompts/{Q_ID}.mp3
  audio/options/{Q_ID}_{A..D}.mp3
  audio/manifest.json

Usage:
  python tools/generate_audio.py [--part P01] [--concurrency 4]
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
LESSONS_DIR = DATA_DIR / "lessons"
AUDIO_DIR = ROOT / "audio"
OVERRIDES_PATH = Path(__file__).resolve().parent / "tts_overrides.json"
MANIFEST_PATH = AUDIO_DIR / "manifest.json"

VOICE_FEMALE = "ja-JP-NanamiNeural"
VOICE_MALE = "ja-JP-KeitaNeural"
VOICE_NARRATOR = "ja-JP-NanamiNeural"


def load_overrides() -> dict[str, str]:
    if OVERRIDES_PATH.exists():
        data = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
        return {k: v for k, v in data.items() if not k.startswith("_")}
    return {}


def normalize_for_tts(text: str, item_id: str, overrides: dict[str, str]) -> str:
    if item_id in overrides:
        return overrides[item_id]
    t = text.strip()
    if t in overrides:
        return overrides[t]
    for k, v in overrides.items():
        if k in t and len(k) > 2:
            t = t.replace(k, v)
    # Remove markdown formatting
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    # Remove slash alternatives like A／B -> A、B
    t = t.replace("／", "、")
    # Remove tilde placeholder 〜
    t = t.replace("〜", "")
    return t.strip()


def needs_ear_check(text: str) -> bool:
    """Flag text containing digits, dates, or kanji names that may need ear verification."""
    return bool(re.search(r"\d|[一二三四五六七八九十百千万億]", text))


def voice_for_speaker(speaker: str) -> tuple[str, str]:
    """Return (voice_name, pitch) for a dialogue speaker."""
    if speaker == "女":
        return VOICE_FEMALE, "+0Hz"
    if speaker == "男B":
        # Distinct male pitch when DaichiNeural is unavailable
        return VOICE_MALE, "-10Hz"
    if speaker == "男":
        return VOICE_MALE, "+0Hz"
    return VOICE_NARRATOR, "+0Hz"


async def synthesize_one(
    sem: asyncio.Semaphore,
    text: str,
    voice: str,
    rate: str,
    pitch: str,
    out_path: Path,
) -> bool:
    if not text:
        return False
    out_path.parent.mkdir(parents=True, exist_ok=True)
    async with sem:
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
                await comm.save(str(out_path))
                return True
            except Exception as exc:
                if attempt == 2:
                    print(f"  [ERROR] Failed {out_path.name}: {exc}")
                    return False
                await asyncio.sleep(1.2 * (attempt + 1))
    return False


async def main_async(part_filter: str | None, concurrency: int) -> int:
    if not LESSONS_DIR.exists():
        print("ERROR: data/lessons not found. Run python tools/parse_md.py first.")
        return 1

    overrides = load_overrides()
    manifest: dict[str, Any] = {}
    if MANIFEST_PATH.exists():
        try:
            manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except Exception:
            manifest = {}

    jobs: list[tuple[str, str, str, str, str, Path]] = []
    ear_check: list[str] = []

    lesson_files = sorted(LESSONS_DIR.glob("*.json"))
    for lf in lesson_files:
        if part_filter and not lf.stem.startswith(part_filter):
            continue
        les = json.loads(lf.read_text(encoding="utf-8"))

        # 1. Vocab words + examples
        for v in les.get("vocab", []):
            vid = v["id"]
            w_text = normalize_for_tts(v.get("reading") or v["word"], vid, overrides)
            jobs.append((f"words/{vid}.mp3", w_text, VOICE_FEMALE, "-10%", "+0Hz", AUDIO_DIR / "words" / f"{vid}.mp3"))

            if v.get("exJp"):
                ex_text = normalize_for_tts(v["exJp"], f"{vid}-EX", overrides)
                jobs.append((f"examples/{vid}.mp3", ex_text, VOICE_FEMALE, "+0%", "+0Hz", AUDIO_DIR / "examples" / f"{vid}.mp3"))
                if needs_ear_check(ex_text):
                    ear_check.append(f"examples/{vid}.mp3: {v['exJp']}")

        # 2. Listening dialogues (line by line)
        for lr in les.get("listening", []):
            lrid = lr["id"]
            for idx, line in enumerate(lr.get("lines", []), start=1):
                rel = f"listening/{lrid}/{idx:02d}.mp3"
                line_id = f"{lrid}-{idx:02d}"
                txt = normalize_for_tts(line["text"], line_id, overrides)
                voice, pitch = voice_for_speaker(line.get("speaker", "ナレーター"))
                jobs.append((rel, txt, voice, "+0%", pitch, AUDIO_DIR / "listening" / lrid / f"{idx:02d}.mp3"))
                if needs_ear_check(txt):
                    ear_check.append(f"{rel}: {line['text']}")

        # 3. Audio options for expression_listening & depiction
        for q in les.get("expression", []) + les.get("depiction", []):
            if q.get("questionType") in ("expression_listening", "depiction"):
                qid = q["id"]
                if q.get("questionType") == "expression_listening" and q.get("q"):
                    ptxt = normalize_for_tts(q["q"], qid, overrides)
                    jobs.append((f"prompts/{qid}.mp3", ptxt, VOICE_NARRATOR, "+0%", "+0Hz", AUDIO_DIR / "prompts" / f"{qid}.mp3"))
                for opt_k, opt_v in q.get("options", {}).items():
                    otxt = normalize_for_tts(opt_v, f"{qid}_{opt_k}", overrides)
                    jobs.append((f"options/{qid}_{opt_k}.mp3", otxt, VOICE_FEMALE, "+0%", "+0Hz", AUDIO_DIR / "options" / f"{qid}_{opt_k}.mp3"))

    # Filter unchanged jobs
    pending: list[tuple[str, str, str, str, str, Path, str]] = []
    seen_rel: set[str] = set()
    for rel, txt, voice, rate, pitch, out_path in jobs:
        if rel in seen_rel:
            continue
        seen_rel.add(rel)
        h = hashlib.sha256(f"{voice}|{rate}|{pitch}|{txt}".encode("utf-8")).hexdigest()[:16]
        if out_path.exists() and manifest.get(rel, {}).get("hash") == h:
            continue
        pending.append((rel, txt, voice, rate, pitch, out_path, h))

    print(f"Total audio targets: {len(seen_rel)} | Pending to generate: {len(pending)}")
    if not pending:
        print("All audio files are up to date!")
        return 0

    sem = asyncio.Semaphore(concurrency)
    done = 0
    failed = 0

    async def worker(job: tuple[str, str, str, str, str, Path, str]) -> None:
        nonlocal done, failed
        rel, txt, voice, rate, pitch, out_path, h = job
        ok = await synthesize_one(sem, txt, voice, rate, pitch, out_path)
        if ok:
            manifest[rel] = {"hash": h, "size": out_path.stat().st_size}
            done += 1
        else:
            failed += 1
        if (done + failed) % 25 == 0 or (done + failed) == len(pending):
            print(f"  Progress: {done + failed}/{len(pending)} (ok={done}, failed={failed})")

    await asyncio.gather(*(worker(j) for j in pending))

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nFinished! Generated: {done}, Failed: {failed}")
    if ear_check:
        print(f"\nItems containing numbers/dates to spot-check by ear ({len(ear_check)} total, showing first 15):")
        for item in ear_check[:15]:
            print("  -", item)
    return 0 if failed == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate BJT J2 MP3 audio via edge-tts")
    parser.add_argument("--part", help="Only generate for a specific PART, e.g. P01", default=None)
    parser.add_argument("--concurrency", type=int, default=4, help="Max concurrent TTS requests (default 4)")
    args = parser.parse_args()
    return asyncio.run(main_async(args.part, args.concurrency))


if __name__ == "__main__":
    sys.exit(main())
