#!/usr/bin/env python3
"""
Parse BJT J2 markdown lesson files (04-*.md .. 13-*.md) into structured JSON files:
  - data/index.json
  - data/lessons/{LESSON_ID}.json
  - data/review-pool.json

Uses Python standard library only.
"""

from __future__ import annotations

import glob
import html
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
LESSONS_DIR = DATA_DIR / "lessons"

PART_TITLES = {
    "P01": "Tổ chức, Chức danh & Kính ngữ 内/外",
    "P02": "Điện thoại, Tiếp khách & Từ đệm",
    "P03": "Đơn hàng, Báo giá & Logistics",
    "P04": "Đàm phán, Hợp đồng & Ý gián tiếp",
}


def strip_md(text: str) -> str:
    """Remove simple markdown bold/code wrappers while keeping inner text."""
    t = text.strip()
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    return t.strip()


def md_inline_to_html(text: str) -> str:
    """Convert basic inline markdown (**bold**, `code`) to safe HTML."""
    escaped = html.escape(text.strip())
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    return escaped


def md_table_to_html(lines: list[str]) -> str:
    """Convert a markdown table (list of pipe-delimited lines) into HTML table."""
    rows = []
    for idx, line in enumerate(lines):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if idx == 1 and all(re.match(r"^:?-{2,}:?$", c) for c in cells if c):
            continue
        rows.append(cells)
    if not rows:
        return ""
    out = ['<div class="doc-table-wrap"><table class="doc-table"><thead><tr>']
    for c in rows[0]:
        out.append(f"<th>{md_inline_to_html(c)}</th>")
    out.append("</tr></thead><tbody>")
    for r in rows[1:]:
        out.append("<tr>")
        for c in r:
            out.append(f"<td>{md_inline_to_html(c)}</td>")
        out.append("</tr>")
    out.append("</tbody></table></div>")
    return "".join(out)


def parse_table_rows(lines: list[str]) -> list[list[str]]:
    """Parse markdown table rows, skipping header and separator rows."""
    parsed: list[list[str]] = []
    header_seen = False
    for line in lines:
        s = line.strip()
        if not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if not header_seen:
            header_seen = True
            continue
        if all(re.match(r"^:?-{2,}:?$", c) for c in cells if c != ""):
            continue
        parsed.append(cells)
    return parsed


def split_example(raw: str) -> tuple[str, str]:
    """Split 'JP sentence → VN meaning' into (exJp, exVi).
    If there is no '→', put pure-Vietnamese usage notes into exVi (leaving exJp empty so TTS skips it).
    """
    if "→" in raw:
        jp, vi = raw.split("→", 1)
        return strip_md(jp), strip_md(vi)
    cleaned = strip_md(raw)
    if not cleaned:
        return "", ""
    # Check if string contains Japanese characters
    if re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", cleaned):
        return cleaned, ""
    return "", cleaned


def parse_options_inline(raw: str) -> dict[str, str]:
    """Parse 'A. ...　B. ...　C. ...　D. ...' into {'A': ..., 'B': ...}."""
    # Normalize full-width space or multiple spaces before B./C./D.
    parts = re.split(r"(?:\u3000|\s{2,}|\s+)(?=[A-D]\.\s)", raw.strip())
    opts: dict[str, str] = {}
    for p in parts:
        m = re.match(r"^([A-D])\.\s*(.+)$", p.strip())
        if m:
            opts[m.group(1)] = m.group(2).strip()
    return opts


def extract_tags(raw: str) -> list[str]:
    return re.findall(r"`([A-Z0-9_-]+)`", raw)


def extract_vocab_ids(raw: str) -> list[str]:
    # Vocab IDs like CO-01, TR-A05, NEW-P01-01, G6-15, HM-10, KE-01
    return re.findall(r"`([A-Z]{2,4}-(?:[A-Z0-9]+-)?[0-9]{2,3})`", raw)


def parse_quiz_table(table_lines: list[str], qtype: str, default_skill: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for cells in parse_table_rows(table_lines):
        if len(cells) < 5:
            continue
        qid = strip_md(cells[0])
        q_text = cells[1].strip()
        opts = parse_options_inline(cells[2])
        ans_m = re.search(r"([A-D])", cells[3])
        ans = ans_m.group(1) if ans_m else ""
        explain = cells[4].strip()
        tags = extract_tags(cells[5]) if len(cells) > 5 else []
        vocab_ids = extract_vocab_ids(explain)
        items.append({
            "id": qid,
            "questionType": qtype,
            "skill": default_skill,
            "q": q_text,
            "options": opts,
            "answer": ans,
            "explain": explain,
            "tags": tags,
            "vocabIds": vocab_ids,
        })
    return items


def parse_dialogue_lines(lines: list[str]) -> list[dict[str, str]]:
    """Parse blockquote lines like '> **男（木村・東洋物産）：** text'."""
    out: list[dict[str, str]] = []
    for raw in lines:
        s = raw.strip()
        if not s.startswith(">"):
            continue
        s = s.lstrip(">").strip()
        if not s:
            continue
        m = re.match(r"^\*\*([^：:*]+)：\*\*\s*(.+)$", s)
        if not m:
            m = re.match(r"^\*\*([^:*]+):\*\*\s*(.+)$", s)
        if m:
            label = m.group(1).strip()
            text = m.group(2).strip()
            speaker = "女" if label.startswith("女") else ("男B" if label.startswith("男B") else ("男" if label.startswith("男") else "ナレーター"))
            name_m = re.search(r"[（(]([^）)]+)[）)]", label)
            name = name_m.group(1) if name_m else label
            out.append({"speaker": speaker, "label": label, "name": name, "text": text})
        else:
            out.append({"speaker": "ナレーター", "label": "", "name": "", "text": strip_md(s)})
    return out


def parse_translation_lines(lines: list[str]) -> list[str]:
    out: list[str] = []
    for raw in lines:
        s = raw.strip()
        if s.startswith(">"):
            s = s.lstrip(">").strip()
            if s:
                out.append(strip_md(s))
    return out


def parse_question_blocks(lines: list[str], default_qtype: str, default_skill: str) -> list[dict[str, Any]]:
    """Parse bullet/heading-based question blocks (- **Câu hỏi (`ID` ...):** ... or **T01** (`ID` ...))."""
    questions: list[dict[str, Any]] = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i].strip()

        # Pattern 1: - **Câu hỏi (`P04-L01-E01` · skill: `listening_reading` · tags: `A`, `B`):**
        m1 = re.match(r"^-\s*\*\*Câu hỏi\s*\(([^)]+)\):\*\*(.*)$", line)
        # Pattern 2: **T01** (`P02-L04-T01` · tags: `A`, `B`)
        m2 = re.match(r"^\*\*T\d+\*\*\s*\(([^)]+)\)", line)
        # Pattern 3: #### `P01-L03-X02` · tags: `KEIGO_REGISTER`
        m3 = re.match(r"^####\s*`([A-Z0-9-]+)`(.*)$", line)

        if m1 or m2 or m3:
            if m1:
                meta = m1.group(1)
                qid_m = re.search(r"`([^`]+)`", meta)
                qid = qid_m.group(1) if qid_m else ""
                skill_m = re.search(r"skill:\s*`?([a-z_]+)`?", meta)
                skill = skill_m.group(1) if skill_m else default_skill
                tags = extract_tags(meta)
                if qid in tags:
                    tags.remove(qid)
                if skill in tags:
                    tags.remove(skill)
                i += 1
            elif m2:
                meta = m2.group(1)
                qid_m = re.search(r"`([^`]+)`", meta)
                qid = qid_m.group(1) if qid_m else ""
                skill = default_skill
                tags = extract_tags(meta)
                if qid in tags:
                    tags.remove(qid)
                i += 1
            else:
                qid = m3.group(1)
                meta = m3.group(2)
                skill = "expression_listening" if "Nghe" in meta else default_skill
                tags = extract_tags(meta)
                i += 1

            q_lines: list[str] = []
            opts: dict[str, str] = {}
            ans = ""
            explain_lines: list[str] = []
            in_explain = False
            extra_audio = ""

            while i < n:
                cur = lines[i].strip()
                # Stop if next question starts
                if (
                    re.match(r"^-\s*\*\*Câu hỏi\s*\(", cur)
                    or re.match(r"^\*\*T\d+\*\*\s*\(", cur)
                    or re.match(r"^####\s*`[A-Z0-9-]+`", cur)
                    or cur.startswith("### ")
                    or cur.startswith("## ")
                ):
                    break

                # Audio ID inside T15-T20
                am = re.match(r"^\*Audio ID:\*\s*`([^`]+)`", cur)
                if am:
                    extra_audio = am.group(1)
                    i += 1
                    continue

                # Explanation line: - **Giải thích:** ... (may be multi-line)
                exp_m = re.match(r"^(?:-\s*)?\*\*Giải thích:\*\*\s*(.*)$", cur)
                if exp_m:
                    in_explain = True
                    if exp_m.group(1).strip():
                        explain_lines.append(exp_m.group(1).strip())
                    i += 1
                    continue

                if in_explain:
                    if cur == "---":
                        break
                    if cur:
                        explain_lines.append(cur)
                    i += 1
                    continue

                # Option bullet: - A. ... or   - A. ...
                om = re.match(r"^-\s*([A-D])\.\s*(.+)$", cur)
                if om:
                    # Check if inline A..D on same line
                    if "B." in om.group(2) and "\u3000" in cur:
                        opts.update(parse_options_inline(cur.lstrip("- ").strip()))
                    else:
                        opts[om.group(1)] = om.group(2).strip()
                    i += 1
                    continue

                # Answer line: - **Đáp án:** **C**  OR  **答え:** **A** | explain
                ans_m = re.match(r"^(?:-\s*)?\*\*(?:Đáp án|答え):\*\*\s*\*\*([A-D])\*\*(.*)$", cur)
                if ans_m:
                    ans = ans_m.group(1)
                    rest = ans_m.group(2).strip()
                    if rest.startswith("|"):
                        explain_lines.append(rest.lstrip("|").strip())
                    i += 1
                    continue

                if cur and cur != "---" and not cur.startswith("**Script") and not cur.startswith("**Dịch"):
                    q_lines.append(cur.lstrip("> ").strip())
                i += 1

            explain = "\n".join(explain_lines).strip()

            qtype = default_qtype
            if skill == "expression_listening":
                qtype = "expression_listening"
            questions.append({
                "id": qid,
                "questionType": qtype,
                "skill": skill,
                "q": "\n".join(q_lines).strip(),
                "options": opts,
                "answer": ans,
                "explain": explain,
                "tags": tags,
                "vocabIds": extract_vocab_ids(explain),
                "audioId": extra_audio or None,
            })
            continue
        i += 1

    return questions


def parse_lesson_block(lesson_id: str, title: str, part: str, lines: list[str]) -> dict[str, Any]:
    is_test = lesson_id.endswith("L04")
    lesson: dict[str, Any] = {
        "id": lesson_id,
        "part": part,
        "title": title,
        "isTest": is_test,
        "vocab": [],
        "cards": [],
        "confusedPairs": [],
        "vocabQuiz": {"passAt": 0, "total": 0, "items": []},
        "notes": [],
        "listening": [],
        "reading": [],
        "expression": [],
        "grammar": [],
        "depiction": [],
        "testSections": [],
    }

    # Split into ### sections (or ## Phần ... inside L04 tests)
    sections: list[tuple[str, list[str]]] = []
    cur_h = ""
    cur_lines: list[str] = []
    for line in lines:
        is_sub_listening = is_test and line.startswith("### Bài nghe")
        if (line.startswith("### ") and not is_sub_listening) or (is_test and re.match(r"^##\s+Phần\s+\d", line)):
            if cur_h or cur_lines:
                sections.append((cur_h, cur_lines))
            cur_h = re.sub(r"^#{2,3}\s+", "", line).strip()
            cur_lines = []
        else:
            cur_lines.append(line)
    if cur_h or cur_lines:
        sections.append((cur_h, cur_lines))

    for sec_title, sec_lines in sections:
        if sec_title.startswith("0."):
            parse_vocab_section(sec_lines, lesson)
        elif "Điểm cần nhớ" in sec_title:
            for l in sec_lines:
                s = l.strip()
                if s.startswith("- "):
                    lesson["notes"].append(s[2:].strip())
        elif "Phần 3" in sec_title or ("Nghe" in sec_title and ("聴解" in sec_title or "聴読解" in sec_title or "LR" in sec_title or "-A0" in sec_title)):
            if is_test and ("Phần 3" in sec_title or "聴解" in sec_title):
                items = parse_test_listening_section(sec_lines, lesson_id)
                lesson["listening"].extend(items)
            else:
                lr_item = parse_listening_section(sec_title, sec_lines, lesson_id)
                if lr_item:
                    lesson["listening"].append(lr_item)
        elif "文法語彙" in sec_title or "Văn pháp" in sec_title:
            qs = parse_grammar_or_test_section(sec_lines, "grammar_vocab", "grammar")
            lesson["grammar"].extend(qs)
        elif "表現力" in sec_title or "Kính ngữ" in sec_title or "Từ đệm" in sec_title or "Mẫu câu Điện thoại" in sec_title:
            xs = parse_expression_section(sec_title, sec_lines)
            lesson["expression"].extend(xs)
        elif "Đọc" in sec_title or "読解" in sec_title:
            if is_test:
                qs = parse_test_reading_or_listening(sec_lines, "short_reading", "reading")
                lesson["reading"].extend(qs)
            else:
                r_item = parse_reading_section(sec_title, sec_lines)
                if r_item:
                    lesson["reading"].append(r_item)
        elif "描写" in sec_title:
            ds = parse_depiction_section(sec_title, sec_lines)
            lesson["depiction"].extend(ds)

    # Calculate vocabQuiz passAt if not explicitly parsed
    total_q = len(lesson["vocabQuiz"]["items"])
    lesson["vocabQuiz"]["total"] = total_q
    if lesson["vocabQuiz"]["passAt"] == 0 and total_q > 0:
        lesson["vocabQuiz"]["passAt"] = (total_q * 4 + 4) // 5  # ceil(0.8 * total)

    return lesson


def parse_vocab_section(lines: list[str], lesson: dict[str, Any]) -> None:
    """Parse Bước 1 (vocab tables + HM cards + confused pairs) and Bước 2 (vocabQuiz)."""
    mode = "intro"
    cur_group = ""
    i = 0
    n = len(lines)
    while i < n:
        s = lines[i].strip()
        if s.startswith("#### Bước 1"):
            mode = "b1"
            i += 1
            continue
        if s.startswith("#### Bước 2"):
            mode = "b2"
            m_pass = re.search(r"đạt\s*≥\s*(\d+)/(\d+)", s)
            if m_pass:
                lesson["vocabQuiz"]["passAt"] = int(m_pass.group(1))
            i += 1
            continue
        if s.startswith("#### Bước 3"):
            mode = "b3"
            i += 1
            continue

        if mode == "b1":
            if s.startswith("**Nhóm "):
                cur_group = strip_md(s)
                i += 1
                continue
            if s.startswith("| ID |"):
                tbl: list[str] = []
                while i < n and lines[i].strip().startswith("|"):
                    tbl.append(lines[i])
                    i += 1
                # Detect columns by header row instead of fixed indices
                headers = [c.strip().lower() for c in tbl[0].strip().strip("|").split("|")]
                idx_word = next((k for k, h in enumerate(headers) if "từ" in h or "cụm" in h), 1)
                idx_read = next((k for k, h in enumerate(headers) if "cách đọc" in h), None)
                idx_mean = next((k for k, h in enumerate(headers) if "nghĩa" in h), None)
                idx_ex = next((k for k, h in enumerate(headers) if "ví dụ" in h or "dùng khi nào" in h), None)
                idx_tip = next((k for k, h in enumerate(headers) if "mẹo" in h or "ghi chú" in h or "bẫy" in h), None)

                for cells in parse_table_rows(tbl):
                    if len(cells) < 4:
                        continue
                    vid = strip_md(cells[0])
                    word = strip_md(cells[idx_word]) if idx_word < len(cells) else ""
                    reading = strip_md(cells[idx_read]) if (idx_read is not None and idx_read < len(cells)) else ""
                    meaning = strip_md(cells[idx_mean]) if (idx_mean is not None and idx_mean < len(cells)) else ""
                    raw_ex = cells[idx_ex] if (idx_ex is not None and idx_ex < len(cells)) else ""
                    ex_jp, ex_vi = split_example(raw_ex)
                    tip = cells[idx_tip].strip() if (idx_tip is not None and idx_tip < len(cells)) else ""
                    lesson["vocab"].append({
                        "id": vid,
                        "group": cur_group,
                        "word": word,
                        "reading": reading,
                        "meaning": meaning,
                        "exJp": ex_jp,
                        "exVi": ex_vi,
                        "tip": tip,
                    })
                continue
            if s.startswith("- `HM-") or s.startswith("- `C"):
                hm_m = re.match(r"^-\s*`([^`]+)`\s*(.+)$", s)
                if hm_m:
                    lesson["cards"].append({"id": hm_m.group(1), "html": md_inline_to_html(hm_m.group(2))})
                i += 1
                continue
            if s.startswith("- ") and not s.startswith("- **"):
                lesson["confusedPairs"].append(s[2:].strip())
                i += 1
                continue

        elif mode == "b2":
            if s.startswith("| ID |"):
                tbl = []
                while i < n and lines[i].strip().startswith("|"):
                    tbl.append(lines[i])
                    i += 1
                lesson["vocabQuiz"]["items"].extend(parse_quiz_table(tbl, "vocab", "vocab"))
                continue
        i += 1


def parse_listening_section(sec_title: str, lines: list[str], lesson_id: str) -> dict[str, Any] | None:
    id_m = re.search(r"`([A-Z0-9-]+)`", sec_title)
    lid = id_m.group(1) if id_m else f"{lesson_id}-LR01"
    is_lr = "聴読解" in sec_title or "-LR" in lid

    doc_parts: list[str] = []
    jp_lines: list[str] = []
    vn_lines: list[str] = []
    q_lines: list[str] = []

    state = "meta"
    i = 0
    n = len(lines)
    while i < n:
        s = lines[i].strip()
        if s.startswith("**Script (JP"):
            state = "jp"
            i += 1
            continue
        if s.startswith("**Dịch (VN"):
            state = "vn"
            i += 1
            continue
        if s.startswith("- **Câu hỏi") or s.startswith("| ID |"):
            state = "q"
        if state == "meta":
            if s.startswith("|"):
                tbl = []
                while i < n and lines[i].strip().startswith("|"):
                    tbl.append(lines[i])
                    i += 1
                doc_parts.append(md_table_to_html(tbl))
                continue
            if s.startswith(">"):
                doc_parts.append(f'<blockquote class="doc-quote">{md_inline_to_html(s.lstrip(">").strip())}</blockquote>')
        elif state == "jp":
            if s.startswith(">"):
                jp_lines.append(s)
        elif state == "vn":
            if s.startswith(">"):
                vn_lines.append(s)
            elif s.startswith("- **Câu hỏi") or s.startswith("| ID |"):
                state = "q"
                q_lines.append(lines[i])
        elif state == "q":
            q_lines.append(lines[i])
        i += 1

    questions = parse_question_blocks(
        q_lines,
        "listening_reading" if is_lr else "listening",
        "listening_reading" if is_lr else "listening",
    )
    # Also support table-based questions if any
    for idx, ql in enumerate(q_lines):
        if ql.strip().startswith("| ID |"):
            questions.extend(parse_quiz_table(q_lines[idx:], "listening_reading" if is_lr else "listening", "listening"))
            break

    return {
        "id": lid,
        "title": strip_md(sec_title),
        "doc": "\n".join(doc_parts).strip(),
        "lines": parse_dialogue_lines(jp_lines),
        "translation": parse_translation_lines(vn_lines),
        "questions": questions,
    }


def parse_reading_section(sec_title: str, lines: list[str]) -> dict[str, Any] | None:
    id_m = re.search(r"`([A-Z0-9-]+)`", sec_title)
    rid = id_m.group(1) if id_m else "R01"
    passage_lines: list[str] = []
    q_lines: list[str] = []
    in_q = False
    for line in lines:
        s = line.strip()
        if s.startswith("- **Câu hỏi") or s.startswith("| ID |"):
            in_q = True
        if not in_q and s.startswith(">"):
            passage_lines.append(md_inline_to_html(s.lstrip(">").strip()))
        elif in_q:
            q_lines.append(line)

    questions = parse_question_blocks(q_lines, "short_reading", "reading")
    return {
        "id": rid,
        "title": strip_md(sec_title),
        "passageHtml": "<br>".join(passage_lines),
        "questions": questions,
    }


def parse_expression_section(sec_title: str, lines: list[str]) -> list[dict[str, Any]]:
    # Check if single question directly under ### 4. Bài 表現力 (`P04-L01-X01`, Đọc · tags: ...)
    id_m = re.search(r"`([A-Z0-9-]+)`", sec_title)
    is_listen = "Nghe" in sec_title
    default_skill = "expression_listening" if is_listen else "expression_reading"

    # Try sub-blocks first (#### `P01-L03-X02` ...)
    qs = parse_question_blocks(lines, default_skill, default_skill)
    if qs:
        return qs

    # Single-question section (e.g. P01-L01-E01, P02-L02-E02, P04-L01-X01)
    if id_m:
        qid = id_m.group(1)
        tags = extract_tags(sec_title)
        if qid in tags:
            tags.remove(qid)
        prompt: list[str] = []
        opts: dict[str, str] = {}
        ans = ""
        explain_lines: list[str] = []
        in_explain = False
        for line in lines:
            cur = line.strip()
            exp_m = re.match(r"^(?:-\s*)?\*\*Giải thích:\*\*\s*(.*)$", cur)
            if exp_m:
                in_explain = True
                if exp_m.group(1).strip():
                    explain_lines.append(exp_m.group(1).strip())
                continue
            if in_explain:
                if cur == "---":
                    break
                if cur:
                    explain_lines.append(cur)
                continue
            if cur.startswith("- **Error Tags:") or "**Error Tags:**" in cur:
                tags.extend(extract_tags(cur))
                if cur.startswith("- **Skill:**"):
                    continue
            om = re.match(r"^-\s*([A-D])\.\s*(.+)$", cur)
            if om:
                opts[om.group(1)] = om.group(2).strip()
                continue
            ans_m = re.match(r"^(?:-\s*)?\*\*(?:Đáp án|答え):\*\*\s*\*\*([A-D])\*\*", cur)
            if ans_m:
                ans = ans_m.group(1)
                continue
            if cur.startswith("- **Skill:") or cur.startswith("- **Lựa chọn"):
                continue
            if cur.startswith("- **Người dẫn đề") or cur.startswith("- **Tình huống:") or cur.startswith("- **Câu hỏi:"):
                prompt.append(re.sub(r"^-\s*\*\*[^*]+\*\*\s*", "", cur))
                continue
            if cur and cur != "---":
                prompt.append(cur)
        explain = "\n".join(explain_lines).strip()
        tags = list(dict.fromkeys(tags))
        return [{
            "id": qid,
            "questionType": default_skill,
            "skill": default_skill,
            "q": "\n".join(prompt).strip(),
            "options": opts,
            "answer": ans,
            "explain": explain,
            "tags": tags,
            "vocabIds": extract_vocab_ids(explain),
        }]
    return []


def parse_grammar_or_test_section(lines: list[str], qtype: str, skill: str) -> list[dict[str, Any]]:
    qs: list[dict[str, Any]] = []
    i = 0
    n = len(lines)
    while i < n:
        if lines[i].strip().startswith("| ID |"):
            tbl = []
            while i < n and lines[i].strip().startswith("|"):
                tbl.append(lines[i])
                i += 1
            qs.extend(parse_quiz_table(tbl, qtype, skill))
            continue
        i += 1
    if not qs:
        qs.extend(parse_question_blocks(lines, qtype, skill))
    return qs


def parse_depiction_section(sec_title: str, lines: list[str]) -> list[dict[str, Any]]:
    id_m = re.search(r"`([A-Z0-9-]+)`", sec_title)
    did = id_m.group(1) if id_m else "D01"
    tags = extract_tags(sec_title)
    if did in tags:
        tags.remove(did)
    image_spec = ""
    opts: dict[str, str] = {}
    ans = ""
    explain = ""
    for line in lines:
        cur = line.strip()
        if cur.startswith("- **Tags:**"):
            tags.extend(extract_tags(cur))
        elif cur.startswith("- **imageSpec:**"):
            image_spec = cur.split(":**", 1)[1].strip()
        elif re.match(r"^-\s*([A-D])\.\s*(.+)$", cur):
            om = re.match(r"^-\s*([A-D])\.\s*(.+)$", cur)
            if om:
                opts[om.group(1)] = om.group(2).strip()
        elif re.match(r"^(?:-\s*)?\*\*Đáp án:\*\*\s*\*\*([A-D])\*\*", cur):
            ans = re.match(r"^(?:-\s*)?\*\*Đáp án:\*\*\s*\*\*([A-D])\*\*", cur).group(1)
        elif re.match(r"^(?:-\s*)?\*\*Giải thích:\*\*\s*(.+)$", cur):
            explain = re.match(r"^(?:-\s*)?\*\*Giải thích:\*\*\s*(.+)$", cur).group(1).strip()
    return [{
        "id": did,
        "questionType": "depiction",
        "skill": "depiction",
        "imageSpec": image_spec,
        "q": "Xem mô tả/tranh và chọn nhận định đúng với nội dung.",
        "options": opts,
        "answer": ans,
        "explain": explain,
        "tags": list(dict.fromkeys(tags)),
        "vocabIds": extract_vocab_ids(explain),
    }]


def parse_test_reading_or_listening(lines: list[str], qtype: str, skill: str) -> list[dict[str, Any]]:
    """Parse L04 reading section (either table + blockquote OR **T11** blocks)."""
    passage_lines: list[str] = []
    tbl_lines: list[str] = []
    i = 0
    n = len(lines)
    while i < n:
        s = lines[i].strip()
        if s.startswith(">"):
            passage_lines.append(md_inline_to_html(s.lstrip(">").strip()))
        elif s.startswith("| ID |"):
            while i < n and lines[i].strip().startswith("|"):
                tbl_lines.append(lines[i])
                i += 1
            continue
        i += 1
    if tbl_lines:
        qs = parse_quiz_table(tbl_lines, qtype, skill)
        return [{"id": "R01", "title": "Phần 2 — 短文読解", "passageHtml": "<br>".join(passage_lines), "questions": qs}]
    # P02-L04 style
    qs = parse_question_blocks(lines, qtype, skill)
    return [{"id": "R01", "title": "Phần 2 — Đọc hiểu", "passageHtml": "<br>".join(passage_lines), "questions": qs}]


def parse_test_listening_section(lines: list[str], lesson_id: str) -> list[dict[str, Any]]:
    """Parse L04 Phần 3 — Nghe (either #### Bài nghe A/B or **T15** blocks)."""
    items: list[dict[str, Any]] = []
    # Check for #### Bài nghe
    sub_blocks: list[tuple[str, list[str]]] = []
    cur_h = ""
    cur_l: list[str] = []
    for line in lines:
        if re.match(r"^#{3,4}\s+Bài nghe", line):
            if cur_h:
                sub_blocks.append((cur_h, cur_l))
            cur_h = re.sub(r"^#{3,4}\s+", "", line).strip()
            cur_l = []
        else:
            cur_l.append(line)
    if cur_h:
        sub_blocks.append((cur_h, cur_l))

    if sub_blocks:
        for h, bl in sub_blocks:
            id_m = re.search(r"`([A-Z0-9-]+)`", h)
            aid = id_m.group(1) if id_m else f"{lesson_id}-A01"
            jp_lines, vn_lines, tbl_lines = [], [], []
            state = "meta"
            for l in bl:
                s = l.strip()
                if s.startswith("**Script (JP"):
                    state = "jp"
                    continue
                if s.startswith("**Dịch (VN"):
                    state = "vn"
                    continue
                if s.startswith("| ID |"):
                    state = "q"
                if state == "jp" and s.startswith(">"):
                    jp_lines.append(s)
                elif state == "vn" and s.startswith(">"):
                    vn_lines.append(s)
                elif state == "q" and s.startswith("|"):
                    tbl_lines.append(l)
            items.append({
                "id": aid,
                "title": strip_md(h),
                "doc": "",
                "lines": parse_dialogue_lines(jp_lines),
                "translation": parse_translation_lines(vn_lines),
                "questions": parse_quiz_table(tbl_lines, "listening", "listening"),
            })
        return items

    # P02-L04 style (**T15**..**T20** each with its own Script)
    cur_t_lines: list[str] = []
    blocks: list[list[str]] = []
    for l in lines:
        if re.match(r"^\*\*T\d+\*\*", l.strip()):
            if cur_t_lines:
                blocks.append(cur_t_lines)
            cur_t_lines = [l]
        elif cur_t_lines:
            cur_t_lines.append(l)
    if cur_t_lines:
        blocks.append(cur_t_lines)

    for b in blocks:
        aid_m = re.search(r"\*Audio ID:\*\s*`([^`]+)`", "\n".join(b))
        aid = aid_m.group(1) if aid_m else f"{lesson_id}-A"
        jp_lines = [l for l in b if l.strip().startswith(">")]
        qs = parse_question_blocks(b, "listening", "listening")
        items.append({
            "id": aid,
            "title": f"Nghe {aid}",
            "doc": "",
            "lines": parse_dialogue_lines(jp_lines),
            "translation": [],
            "questions": qs,
        })
    return items


def parse_file(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    lessons: list[dict[str, Any]] = []
    cur_id = ""
    cur_title = ""
    cur_lines: list[str] = []

    for line in lines:
        m = re.match(r"^#{1,2}\s+LESSON\s+(P\d{2}-L\d{2})\s+[—-]\s+(.+)$", line.strip())
        if m:
            if cur_id:
                lessons.append(parse_lesson_block(cur_id, cur_title, cur_id[:3], cur_lines))
            cur_id = m.group(1)
            cur_title = strip_md(m.group(2))
            cur_lines = []
        elif line.startswith("## Bảng chấm điểm"):
            if cur_id:
                lessons.append(parse_lesson_block(cur_id, cur_title, cur_id[:3], cur_lines))
                cur_id = ""
                cur_lines = []
        elif cur_id:
            cur_lines.append(line)

    if cur_id:
        lessons.append(parse_lesson_block(cur_id, cur_title, cur_id[:3], cur_lines))
    return lessons


def main() -> int:
    LESSONS_DIR.mkdir(parents=True, exist_ok=True)
    md_files = sorted(glob.glob(str(ROOT / "0[4-9]-*.md")) + glob.glob(str(ROOT / "1[0-3]-*.md")))
    if not md_files:
        print("ERROR: No lesson markdown files (04..13-*.md) found in", ROOT)
        return 1

    all_lessons: list[dict[str, Any]] = []
    for f in md_files:
        all_lessons.extend(parse_file(Path(f)))

    # Build index.json & review-pool.json & write lesson JSONs
    parts_map: dict[str, dict[str, Any]] = {}
    review_vocab: list[dict[str, Any]] = []
    review_questions: list[dict[str, Any]] = []

    seen_ids: dict[str, str] = {}
    warnings: list[str] = []

    for les in all_lessons:
        lid = les["id"]
        part = les["part"]
        if part not in parts_map:
            parts_map[part] = {
                "id": part,
                "title": PART_TITLES.get(part, part),
                "lessons": [],
            }

        # Write lesson JSON
        out_path = LESSONS_DIR / f"{lid}.json"
        out_path.write_text(json.dumps(les, ensure_ascii=False, indent=2), encoding="utf-8")

        # Count practice questions
        practice_count = (
            sum(len(x["questions"]) for x in les["listening"])
            + sum(len(x["questions"]) for x in les["reading"])
            + len(les["expression"])
            + len(les["grammar"])
            + len(les["depiction"])
        )

        parts_map[part]["lessons"].append({
            "id": lid,
            "title": les["title"],
            "isTest": les["isTest"],
            "vocabCount": len(les["vocab"]),
            "quizCount": les["vocabQuiz"]["total"],
            "passAt": les["vocabQuiz"]["passAt"],
            "listeningCount": len(les["listening"]),
            "practiceCount": practice_count,
        })

        for v in les["vocab"]:
            review_vocab.append({**v, "lessonId": lid, "part": part})

        # Collect all questions for review-pool + validation
        all_q = list(les["vocabQuiz"]["items"])
        for lr in les["listening"]:
            all_q.extend(lr["questions"])
        for rd in les["reading"]:
            all_q.extend(rd["questions"])
        all_q.extend(les["expression"])
        all_q.extend(les["grammar"])
        all_q.extend(les["depiction"])

        for q in all_q:
            qid = q["id"]
            if qid in seen_ids:
                warnings.append(f"Duplicate question ID: {qid} (in {seen_ids[qid]} and {lid})")
            else:
                seen_ids[qid] = lid
            if q["answer"] not in {"A", "B", "C", "D"}:
                warnings.append(f"Invalid/missing answer for {qid} in {lid}: {q['answer']!r}")
            if not q["options"]:
                warnings.append(f"No options parsed for {qid} in {lid}")
            review_questions.append({**q, "lessonId": lid, "part": part})

        # Check vocab coverage in vocabQuiz
        quiz_explains = " ".join(q["explain"] + " " + q["q"] for q in les["vocabQuiz"]["items"])
        missing_v = [v["id"] for v in les["vocab"] if v["id"] not in quiz_explains and v["word"] not in quiz_explains]
        if missing_v and not les["isTest"]:
            warnings.append(f"{lid}: vocab not mentioned in quiz: {', '.join(missing_v)}")

    index_data = {
        "version": "2.2.2",
        "parts": [parts_map[k] for k in sorted(parts_map.keys())],
    }
    (DATA_DIR / "index.json").write_text(json.dumps(index_data, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "review-pool.json").write_text(
        json.dumps({"vocab": review_vocab, "questions": review_questions}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Print verification report
    print("=== BJT J2 PARSER REPORT ===")
    for les in all_lessons:
        print(
            f"  {les['id']}: vocab={len(les['vocab'])}, "
            f"vocabQuiz={les['vocabQuiz']['total']} (pass>={les['vocabQuiz']['passAt']}), "
            f"listening={len(les['listening'])}, reading={len(les['reading'])}, "
            f"expr={len(les['expression'])}, grammar={len(les['grammar'])}, depiction={len(les['depiction'])}"
        )
    print(f"Total: {len(all_lessons)} lessons, {len(review_vocab)} vocab entries, {len(review_questions)} questions.")
    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings:
            print("  -", w)
    else:
        print("\nNo warnings!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
