"""Patch convert_octoparse.py for new Octoparse column format."""
p = 'scripts/convert_octoparse.py'
t = open(p, encoding='utf-8').read()

# Fix 1: extract artist from Field1 when details column is empty (new Octoparse format)
old1 = (
    '        artist   = get(row, "details")\n'
    '        details2 = get(row, "details2")\n'
    '        details4 = get(row, "details4")\n'
    '        details6 = get(row, "details6")\n'
    '\n'
    '        # Skip rows missing URL or artist\n'
    '        if not url or "setlist.fm" not in url or not artist:'
)
new1 = (
    '        artist   = get(row, "details")\n'
    '        details2 = get(row, "details2")\n'
    '        details4 = get(row, "details4")\n'
    '        details6 = get(row, "details6")\n'
    '\n'
    '        # Fallback: newer Octoparse format stores artist in Field1 as "Artist at Venue, City"\n'
    '        # and leaves the details column empty.\n'
    '        if not artist:\n'
    '            title = get(row, "Field1")\n'
    '            if " at " in title:\n'
    '                artist = title.split(" at ")[0].strip()\n'
    '\n'
    '        # Skip rows missing URL or artist\n'
    '        if not url or "setlist.fm" not in url or not artist:'
)

# Fix 2: strip comma in detect_city so "Washington, DC" maps to "washington dc"
old2 = (
    '    stem = re.sub(r"[\\s_-]+\\d{4}$", "", stem).strip()\n'
    '    return stem if stem in CITY_MAP else None'
)
new2 = (
    '    stem = re.sub(r"[\\s_-]+\\d{4}$", "", stem).strip()\n'
    '    stem = stem.replace(",", "")  # handle "Washington, DC" -> "washington dc"\n'
    '    return stem if stem in CITY_MAP else None'
)

assert old1 in t, "ERROR: Fix 1 anchor not found — script may have changed"
assert old2 in t, "ERROR: Fix 2 anchor not found — script may have changed"

t = t.replace(old1, new1).replace(old2, new2)
open(p, 'w', encoding='utf-8').write(t)
print("Done — convert_octoparse.py patched successfully")
