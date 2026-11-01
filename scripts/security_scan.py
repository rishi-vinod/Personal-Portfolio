"""Read-only privacy scan; prints locations/categories, never private values.

Run from the repository root: python3 scripts/security_scan.py
Checks current tracked files, nonignored new files, all reachable commits,
and ALL existing dist output (including the retained legacy build).
This is a heuristic review aid, not a proof that arbitrary secrets cannot exist.
"""
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


PATTERNS = {
    "email": re.compile(rb"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "private-key": re.compile(rb"-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----"),
    "known-token": re.compile(rb"(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})"),
    "phone": re.compile(rb"(?<!\w)(?:\+1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?!\w)"),
    "street": re.compile(rb"\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,5}(?:Street|Avenue|Road|Lane|Drive|Boulevard)\b", re.I),
    "credential-assignment": re.compile(rb"""(?i)(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"'\n]{8,}["']"""),
}
private_path = re.compile(r"(?:^|/)(?:\.env(?:\..*)?|private|\.private)(?:/|$)|\.(?:pdf|docx|pem|key)$", re.I)
private_values = []
env = ROOT / ".env.local"
if env.exists():
    for line in env.read_bytes().splitlines():
        if line.startswith(b"#") or b"=" not in line:
            continue
        key, value = line.split(b"=", 1)
        value = value.strip().strip(b"\"'")
        if re.search(rb"EMAIL|SECRET|TOKEN|PASSWORD|API_KEY", key) and value:
            private_values.append(value)

seen = set()
findings = []


def inspect(scope, name, raw):
    if private_path.search(name) and pathlib.PurePosixPath(name).name != ".env.example":
        findings.append((scope, name, "private-file"))
    for value in private_values:
        if value in raw:
            findings.append((scope, name, "PRIVATE-CONFIG-VALUE-EXPOSED"))
    for label, pattern in PATTERNS.items():
        for match in pattern.finditer(raw):
            value = match.group()
            key = (name, label, value)
            if key in seen:
                continue
            seen.add(key)
            if label == "email" and value.endswith((b"@example.com", b"@example.test")):
                label = "example-email-fixture"
            if label == "credential-assignment" and name.endswith(".test.ts"):
                label = "test-credential-fixture"
            findings.append((scope, name, label))
    if name.lower().endswith((".jpg", ".jpeg", ".png")):
        for marker in [b"Exif\x00\x00", b"eXIf", b"<x:xmpmeta", b"GPSLatitude", b"GPSLongitude"]:
            if marker in raw:
                findings.append((scope, name, "image-metadata-review"))
                break


tracked = git("ls-files", "-z").decode().split("\0")
new = git("ls-files", "--others", "--exclude-standard", "-z").decode().split("\0")
for scope, files in [("tracked-working-tree", tracked), ("new-working-tree", new)]:
    for name in filter(None, files):
        path = ROOT / name
        if path.is_file() and path.resolve().is_relative_to(ROOT):
            inspect(scope, name, path.read_bytes())
    print(scope, "files:", len(list(filter(None, files))))

revisions = git("rev-list", "--all").decode().splitlines()
for revision in revisions:
    for name in filter(None, git("ls-tree", "-r", "--name-only", "-z", revision).decode().split("\0")):
        inspect("history:" + revision[:7], name, git("show", revision + ":" + name))
print("Reachable commits:", len(revisions))

for name in sorted((ROOT / "dist").rglob("*")):
    if name.is_file():
        inspect("build-output", str(name.relative_to(ROOT)), name.read_bytes())

for scope, name, label in findings:
    print(scope, name, label)
print("Review categories:", len(findings))
exposures = [item for item in findings if item[2] in {"PRIVATE-CONFIG-VALUE-EXPOSED", "private-key", "known-token", "private-file"}]
print("High-confidence credential/private-file findings:", len(exposures))
raise SystemExit(1 if exposures else 0)
