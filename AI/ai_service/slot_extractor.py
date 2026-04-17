import re
import difflib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List


# -----------------------------
# Basic normalizers
# -----------------------------
def _norm_space(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _urdu_digits_to_latin(s: str) -> str:
    trans = str.maketrans({
        "٠": "0", "۰": "0",
        "١": "1", "۱": "1",
        "٢": "2", "۲": "2",
        "٣": "3", "۳": "3",
        "٤": "4", "۴": "4",
        "٥": "5", "۵": "5",
        "٦": "6", "۶": "6",
        "٧": "7", "۷": "7",
        "٨": "8", "۸": "8",
        "٩": "9", "۹": "9",
    })
    return s.translate(trans)


def normalize_text(text: str) -> str:
    text = _urdu_digits_to_latin(text or "")
    # Urdu/Arabic punctuation normalize
    text = (
        text.replace("،", " ")
            .replace("۔", " ")
            .replace("?", " ")
            .replace("؟", " ")
            .replace(",", " ")
            .replace(".", " ")
    )
    return _norm_space(text.lower())


# -----------------------------
# Date / Time
# -----------------------------
def resolve_relative_date(norm_text: str) -> Optional[str]:
    today = datetime.now().date()

    if "kal" in norm_text or "کل" in norm_text or "tomorrow" in norm_text:
        return (today + timedelta(days=1)).isoformat()
    if "parso" in norm_text or "پرسوں" in norm_text or "day after tomorrow" in norm_text:
        return (today + timedelta(days=2)).isoformat()
    if "aaj" in norm_text or "آج" in norm_text or "today" in norm_text:
        return today.isoformat()

    m = re.search(r"next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", norm_text)
    if m:
        target = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].index(m.group(1))
        d = today
        while True:
            d = d + timedelta(days=1)
            if d.weekday() == target:
                return d.isoformat()
    return None


def extract_time(norm_text: str) -> Optional[str]:
    m = re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|بجے)?\b", norm_text)
    if not m:
        return None

    hour = int(m.group(1))
    minute = int(m.group(2) or 0)
    suffix = (m.group(3) or "").lower()

    if hour < 0 or hour > 23:
        # if 12-hour style expected, allow 1-12 only
        if hour < 1 or hour > 12:
            return None

    # 12-hour conversion when am/pm
    if suffix == "pm" and 1 <= hour <= 11:
        hour += 12
    if suffix == "am" and hour == 12:
        hour = 0

    return f"{hour:02d}:{minute:02d}"


# -----------------------------
# Seats / Provider / Payment
# -----------------------------
def extract_seats(norm_text: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {}

    # pick a small number as seats (1-10)
    m = re.search(r"\b(\d+)\b", norm_text)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 10:
            out["seat_count"] = n

    if "window" in norm_text or "ونڈو" in norm_text:
        out["seat_type"] = "window"
    elif "aisle" in norm_text or "آئل" in norm_text:
        out["seat_type"] = "aisle"
    elif "front" in norm_text or "فرنٹ" in norm_text:
        out["seat_type"] = "front"
    elif "back" in norm_text or "بیک" in norm_text:
        out["seat_type"] = "back"
    return out


def extract_provider(norm_text: str, providers: List[str]) -> Optional[str]:
    for p in providers:
        if p.lower() in norm_text:
            return p

    # common aliases
    if "daewoo" in norm_text or "داوو" in norm_text:
        return "Daewoo"
    if "faisal" in norm_text or "فیصل" in norm_text:
        return "Faisal Movers"
    if "skyways" in norm_text or "sky way" in norm_text:
        return "Skyways"
    if "baloch" in norm_text or "بلوچ" in norm_text:
        return "Baloch Transport"
    return None


def extract_payment(norm_text: str) -> Optional[str]:
    if "jazzcash" in norm_text or "jazz cash" in norm_text or "جاز کیش" in norm_text:
        return "jazzcash"
    if "cash" in norm_text or "نقد" in norm_text:
        return "cash"
    return None


# -----------------------------
# City alias + fuzzy nearest match
# -----------------------------
def _apply_city_aliases(norm_text: str, aliases: Dict[str, str], urdu_aliases: Dict[str, str]) -> str:
    # Urdu phrase aliases (longest first)
    for ur in sorted(urdu_aliases.keys(), key=len, reverse=True):
        if ur.lower() in norm_text:
            norm_text = norm_text.replace(ur.lower(), urdu_aliases[ur].lower())

    # token aliases for english/roman words
    tokens = re.findall(r"[a-zA-Z\u0600-\u06FF]+", norm_text)
    tokens = [aliases.get(t, t) for t in tokens]
    return " ".join([t.lower() for t in tokens])


def _cities_in_order(text_norm: str, cities: List[str]) -> List[str]:
    found = []
    for c in cities:
        pos = text_norm.find(c.lower())
        if pos != -1:
            found.append((pos, c))
    found.sort(key=lambda x: x[0])

    ordered = []
    seen = set()
    for _, c in found:
        if c not in seen:
            ordered.append(c)
            seen.add(c)
    return ordered


def _best_city_fuzzy(fragment: str, cities: List[str], threshold: float = 0.72) -> Optional[str]:
    """
    If exact city is not found, pick nearest city by similarity.
    threshold 0.72 works well for noisy Urdu transcripts.
    """
    frag = (fragment or "").strip().lower()
    if not frag:
        return None

    # Exact contains first
    for c in cities:
        if c.lower() in frag:
            return c

    # Fuzzy against city names (english)
    best_score = 0.0
    best_city = None
    for c in cities:
        score = difflib.SequenceMatcher(None, frag, c.lower()).ratio()
        if score > best_score:
            best_score = score
            best_city = c

    if best_city and best_score >= threshold:
        return best_city
    return None


def _try_pattern_from_to(text_norm: str, cities: List[str]) -> Dict[str, Optional[str]]:
    """
    Patterns:
      - "islamabad se lahore"
      - "islamabad سے lahore"
      - "from islamabad to lahore"
      - "islamabad to lahore"
    """

    se_patterns = [
        r"\b(.+?)\s+(?:se|sy|say|سے)\s+(.+?)\b",
    ]
    to_patterns = [
        r"\bfrom\s+(.+?)\s+to\s+(.+?)\b",
        r"\b(.+?)\s+to\s+(.+?)\b",
    ]

    def pick_city(fragment: str) -> Optional[str]:
        fragment = fragment.strip()
        # exact
        for c in cities:
            if c.lower() in fragment:
                return c
        # fuzzy nearest
        return _best_city_fuzzy(fragment, cities, threshold=0.72)

    for pat in se_patterns + to_patterns:
        m = re.search(pat, text_norm)
        if m:
            left = m.group(1)
            right = m.group(2)
            fc = pick_city(left)
            tc = pick_city(right)
            if fc or tc:
                return {"from": fc, "to": tc}

    return {"from": None, "to": None}


def extract_cities(norm_text: str, cities: List[str], aliases: Dict[str, str], urdu_aliases: Dict[str, str]) -> Dict[str, Optional[str]]:
    # Apply aliases first (urdu -> english)
    norm2 = _apply_city_aliases(norm_text, aliases, urdu_aliases)

    # Pattern-based first (best)
    pat_slots = _try_pattern_from_to(norm2, cities)
    if pat_slots["from"] or pat_slots["to"]:
        return pat_slots

    # Fallback: first two cities in appearance order
    ordered = _cities_in_order(norm2, cities)
    from_city = ordered[0] if len(ordered) >= 1 else None
    to_city = ordered[1] if len(ordered) >= 2 else None

    # If still missing, fuzzy on full sentence (helps when city didn't appear exactly)
    if not from_city:
        from_city = _best_city_fuzzy(norm2, cities, threshold=0.80)
    if not to_city:
        # try remove from_city word if found
        reduced = norm2
        if from_city:
            reduced = reduced.replace(from_city.lower(), " ")
        to_city = _best_city_fuzzy(reduced, cities, threshold=0.80)

    return {"from": from_city, "to": to_city}


# -----------------------------
# Main slots
# -----------------------------
def extract_slots(text: str, config: Dict[str, Any]) -> Dict[str, Any]:
    norm = normalize_text(text)
    slots: Dict[str, Any] = {}

    slots.update(
        extract_cities(
            norm,
            config.get("cities", []),
            config.get("city_aliases", {}),
            config.get("city_aliases_urdu", {}),
        )
    )

    date_iso = resolve_relative_date(norm)
    if date_iso:
        slots["date"] = date_iso

    time_iso = extract_time(norm)
    if time_iso:
        slots["time"] = time_iso

    prov = extract_provider(norm, config.get("providers", []))
    if prov:
        slots["provider"] = prov

    pay = extract_payment(norm)
    if pay:
        slots["payment_method"] = pay

    slots.update(extract_seats(norm))
    return slots