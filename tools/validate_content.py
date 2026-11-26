#!/usr/bin/env python3
"""
Strict content validator for BJT J2 generated JSON files.
Exits with code 1 if any required field, option, answer, or cross-lesson consistency fails.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS_DIR = ROOT / "data" / "lessons"


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    vocab_global: dict[str, tuple[str, dict]] = {}

    for lf in sorted(LESSONS_DIR.glob("*.json")):
        les = json.loads(lf.read_text(encoding="utf-8"))
        lid = les["id"]

        seen_v: set[str] = set()
        for v in les.get("vocab", []):
            vid = v.get("id", "")
            if not vid or not v.get("word") or not v.get("meaning") or not v.get("exJp") or not v.get("exVi"):
                errors.append(f"{lid} vocab {vid!r}: missing required field (id/word/meaning/exJp/exVi)")
            if vid in seen_v:
                errors.append(f"{lid}: duplicate vocab ID {vid}")
            seen_v.add(vid)
            if not v.get("reading"):
                warnings.append(f"{lid} vocab {vid}: empty reading (expected for 5-col phrase tables)")

            if vid in vocab_global:
                prev_lid, prev_v = vocab_global[vid]
                if prev_v.get("word") != v.get("word") or prev_v.get("meaning") != v.get("meaning"):
                    errors.append(
                        f"Cross-lesson mismatch for {vid} ({prev_lid} vs {lid}): "
                        f"{prev_v.get('meaning')!r} != {v.get('meaning')!r}"
                    )
                else:
                    warnings.append(f"Duplicate vocab ID across lessons (identical): {vid} in {prev_lid} and {lid}")
            else:
                vocab_global[vid] = (lid, v)

        all_q = list(les.get("vocabQuiz", {}).get("items", []))
        for lr in les.get("listening", []):
            all_q.extend(lr.get("questions", []))
        for rd in les.get("reading", []):
            all_q.extend(rd.get("questions", []))
        all_q.extend(les.get("expression", []))
        all_q.extend(les.get("grammar", []))
        all_q.extend(les.get("depiction", []))

        seen_q: set[str] = set()
        for q in all_q:
            qid = q.get("id", "")
            if qid in seen_q:
                errors.append(f"{lid}: duplicate question ID {qid}")
            seen_q.add(qid)
            qtxt = q.get("q", "")
            opts = q.get("options", {})
            ans = q.get("answer", "")
            exp = q.get("explain", "")

            if not qtxt.strip():
                errors.append(f"{lid} question {qid}: empty q")
            if "Giải thích" in qtxt:
                errors.append(f"{lid} question {qid}: 'Giải thích' leaked into q")
            if set(opts.keys()) != {"A", "B", "C", "D"} or any(not str(opts[k]).strip() for k in "ABCD"):
                errors.append(f"{lid} question {qid}: must have 4 non-empty options A-D (got {list(opts.keys())})")
            if ans not in ("A", "B", "C", "D"):
                errors.append(f"{lid} question {qid}: invalid answer {ans!r}")
            if not exp.strip():
                errors.append(f"{lid} question {qid}: empty explain")

    print(f"=== VALIDATE CONTENT: {len(errors)} errors, {len(warnings)} warnings ===")
    for w in warnings:
        print("  [WARN]", w)
    for e in errors:
        print("  [ERR]", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
