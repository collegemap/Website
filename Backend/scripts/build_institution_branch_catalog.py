#!/usr/bin/env python3
"""
Build Backend/data/institutionBranchCatalog.json (+ mirror src/data/) from:
  - Backend/data/iitBranchCatalog.json (IIT)
  - Nit_data.pdf (NIT)
  - IIIT_DATA.pdf (IIIT)

Requires: pip install pypdf
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "Backend"
DATA = BACKEND / "data"
IIT_JSON = DATA / "iitBranchCatalog.json"
IIIT_JSON = DATA / "iiitBranchCatalog.json"
NIT_PDF = ROOT / "Nit_data.pdf"
IIIT_PDF = ROOT / "IIIT_DATA.pdf"
OUT_BACKEND = DATA / "institutionBranchCatalog.json"
PRIVATE_JSON = DATA / "privateBranchCatalog.json"
OUT_SRC = ROOT / "src" / "data" / "institutionBranchCatalog.json"

try:
    from pypdf import PdfReader
except ImportError:
    print("Install pypdf: pip install pypdf", file=sys.stderr)
    sys.exit(1)


def pdf_text(path: Path) -> str:
    r = PdfReader(str(path))
    return re.sub(r"\s+", " ", "\n".join((p.extract_text() or "") for p in r.pages))


# --- NIT ---------------------------------------------------------------------

CITY_PAT = r"((?:[A-Z][a-z]+(?: [A-Z][a-z]+)*))(?=[A-Z][a-z])"

NIT_BLOCKS = [
    (r"(?:Dr\. B R Ambedkar )?National Institute of Technology,? ?", "National Institute of Technology"),
    (r"Visvesvaraya National Institute of Technology,? ?", "Visvesvaraya National Institute of Technology"),
    (r"Maulana Azad National Institute of Technology ", "Maulana Azad National Institute of Technology"),
    (r"Sardar Vallabhbhai National Institute of Technology,? ?", "Sardar Vallabhbhai National Institute of Technology"),
    (r"Malaviya National Institute of Technology ", "Malaviya National Institute of Technology"),
    (r"Motilal Nehru National Institute of Technology ", "Motilal Nehru National Institute of Technology"),
]

PROG_END_NIT = re.compile(
    r"^([A-Z][A-Za-z0-9 \&\./,+&-]{2,150}?)"
    r"\s*\(\d+\s+Years?,\s*"
    r"(?:Bachelor of Technology|Bachelor of Architecture|Bachelor of Science|Bachelor of Planning|Integrated[^)]{5,120})\)"
)

NIT_CANONICAL = {
    "National Institute of Technology, Nagpur": "Visvesvaraya National Institute of Technology, Nagpur",
    "Visvesvaraya National Institute of Technology Nagpur": "Visvesvaraya National Institute of Technology, Nagpur",
    "National Institute of Technology, Surat": "Sardar Vallabhbhai National Institute of Technology, Surat",
    "Sardar Vallabhbhai National Institute of Technology Surat": "Sardar Vallabhbhai National Institute of Technology, Surat",
    "National Institute of Technology, Jaipur": "Malaviya National Institute of Technology, Jaipur",
    "Malaviya National Institute of Technology Jaipur": "Malaviya National Institute of Technology, Jaipur",
    "National Institute of Technology, Allahabad": "Motilal Nehru National Institute of Technology, Allahabad",
    "Motilal Nehru National Institute of Technology Allahabad": "Motilal Nehru National Institute of Technology, Allahabad",
    "National Institute of Technology, Bhopal": "Maulana Azad National Institute of Technology, Bhopal",
    "Maulana Azad National Institute of Technology Bhopal": "Maulana Azad National Institute of Technology, Bhopal",
}


def parse_nit(full: str) -> dict[str, set[str]]:
    inst_prog: dict[str, set[str]] = defaultdict(set)
    for prefix_re, inst_base in NIT_BLOCKS:
        rx = re.compile(prefix_re + CITY_PAT)
        for m in rx.finditer(full):
            city = m.group(1).strip()
            start = m.end()
            rest = full[start : start + 280]
            pm = PROG_END_NIT.match(rest)
            if not pm:
                continue
            prog = re.sub(r"\s+", " ", pm.group(1).strip())
            if inst_base == "National Institute of Technology":
                if m.group(0).lstrip().startswith("Dr"):
                    inst = f"Dr. B R Ambedkar National Institute of Technology, {city}"
                else:
                    inst = f"National Institute of Technology, {city}"
            elif inst_base == "Visvesvaraya National Institute of Technology":
                inst = f"Visvesvaraya National Institute of Technology, {city}"
            elif inst_base == "Maulana Azad National Institute of Technology":
                inst = f"Maulana Azad National Institute of Technology, {city}"
            elif inst_base == "Sardar Vallabhbhai National Institute of Technology":
                inst = f"Sardar Vallabhbhai National Institute of Technology, {city}"
            elif inst_base == "Malaviya National Institute of Technology":
                inst = f"Malaviya National Institute of Technology, {city}"
            elif inst_base == "Motilal Nehru National Institute of Technology":
                inst = f"Motilal Nehru National Institute of Technology, {city}"
            else:
                inst = f"{inst_base} {city}"
            inst = NIT_CANONICAL.get(inst, inst)
            inst_prog[inst].add(prog)
    return inst_prog


# --- IIIT --------------------------------------------------------------------

DEGREE_CLOSE = re.compile(
    r"(?:Bachelor of Technology|Bachelor of Science|Bachelor of Design)\)"
    r"|Integrated B\. Tech[^)]+\)"
    r"|Integrated M\. Tech[^)]+\)"
    r"|Integrated[^)]{5,220}\)"
)

DEGREE_OPEN = re.compile(
    r"\(\d+\s+Years?,\s*"
    r"(?:Bachelor of Technology|Bachelor of Science|Bachelor of Design|Integrated[^)]{5,220})\)"
)

INST_MARKERS = sorted(
    (
        "Atal Bihari Vajpayee Indian Institute of Information Technology & Management Gwalior",
        "Pt. Dwarka Prasad Mishra Indian Institute of Information Technology",
        "Indian Institute of Information Technology (IIIT)",
        "Indian Institute of Information Technology(IIIT)",
        "Indian Institute of Information Technology",
        "Indian institute of information technology",
    ),
    key=len,
    reverse=True,
)

PROG_PREFIXES = sorted(
    (
        "Computer Science and Engineering (with ",
        "Electronics and Communication Engineering (with ",
        "Computer Science and Engineering ",
        "Electronics and Communication Engineering ",
        "Electrical and Electronics Engineering ",
        "Electrical Engineering ",
        "Computer Science ",
        "Electronics and Communication ",
        "Information Technology ",
        "Artificial Intelligence and Data Science ",
        "Artificial Intelligence ",
        "Mathematics and Computing ",
        "Mathematics ",
        "Integrated ",
        "Data Science and Artificial Intelligence ",
        "Data Science ",
        "Civil Engineering ",
        "Mechanical Engineering ",
        "Chemical Engineering ",
        "Smart Manufacturing ",
    ),
    key=len,
    reverse=True,
)


def strip_leading_quota(s: str) -> str:
    s = s.strip()
    for _ in range(80):
        orig = s
        s = re.sub(r"^[\d\s]+", "", s)
        s = re.sub(
            r"^(?:AI[A-Z0-9-]{2,35}|AIOBC-NCL)(?:\s*\(PwD\))?"
            r"(?:\s+Female-only\s*\(including\s+Supernumerary\))?\s*Gender-Neutral\s*[\d\s]+",
            "",
            s,
            flags=re.I,
        )
        s = re.sub(
            r"^(?:AI[A-Z0-9-]{2,35}|AIOBC-NCL)(?:\s*\(PwD\))?"
            r"(?:\s+Female-only\s*\(including\s+Supernumerary\))?\s*Gender-Neutral",
            "",
            s,
            flags=re.I,
        )
        s = re.sub(r"^Gender-Neutral\s*[\d\s]+", "", s, flags=re.I)
        s = re.sub(r"^Gender-Neutral", "", s, flags=re.I)
        s = re.sub(r"^AISC\s*(?:\(PwD\)\s*)?Gender-Neutral\s*[\d\s]+", "", s, flags=re.I)
        s = re.sub(r"^AIST\s*Female-only\s*\(including\s+Supernumerary\)\s*[\d\s]+", "", s, flags=re.I)
        s = re.sub(r"^AIST\s*Gender-Neutral\s*[\d\s]+", "", s, flags=re.I)
        if s == orig:
            break
    return s.strip()


def find_institute_start(b: str) -> int:
    for mk in INST_MARKERS:
        i = b.find(mk)
        if i >= 0:
            return i
    return 0


def split_institute_and_program(rest: str) -> tuple[str, str]:
    """Split '...CityComputer Science...' or '...City Computer Science...'.

    JoSAA text often has 'of Information' (f + I). Use the **last** [a-z][A-Z]
    boundary where the tail looks like a degree program, not the first.
    """
    best_at: int | None = None
    for m in re.finditer(r"([a-z])\s*([A-Z])", rest):
        tail = rest[m.start(2) :]
        ok = False
        for pfx in PROG_PREFIXES:
            p = pfx.rstrip()
            if tail.startswith(pfx) or tail.startswith(p):
                ok = True
                break
        if not ok:
            first = tail.split(None, 1)[0] if tail else ""
            # Do not treat leading "Information" as a program (avoids "of Information").
            if first in (
                "Computer",
                "Electronics",
                "Electrical",
                "Artificial",
                "Mathematics",
                "Integrated",
                "Data",
                "Civil",
                "Mechanical",
                "Chemical",
                "Smart",
            ):
                ok = True
        if ok:
            best_at = m.start(2)
    if best_at is not None:
        inst = rest[:best_at].strip()
        prog = re.sub(r"\s+", " ", rest[best_at:].strip())
        return inst, prog
    return rest.strip(), ""


def normalize_iiit_name(name: str) -> str:
    n = re.sub(r"\s+", " ", name.strip())
    n = re.sub(
        r"Indian Institute of Information Technology\s*\(\s*IIIT\s*\)",
        "Indian Institute of Information Technology (IIIT)",
        n,
        flags=re.I,
    )
    n = re.sub(
        r"Indian institute of information technology",
        "Indian Institute of Information Technology",
        n,
        flags=re.I,
    )
    return n


def parse_iiit(full: str) -> dict[str, set[str]]:
    inst_prog: dict[str, set[str]] = defaultdict(set)
    for om in DEGREE_OPEN.finditer(full):
        q = om.start()
        left = full[:q]
        last_end = None
        for cm in DEGREE_CLOSE.finditer(left):
            last_end = cm.end()
        if last_end is None:
            continue
        chunk = full[last_end:q]
        b = strip_leading_quota(chunk)
        if "Round 1" in b or "QuotaSeat" in b or "Academic Program Name" in b:
            continue
        i0 = find_institute_start(b)
        rest = b[i0:].strip()
        if len(rest) < 28:
            continue
        if "Information Technology" not in rest and "Atal Bihari" not in rest:
            continue
        inst, prog = split_institute_and_program(rest)
        if not prog or len(prog) < 4:
            continue
        inst = normalize_iiit_name(inst)
        if "Round 1" in inst:
            continue
        inst_prog[inst].add(prog)
    return inst_prog


def merge_iiit_duplicates(d: dict[str, set[str]]) -> dict[str, list[str]]:
    """Merge keys that only differ by IIIT spacing etc."""
    canon: dict[str, set[str]] = defaultdict(set)
    for k, v in d.items():
        nk = normalize_iiit_name(k)
        canon[nk].update(v)
    return {k: sorted(v) for k, v in sorted(canon.items())}


def main() -> None:
    if not IIT_JSON.is_file():
        print(f"Missing {IIT_JSON}", file=sys.stderr)
        sys.exit(1)
    iit_raw = json.loads(IIT_JSON.read_text(encoding="utf8"))
    iit_map = iit_raw.get("branchesByCollege") or {}
    iit_out = {k: list(v) for k, v in sorted(iit_map.items())}

    nit_full = pdf_text(NIT_PDF) if NIT_PDF.is_file() else ""
    iiit_full = pdf_text(IIIT_PDF) if IIIT_PDF.is_file() else ""

    nit_parsed = parse_nit(nit_full) if nit_full else {}
    nit_out = {k: sorted(v) for k, v in sorted(nit_parsed.items())}

    if IIIT_JSON.is_file():
        iiit_raw = json.loads(IIIT_JSON.read_text(encoding="utf8"))
        iiit_out = {k: list(v) for k, v in sorted((iiit_raw.get("branchesByCollege") or {}).items())}
    else:
        iiit_parsed = parse_iiit(iiit_full) if iiit_full else {}
        iiit_out = merge_iiit_duplicates(iiit_parsed)


    private_data = {}
    if PRIVATE_JSON.is_file():
        try:
            private_data = json.loads(PRIVATE_JSON.read_text(encoding="utf8"))
        except Exception as e:
            print(f"Error reading private catalog: {e}", file=sys.stderr)

    doc = {
        "_meta": {
            "IIT": str(IIT_JSON.relative_to(ROOT)),
            "NIT": str(NIT_PDF.relative_to(ROOT)) if NIT_PDF.is_file() else None,
            "IIIT": str(IIIT_JSON.relative_to(ROOT)) if IIIT_JSON.is_file() else (
                str(IIIT_PDF.relative_to(ROOT)) if IIIT_PDF.is_file() else None
            ),
            "private": str(PRIVATE_JSON.relative_to(ROOT)) if PRIVATE_JSON.is_file() else None,
        },
        "IIT": {"branchesByCollege": iit_out},
        "NIT": {"branchesByCollege": nit_out},
        "IIIT": {"branchesByCollege": iiit_out},
    }
    

    for key, val in private_data.items():
        if key != "_meta":
            doc[key] = val

    private_merged: dict[str, list[str]] = {}
    for key in ("BITS", "VIT", "SRM", "Amrita", "Other top colleges"):
        section = doc.get(key, {}).get("branchesByCollege") or {}
        for college, branches in section.items():
            if branches:
                private_merged[college] = list(branches)
    doc["Private"] = {"branchesByCollege": dict(sorted(private_merged.items()))}

    # doc = {
    #     "_meta": {
    #         "IIT": str(IIT_JSON.relative_to(ROOT)),
    #         "NIT": str(NIT_PDF.relative_to(ROOT)) if NIT_PDF.is_file() else None,
    #         "IIIT": str(IIIT_PDF.relative_to(ROOT)) if IIIT_PDF.is_file() else None,
    #     },
    #     "IIT": {"branchesByCollege": iit_out},
    #     "NIT": {"branchesByCollege": nit_out},
    #     "IIIT": {"branchesByCollege": iiit_out},
    # }

    OUT_BACKEND.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    OUT_SRC.parent.mkdir(parents=True, exist_ok=True)
    OUT_SRC.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(
        f"Wrote {OUT_BACKEND} and {OUT_SRC} — "
        f"IIT {len(iit_out)}, NIT {len(nit_out)}, IIIT {len(iiit_out)} colleges"
    )


if __name__ == "__main__":
    main()
