# Magic Ingest — Polish Pass Design

## Scope

No new features. Polish the existing working ingest pipeline: menu bar status, rebrand, icon, store readiness.

## 1. Menu Bar Status

Replace `ingest-status.tsx` (full Detail view) with a `MenuBarExtra` command.

**Visibility:** Returns `null` when no PID file exists → invisible. Appears only during active ingest.

**Menu bar text:** `📸 Copying 450/2000…` (updates every 2s)

**Dropdown contents:**
- Section per card: card name + file count from that card
- Current stage (scanning/filtering/copying/verifying/renaming)
- Elapsed time
- Destination path
- Actions: Stop Ingest, Show in Finder, Open Log

**PID file format** (updated by runner at each stage):

```json
{
  "pid": 12345,
  "startedAt": "2026-03-13T10:30:00Z",
  "destDir": "/Users/x/Pictures/20260313_shoot",
  "cards": [
    { "name": "EOS_DIGITAL", "fileCount": 1200 },
    { "name": "NIKON_Z9", "fileCount": 800 }
  ],
  "stage": "copying",
  "progress": { "current": 450, "total": 2000 }
}
```

**Runner changes:** Add `writeProgress(stage, current, total)` helper that updates PID file. Call at: scan complete, filter complete, each copy batch (every 10 files), verify start, rename start, done.

**Command registration:** `mode: "menu-bar"` in package.json. Interval property set to poll every 2s.

## 2. Rebrand

- package.json: `name: "magic-ingest"`, `title: "Magic Ingest"`
- Command: "Magic Ingest" (main form), "Ingest Status" (menu bar)
- Notification strings: "Magic Ingest" prefix
- Runner notification strings updated

## 3. Icon

- 512x512 PNG
- 8-bit pixel art SD card (white/gray, corner notch, contact pins)
- Purple gradient background (#7C3AED → #4F46E5)
- Must be legible at 32x32 (Raycast menu bar size)

## 4. Store Readiness

- README.md with feature list, requirements (exiftool via homebrew), screenshots placeholder
- Proper package.json metadata (author, categories, description)
- Lint clean
- .gitignore includes .superpowers/
