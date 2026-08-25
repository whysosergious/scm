# Headless e2e harness

`e2e-driver.js` is the full regression suite. It is NOT part of the app —
a throwaway harness page loads it alongside the real app.

Run (from repo root):

```bash
# 1. temp CWD with its own config + fresh fixture
rm -rf /tmp/scm-e2e /tmp/scm-e2e.git /tmp/scm-e2e-seed
git init -q --bare -b main /tmp/scm-e2e.git
git clone -q /tmp/scm-e2e.git /tmp/scm-e2e-seed
mkdir -p /tmp/scm-e2e-seed/content
cat > /tmp/scm-e2e-seed/content/posts.json <<'JSON'
{
  "site": { "name": "Demo", "views": 10 },
  "posts": [ { "id": 1, "title": "First" } ]
}
JSON
cd /tmp/scm-e2e-seed && git add -- . && git -c user.email=t@t -c user.name=t commit -qm seed && git push -q origin main

# 2. harness page + app copy
mkdir -p /tmp/scm-e2e
cp -r "$OLDPWD/web" /tmp/scm-e2e/web
python3 - <<'PY'
s=open('/tmp/scm-e2e/web/index.html').read()
s=s.replace('<script type="module" src="/web/scripts/main.js"></script>',
 '<script type="module" src="/web/scripts/main.js"></script>\n    <script type="module" src="/web/scripts/e2e-driver.js"></script>')
s=s.replace('<div id="toast-root" class="toast-stack"></div>',
 '<div id="toast-root" class="toast-stack"></div>\n    <pre id="e2e-results">running…</pre>')
open('/tmp/scm-e2e/web/e2e.html','w').write(s)
PY
cp "$OLDPWD/tools/e2e/e2e-driver.js" /tmp/scm-e2e/web/scripts/
cat > /tmp/scm-e2e/scm-config.json <<'JSON'
{
  "config_version": 1,
  "projects_dir": "projects",
  "projects": [
    { "id": "demo-site", "name": "Demo Site", "repo": "/tmp/scm-e2e.git", "branch": "main", "content_dir": "content" }
  ]
}
JSON

# 3. serve + run
cd /tmp/scm-e2e
(/path/to/scm/target/debug/wss_serve &>/dev/null & SPID=$!; sleep 1
google-chrome --headless=new --disable-gpu --no-sandbox --user-data-dir=/tmp/scm-prof \
  --virtual-time-budget=180000 --dump-dom "http://127.0.0.1:8080/web/e2e.html" </dev/null > dom.html 2>/dev/null
python3 -c "import re;h=open('dom.html').read();m=re.search(r'<pre id=\"e2e-results\">(.*?)</pre>',h,re.S);print(m.group(1) if m else 'NO RESULTS')"
kill $SPID)
```

Notes:
- Always start from a FRESH clone (rm -rf projects) — the suite mutates the doc.
- Use a fresh chrome --user-data-dir per run to avoid HTTP-cache ghosts.
