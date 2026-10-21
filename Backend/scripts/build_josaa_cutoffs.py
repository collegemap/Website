#!/usr/bin/env python3
"""
Build public/data/josaaCutoffs.json (+ Backend/data/) for College Predictor.

NIT / IIIT (JEE Main, JoSAA OR–CR style):
  1) Prefer JOSAA_NIT_2025.pdf and JOSAA_IIIT_2025.pdf in repo root (download from
     https://josaa.admissions.nic.in → Current OR–CR → export / save PDFs).
  2) Or set env and run with --fetch:
       export JOSAA_NIT_PDF_URL='https://...'
       export JOSAA_IIIT_PDF_URL='https://...'
       python3 Backend/scripts/build_josaa_cutoffs.py --fetch
  3) Else falls back to Nit_data.pdf / IIIT_DATA.pdf (legacy).

IIT: Jee-advanced-2025-IIT-rank.pdf (unchanged).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

NIT_2025 = ROOT / "JOSAA_NIT_2025.pdf"
IIIT_2025 = ROOT / "JOSAA_IIIT_2025.pdf"
NIT_FALLBACK = ROOT / "Nit_data.pdf"
IIIT_FALLBACK = ROOT / "IIIT_DATA.pdf"
IIT_PDF = ROOT / "Jee-advanced-2025-IIT-rank.pdf"
IIT_DATA_DIR = ROOT / "src" / "IIT DATA"
OUT_B = ROOT / "Backend" / "data" / "josaaCutoffs.json"
OUT_P = ROOT / "public" / "data" / "josaaCutoffs.json"

try:
    from pypdf import PdfReader
except ImportError:
    print("pip install pypdf", file=sys.stderr)
    sys.exit(1)


def pdf_one_line(path: Path) -> str:
    r = PdfReader(str(path))
    return re.sub(r"\s+", " ", "\n".join((p.extract_text() or "") for p in r.pages))


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "CollegeMapCutoffBuilder/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        dest.write_bytes(resp.read())


IIT_ROW_HEAD = re.compile(
    r"(\d+)\s+(Indian Institute of Technology[^\(]+?)\s+(.+?)\s+"
    r"\(\d+\s+Years,[^\)]+\)\s+"
    r"(B\.(?:Tech|Sc)\.|M\.Tech\. \(Dual\))\s+"
    r"(Gender-Neutral|Female-only)\s+"
)


def clean_iit_branch(branch: str) -> str:
    """Strip PDF glue: repeated IIT names, rank columns, and oversized captures."""
    b = (branch or "").strip()
    if not b:
        return b
    while True:
        j = b.find(" Indian Institute of Technology ", 1)
        if j <= 0:
            break
        b = b[:j].strip()
    # Drop trailing gender + rank blobs if regex captured past the programme name
    b = re.split(r"\s+Gender-Neutral(?:\s+\(PwD\))?\s+", b, maxsplit=1)[0].strip()
    b = re.split(r"\s+Female-only(?:\s+\(including Supernumerary\))?(?:\s+\(PwD\))?\s+", b, maxsplit=1)[0].strip()
    if len(b) > 220:
        b = b[:217].rsplit(" ", 1)[0] + "…"
    return b


def clean_iit_institute(institute: str) -> str:
    s = (institute or "").strip()
    if len(s) > 120:
        j = s.find(" Indian Institute of Technology ", 12)
        if j > 0:
            s = s[:j].strip()
        if len(s) > 120:
            s = s[:117].rsplit(" ", 1)[0] + "…"
    return s


def parse_iit_rank_tokens(tokens: list[str], start: int) -> tuple[list[tuple[int | None, int | None]], int]:
    pairs: list[tuple[int | None, int | None]] = []
    i = start
    while len(pairs) < 5 and i < len(tokens):
        if i + 1 < len(tokens) and tokens[i] == "NA" and tokens[i + 1] == "NA":
            pairs.append((None, None))
            i += 2
            continue
        if i + 1 < len(tokens) and re.match(r"^-?\d+P?$", tokens[i]) and re.match(r"^-?\d+P?$", tokens[i + 1]):
            a, b = tokens[i].replace("P", ""), tokens[i + 1].replace("P", "")
            if a.isdigit() and b.isdigit():
                pairs.append((int(a), int(b)))
            else:
                pairs.append((None, None))
            i += 2
            continue
        break
    return pairs, i


def parse_iit_pdf(full: str) -> list[dict]:
    entries: list[dict] = []
    pos = 0
    cat_labels = ["OPEN", "EWS", "OBC-NCL", "SC", "ST"]
    while pos < len(full):
        m = IIT_ROW_HEAD.search(full, pos)
        if not m:
            break
        institute, branch, _course, gender = m.group(2), m.group(3), m.group(4), m.group(5)
        institute = clean_iit_institute(institute)
        branch = clean_iit_branch(branch)
        tail_start = m.end()
        rest = full[tail_start:]
        tokens = rest.split()
        pairs, idx = parse_iit_rank_tokens(tokens, 0)
        if len(pairs) < 5:
            pos = tail_start + 1
            continue
        for ci, cat in enumerate(cat_labels):
            o, c = pairs[ci]
            if c is None:
                continue
            entries.append(
                {
                    "exam": "JEE_ADVANCED",
                    "institutionType": "IIT",
                    "institute": institute.strip(),
                    "branch": branch.strip(),
                    "gender": gender,
                    "quota": cat,
                    "openingRank": o,
                    "closingRank": c,
                }
            )
        if idx == 0:
            pos = tail_start
        else:
            pos = tail_start + len(" ".join(tokens[:idx])) + 1
        while pos < len(full) and full[pos] == " ":
            pos += 1
    return entries


def parse_iit_rank_value(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    s = str(value).strip().replace("P", "").replace("p", "")
    return int(s) if s.isdigit() else None


def normalize_iit_data_institute(name: str) -> str:
    s = (name or "").strip()
    if s.startswith("IIT "):
        return f"Indian Institute of Technology {s[4:]}"
    return s


def parse_iit_data_pwd_json() -> list[dict]:
    """PwD IIT cutoffs from src/IIT DATA/*.json (not in the IIT rank PDF)."""
    if not IIT_DATA_DIR.is_dir():
        return []
    entries: list[dict] = []
    for fp in sorted(IIT_DATA_DIR.glob("*.json")):
        try:
            doc = json.loads(fp.read_text(encoding="utf8"))
        except (OSError, json.JSONDecodeError):
            continue
        institute = normalize_iit_data_institute(doc.get("institute", ""))
        if not institute:
            continue
        year_blocks = doc.get("cutoffs") or {}
        rows = year_blocks.get("2025") or year_blocks.get("2024") or []
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            quota = str(row.get("category") or "").strip()
            if "(PwD)" not in quota:
                continue
            gender_raw = str(row.get("gender") or "")
            gender = "Female-only" if "Female" in gender_raw else "Gender-Neutral"
            branch = str(row.get("program") or "").strip()
            if not branch:
                continue
            opening = parse_iit_rank_value(
                row.get("last_round_opening_rank") if row.get("last_round_opening_rank") is not None
                else row.get("round_1_opening_rank")
            )
            closing = parse_iit_rank_value(
                row.get("last_round_closing_rank") if row.get("last_round_closing_rank") is not None
                else row.get("round_1_closing_rank")
            )
            if closing is None:
                continue
            entries.append(
                {
                    "exam": "JEE_ADVANCED",
                    "institutionType": "IIT",
                    "institute": institute,
                    "branch": branch,
                    "gender": gender,
                    "quota": quota,
                    "openingRank": opening,
                    "closingRank": closing,
                }
            )
    return entries


def split_glued_ranks(digits: str) -> tuple[int | None, int | None]:
    digits = re.sub(r"\s+", "", digits)
    if not digits.isdigit():
        return None, None
    best: tuple[int, int] | None = None
    for i in range(1, len(digits)):
        a = int(digits[:i])
        b = int(digits[i:])
        if 1 <= a <= 400000 and 1 <= b <= 400000 and a <= b:
            if best is None or (b - a) <= (best[1] - best[0]) + 100000 * (1 if b < best[1] else 0):
                best = (a, b)
    return best if best else (None, None)


MAIN_ROW = re.compile(
    r"\)(?P<quota>(?:AI|HS|OS|LA|GO)[A-Z0-9-]+(?:\s*\(PwD\))?)"
    r"(?P<gender>Female-only \(including Supernumerary\) \(PwD\)|Female-only \(including Supernumerary\)|"
    r"Gender-Neutral \(PwD\)|Gender-Neutral)"
    r"(?P<digits>\d[\d\s]{0,22})"
)

# Longest first — matched at MAIN_ROW's leading ")" (closing paren of academic program).
DEGREE_SUFFIXES: tuple[str, ...] = (
    "(5 Years, Bachelor of Science and Master of Science (Dual Degree))",
    "(5 Years, Bachelor and Master of Technology (Dual Degree))",
    "(5 Years, Integrated B. Tech. and M. Tech.)",
    "(5 Years, Integrated B. Tech. and MBA)",
    "(5 Years, Integrated Master of Science)",
    "(5 Years, Bachelor of Architecture)",
    "(4 Years, B. Tech / B. Tech (Hons.))",
    "(4 Years, Bachelor of Technology)",
    "(5 Years, Bachelor of Science)",
    "(4 Years, Bachelor of Architecture)",
    "(4 Years, Bachelor of Planning)",
)

# PDF text concatenates rows; take the last institute marker in the window before the degree "(".
_HEAD_MARKERS = re.compile(
    r"(Indian Institute of Information Technology|National Institute of Technology|"
    r"Indian Institute of Engineering Science and Technology|"
    r"Atal Bihari Vajpayee Indian Institute|Indian institute of information technology|"
    r"Pt\. Dwarka Prasad Mishra|Visvesvaraya National Institute|Maulana Azad National|"
    r"Sardar Vallabhbhai National|Malaviya National Institute|Motilal Nehru National|"
    r"Dr\. B R Ambedkar National Institute)",
    re.I,
)

_HEAD_WINDOW = 4000


def degree_start_index(full: str, close_idx: int) -> int | None:
    """Index of '(' starting the degree substring; close_idx is the closing ')' before quota (MAIN_ROW start)."""
    if close_idx < 0 or close_idx >= len(full) or full[close_idx] != ")":
        return None
    for suf in DEGREE_SUFFIXES:
        L = len(suf)
        if close_idx + 1 >= L and full[close_idx + 1 - L : close_idx + 1] == suf:
            return close_idx + 1 - L
    return None


def slice_institute_branch_head(full: str, degree_start: int) -> str:
    """Institute + branch text for this row only (PDF rows are glued without newlines)."""
    ws = max(0, degree_start - _HEAD_WINDOW)
    head_raw = full[ws:degree_start]
    markers = list(_HEAD_MARKERS.finditer(head_raw))
    if markers:
        head_raw = head_raw[markers[-1].start() :]
    return head_raw.strip()


def strip_main_header(inst: str) -> str:
    for mk in (
        "Dr. B R Ambedkar",
        "Visvesvaraya National",
        "Maulana Azad National",
        "Sardar Vallabhbhai",
        "Malaviya National",
        "Motilal Nehru National",
        "National Institute of Technology",
        "Atal Bihari",
        "Indian Institute of Information Technology",
        "Indian institute of information technology",
        "Pt. Dwarka",
    ):
        j = inst.find(mk)
        if j >= 0:
            return inst[j:].strip()
    return inst


def split_nit_iiit_institute_branch(head: str) -> tuple[str, str]:
    best: tuple[str, str] | None = None
    for m in re.finditer(r"([a-z])\s*([A-Z])", head):
        tail = head[m.start(2) :]
        if re.match(
            r"(Bio|Chemical|Civil|Computer|Electrical|Electronics|Mechanical|Mathematics|Physics|Production|"
            r"Architecture|Planning|Computational|Materials|Smart|Artificial|Data|Electronic|Mining|Energy|Industrial|"
            r"Ceramic|Aerospace|Textile|Food|Biotechnology|Metal|Bioinformatics|Integrated|Information)",
            tail,
        ):
            best = (head[: m.start(2)].strip(), tail.strip())
    return best if best else ("", "")


def parse_main_pdf(full: str, institution_type: str, exam: str) -> list[dict]:
    entries: list[dict] = []
    for m in MAIN_ROW.finditer(full):
        quota = m.group("quota")
        gender = m.group("gender")
        digit_blob = re.sub(r"\s+", "", m.group("digits"))
        op, cl = split_glued_ranks(digit_blob)
        if op is None or cl is None:
            continue
        deg_open = degree_start_index(full, m.start())
        if deg_open is None:
            continue
        head = slice_institute_branch_head(full, deg_open)
        head = re.sub(r"[\d\s]+$", "", head).strip()
        institute, branch = split_nit_iiit_institute_branch(head)
        if not branch or len(institute) < 18:
            continue
        institute = strip_main_header(institute)
        if len(institute) < 18:
            continue
        if quota.startswith("HS"):
            qn = "HOME_STATE"
        elif quota.startswith("OS"):
            qn = "OTHER_STATE"
        elif quota.startswith("AI"):
            qn = "ALL_INDIA"
        else:
            qn = "ALL_INDIA"
        entries.append(
            {
                "exam": exam,
                "institutionType": institution_type,
                "institute": re.sub(r"\s+", " ", institute),
                "branch": re.sub(r"\s+", " ", branch),
                "gender": gender,
                "quota": quota,
                "quotaPool": qn,
                "openingRank": op,
                "closingRank": cl,
            }
        )
    return entries


def resolve_nit_iiit() -> tuple[Path, Path, str]:
    """Returns (nit_path, iiit_path, year_label)."""
    nit_p = NIT_2025 if NIT_2025.is_file() else NIT_FALLBACK
    iiit_p = IIIT_2025 if IIIT_2025.is_file() else IIIT_FALLBACK
    n25, i25 = NIT_2025.is_file(), IIIT_2025.is_file()
    if n25 and i25:
        y = "2025"
    elif not n25 and not i25:
        y = "legacy"
    else:
        y = "mixed"
    return nit_p, iiit_p, y


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--fetch",
        action="store_true",
        help="Download PDFs from JOSAA_NIT_PDF_URL and JOSAA_IIIT_PDF_URL into repo root",
    )
    args = ap.parse_args()

    if args.fetch:
        nu = os.environ.get("JOSAA_NIT_PDF_URL", "").strip()
        iu = os.environ.get("JOSAA_IIIT_PDF_URL", "").strip()
        if nu:
            print("Downloading NIT PDF…")
            download(nu, NIT_2025)
        if iu:
            print("Downloading IIIT PDF…")
            download(iu, IIIT_2025)
        if not nu and not iu:
            print("Set JOSAA_NIT_PDF_URL / JOSAA_IIIT_PDF_URL (direct .pdf links)", file=sys.stderr)
            sys.exit(1)

    all_entries: list[dict] = []
    meta: dict[str, str] = {}

    if IIT_PDF.is_file():
        all_entries.extend(parse_iit_pdf(pdf_one_line(IIT_PDF)))
        meta["iit"] = "Jee-advanced-2025-IIT-rank.pdf"

    iit_pwd = parse_iit_data_pwd_json()
    if iit_pwd:
        all_entries.extend(iit_pwd)
        meta["iitPwdFromJson"] = len(iit_pwd)

    nit_path, iiit_path, nit_iiit_year = resolve_nit_iiit()
    meta["nitIiitYear"] = nit_iiit_year
    meta["nitFile"] = str(nit_path.relative_to(ROOT))
    meta["iiitFile"] = str(iiit_path.relative_to(ROOT))

    if iiit_path.is_file():
        all_entries.extend(parse_main_pdf(pdf_one_line(iiit_path), "IIIT", "JEE_MAIN"))

    if nit_path.is_file():
        all_entries.extend(parse_main_pdf(pdf_one_line(nit_path), "NIT", "JEE_MAIN"))

    doc = {
        "_meta": {
            **meta,
            "entryCount": len(all_entries),
        },
        "entries": all_entries,
    }

    OUT_B.parent.mkdir(parents=True, exist_ok=True)
    OUT_P.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(doc, ensure_ascii=False)
    OUT_B.write_text(text, encoding="utf8")
    OUT_P.write_text(text, encoding="utf8")
    print(f"Wrote {len(all_entries)} rows → {OUT_P}")
    if nit_iiit_year == "legacy":
        print("NIT/IIIT: using legacy PDFs. Add JOSAA_NIT_2025.pdf + JOSAA_IIIT_2025.pdf or use --fetch with URLs.")


if __name__ == "__main__":
    main()
