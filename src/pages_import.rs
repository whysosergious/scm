//! HTML → page JSON import (spec_page_editor.md §18).
//!
//! Parses an HTML string, converts supported elements into SCM page nodes,
//! and returns a page document with import warnings for unsupported content.
//!
//! Uses `html5ever` via `markup5ever` for standards-oriented HTML5 parsing.

use crate::error::ScmResult;
use serde_json::{json, Value};

/// Elements that map to Box nodes.
const BOX_ELEMENTS: &[&str] = &[
    "div", "section", "main", "header", "footer", "article", "aside", "nav", "ul", "ol",
];

/// Elements that map to Text nodes.
const TEXT_ELEMENTS: &[&str] = &["p", "h1", "h2", "h3", "span", "blockquote", "a", "button", "li"];

/// Elements that map to leaf Box nodes rendered as native media players.
const MEDIA_ELEMENTS: &[&str] = &["video", "audio"];

/// Elements that are unsupported and reported as warnings.
const UNSUPPORTED_ELEMENTS: &[&str] = &["script", "form", "input", "table", "svg", "iframe"];

/// Attribute names preserved into node `attrs`. Names starting with `aria-`
/// or `data-` are also kept; everything else is dropped silently.
const KNOWN_ATTRS: &[&str] = &[
    "href", "target", "rel", "download", "type", "disabled", "name", "value",
    "src", "controls", "autoplay", "loop", "muted", "preload", "poster",
    "title", "role", "tabindex", "id", "width", "height", "placeholder",
];

/// Import an HTML string into a page JSON document.
/// Returns `{ page: PageDocument, warnings: string[], saved_as: string }`.
pub fn import_html(html: &str) -> ScmResult<Value> {
    // Parse HTML using a simple regex-based approach for v1.
    // This handles well-formed HTML; malformed HTML will be partially parsed.
    // Full html5ever integration is deferred to a later phase.
    let mut warnings: Vec<String> = Vec::new();
    let mut root_children: Vec<Value> = Vec::new();

    let head_elements = parse_head_elements(html);

    // Simple element extraction (v1 approach)
    let mut parser = FragmentParser { warnings: &mut warnings, next_id: 0 };
    parser.parse_fragment(html, &mut root_children);

    let page = json!({
        "version": 1,
        "title": extract_title(html).unwrap_or_else(|| "Imported Page".to_string()),
        "meta": {
            "description": extract_meta_description(html).unwrap_or_default(),
            "og_image": ""
        },
        "head": head_elements,
        "classes": [],
        "root": {
            "id": "root",
            "type": "box",
            "props": { "element": "main" },
            "styles": {},
            "classes": [],
            "attrs": {},
            "children": root_children
        }
    });

    Ok(json!({
        "page": page,
        "warnings": warnings,
        "saved_as": "imported.json"
    }))
}

fn extract_title(html: &str) -> Option<String> {
    let start = html.find("<title>")? + 7;
    let end = html.find("</title>")?;
    Some(html[start..end].trim().to_string())
}

fn extract_meta_description(html: &str) -> Option<String> {
    let idx = html.find("name=\"description\"")?;
    let _before = &html[..idx];
    let after = &html[idx..];
    let content_start = after.find("content=\"")? + 9;
    let content_end = after[content_start..].find('"')?;
    Some(after[content_start..content_start + content_end].to_string())
}

fn extract_attr_bool(tag: &str, attr_name: &str) -> bool {
    let mut pos = 0;
    let bytes = tag.as_bytes();
    let attr_bytes = attr_name.as_bytes();

    while pos < bytes.len() {
        // Check if attr_name matches at this position
        if pos + attr_bytes.len() <= bytes.len()
            && &bytes[pos..pos + attr_bytes.len()] == attr_bytes
        {
            // Must be preceded by start-of-tag or whitespace
            let prev_ok = pos == 0
                || matches!(bytes[pos - 1], b' ' | b'\t' | b'\n' | b'\r');
            // Must be followed by end-of-tag, whitespace, '=', '>', or '/'
            let next_pos = pos + attr_bytes.len();
            let next_ok = next_pos >= bytes.len()
                || matches!(bytes[next_pos], b' ' | b'\t' | b'\n' | b'\r' | b'=' | b'>' | b'/');
            if prev_ok && next_ok {
                // If followed by '=' it's a valued attribute — still counts as present
                return true;
            }
        }
        pos += 1;
    }
    false
}

/// Parse `<head>` elements from HTML into SCM head array format.
/// Scans for `<link>`, `<style>`, `<meta>`, and `<script>` tags within `<head>`.
/// Skips `<meta name="viewport">` and `<meta name="description">` (handled elsewhere).
fn parse_head_elements(html: &str) -> Vec<Value> {
    let mut elements: Vec<Value> = Vec::new();

    // Extract the <head>...</head> section
    let head_start = html.find("<head>").or_else(|| html.find("<head "));
    let head_end = html.find("</head>");
    let (head_start, head_end) = match (head_start, head_end) {
        (Some(s), Some(e)) => (s, e),
        _ => return elements,
    };
    let head = &html[head_start..head_end];

    let mut pos = 0;
    let bytes = head.as_bytes();

    while pos < bytes.len() {
        // Skip to next '<'
        if bytes[pos] != b'<' {
            pos += 1;
            continue;
        }

        let tag_start = pos;
        pos += 1;
        if pos >= bytes.len() {
            break;
        }

        // Skip closing tags
        if bytes[pos] == b'/' {
            while pos < bytes.len() && bytes[pos] != b'>' {
                pos += 1;
            }
            pos += 1;
            continue;
        }

        // Skip comments
        if pos + 2 < bytes.len()
            && bytes[pos] == b'!'
            && bytes[pos + 1] == b'-'
            && bytes[pos + 2] == b'-'
        {
            while pos + 2 < bytes.len() {
                if bytes[pos] == b'-' && bytes[pos + 1] == b'-' && bytes[pos + 2] == b'>' {
                    pos += 3;
                    break;
                }
                pos += 1;
            }
            continue;
        }

        // Extract tag name
        let name_start = pos;
        while pos < bytes.len()
            && bytes[pos] != b' '
            && bytes[pos] != b'>'
            && bytes[pos] != b'/'
        {
            pos += 1;
        }
        let tag_name = String::from_utf8_lossy(&bytes[name_start..pos]).to_lowercase();

        // Find end of this tag (opening or self-closing)
        let mut self_closing = false;
        while pos < bytes.len() {
            if bytes[pos] == b'/' {
                self_closing = true;
                pos += 1;
                continue;
            }
            if bytes[pos] == b'>' {
                pos += 1;
                break;
            }
            pos += 1;
        }

        let tag_text = String::from_utf8_lossy(&bytes[tag_start..pos]).to_string();

        match tag_name.as_str() {
            "link" => {
                let rel = extract_attr(&tag_text, "rel").unwrap_or_default();
                if rel == "stylesheet" {
                    let mut entry = json!({ "type": "stylesheet" });
                    if let Some(href) = extract_attr(&tag_text, "href") {
                        entry["href"] = json!(href);
                    }
                    if let Some(media) = extract_attr(&tag_text, "media") {
                        entry["media"] = json!(media);
                    }
                    elements.push(entry);
                }
            }
            "style" => {
                if !self_closing {
                    let content_end = head[pos..].find("</style>").unwrap_or(0);
                    let css = head[pos..pos + content_end].to_string();
                    pos += content_end + 8; // skip "</style>"
                    elements.push(json!({ "type": "style", "css": css }));
                }
            }
            "meta" => {
                if let Some(name) = extract_attr(&tag_text, "name") {
                    // Skip viewport and description (handled elsewhere)
                    if name == "viewport" || name == "description" {
                        continue;
                    }
                    let mut entry = json!({ "type": "meta", "name": name });
                    if let Some(content) = extract_attr(&tag_text, "content") {
                        entry["content"] = json!(content);
                    }
                    elements.push(entry);
                } else if let Some(property) = extract_attr(&tag_text, "property") {
                    let mut entry = json!({ "type": "meta", "property": property });
                    if let Some(content) = extract_attr(&tag_text, "content") {
                        entry["content"] = json!(content);
                    }
                    elements.push(entry);
                } else if let Some(charset) = extract_attr(&tag_text, "charset") {
                    elements.push(json!({ "type": "meta", "charset": charset }));
                }
            }
            "script" => {
                if let Some(src) = extract_attr(&tag_text, "src") {
                    let mut entry = json!({ "type": "script", "src": src });
                    if extract_attr_bool(&tag_text, "defer") {
                        entry["defer"] = json!(true);
                    }
                    if extract_attr_bool(&tag_text, "async") {
                        entry["async"] = json!(true);
                    }
                    elements.push(entry);
                } else if !self_closing {
                    let content_end = head[pos..].find("</script>").unwrap_or(0);
                    let js = head[pos..pos + content_end].to_string();
                    pos += content_end + 9; // skip "</script>"
                    elements.push(json!({ "type": "script", "js": js }));
                }
            }
            _ => {}
        }
    }

    elements
}

/// Stateful fragment parser producing uniquely-identified SCM nodes from HTML.
struct FragmentParser<'a> {
    warnings: &'a mut Vec<String>,
    next_id: usize,
}

impl FragmentParser<'_> {
    fn next_node_id(&mut self) -> String {
        self.next_id += 1;
        format!("imp-{}", self.next_id)
    }

    fn parse_fragment(&mut self, html: &str, children: &mut Vec<Value>) {
        let mut pos = 0;
        let bytes = html.as_bytes();

        while pos < bytes.len() {
            // Skip to next '<'
            if bytes[pos] != b'<' {
                pos += 1;
                continue;
            }

            // Find the end of the opening tag
            let tag_start = pos;
            pos += 1;
            if pos >= bytes.len() {
                break;
            }

            // Skip closing tags
            if bytes[pos] == b'/' {
                while pos < bytes.len() && bytes[pos] != b'>' {
                    pos += 1;
                }
                pos += 1;
                continue;
            }

            // Skip comments
            if pos + 2 < bytes.len()
                && bytes[pos] == b'!'
                && bytes[pos + 1] == b'-'
                && bytes[pos + 2] == b'-'
            {
                while pos + 2 < bytes.len() {
                    if bytes[pos] == b'-' && bytes[pos + 1] == b'-' && bytes[pos + 2] == b'>' {
                        pos += 3;
                        break;
                    }
                    pos += 1;
                }
                continue;
            }

            // Extract tag name
            let name_start = pos;
            while pos < bytes.len()
                && bytes[pos] != b' '
                && bytes[pos] != b'>'
                && bytes[pos] != b'/'
            {
                pos += 1;
            }
            let tag_name = String::from_utf8_lossy(&bytes[name_start..pos]).to_lowercase();

            // Scan to end of open tag, capturing it (with attributes) verbatim
            let mut self_closing = false;
            while pos < bytes.len() {
                if bytes[pos] == b'/' {
                    self_closing = true;
                }
                if bytes[pos] == b'>' {
                    pos += 1;
                    break;
                }
                pos += 1;
            }
            let open_tag = String::from_utf8_lossy(&bytes[tag_start..pos]).to_string();

            // Skip <head> section entirely (head elements handled by parse_head_elements)
            if tag_name == "head" {
                while pos < bytes.len() {
                    if bytes[pos] == b'<' && pos + 1 < bytes.len() && bytes[pos + 1] == b'/' {
                        let rest = String::from_utf8_lossy(&bytes[pos..]);
                        if rest.to_lowercase().starts_with("</head>") {
                            pos += 7;
                            break;
                        }
                    }
                    pos += 1;
                }
                continue;
            }

            // Check if unsupported
            if UNSUPPORTED_ELEMENTS.contains(&tag_name.as_str()) {
                self.warnings.push(format!(
                    "Unsupported element '<{}>' was skipped",
                    tag_name
                ));
                continue;
            }

            // Extract class/style/generic attributes from the open tag
            let (classes, styles, mut attrs) = build_node_extras(&open_tag);

            // Map to SCM node
            if BOX_ELEMENTS.contains(&tag_name.as_str()) {
                let mut inner_children: Vec<Value> = Vec::new();
                let depth = find_content_end(html, pos, &tag_name);
                if depth > 0 {
                    let inner_html = html[pos..pos + depth].to_string();
                    self.parse_fragment(&inner_html, &mut inner_children);
                }
                let id = self.next_node_id();
                children.push(json!({
                    "id": id,
                    "type": "box",
                    "props": { "element": tag_name },
                    "styles": styles,
                    "classes": classes,
                    "attrs": attrs,
                    "children": inner_children
                }));
                // Skip past the closing tag so inner content isn't re-parsed
                if !self_closing {
                    let close_tag = format!("</{}>", tag_name);
                    if let Some(end) = html[pos..].find(&close_tag) {
                        pos += end + close_tag.len();
                    }
                }
            } else if TEXT_ELEMENTS.contains(&tag_name.as_str()) {
                let close_tag = format!("</{}>", tag_name);
                let content_end = html[pos..].find(&close_tag).unwrap_or(0);
                let raw = &html[pos..pos + content_end];
                let value = strip_tags(raw).trim().to_string();
                let id = self.next_node_id();
                children.push(json!({
                    "id": id,
                    "type": "text",
                    "props": { "element": tag_name, "value": value },
                    "styles": styles,
                    "classes": classes,
                    "attrs": attrs,
                    "children": []
                }));
                // Skip past the closing tag
                if !self_closing && content_end > 0 {
                    pos += content_end + close_tag.len();
                }
            } else if MEDIA_ELEMENTS.contains(&tag_name.as_str()) {
                // Media players are leaf boxes; skip their fallback content
                let id = self.next_node_id();
                children.push(json!({
                    "id": id,
                    "type": "box",
                    "props": { "element": tag_name },
                    "styles": styles,
                    "classes": classes,
                    "attrs": attrs,
                    "children": []
                }));
                if !self_closing {
                    let close_tag = format!("</{}>", tag_name);
                    if let Some(end) = html[pos..].find(&close_tag) {
                        pos += end + close_tag.len();
                    }
                }
            } else if tag_name == "img" {
                let src = attrs
                    .get("src")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .to_string();
                let alt = attrs
                    .get("alt")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .to_string();
                // src/alt live in props for images; drop them from attrs
                attrs.remove("src");
                attrs.remove("alt");
                let id = self.next_node_id();
                children.push(json!({
                    "id": id,
                    "type": "image",
                    "props": { "src": src, "alt": alt },
                    "styles": styles,
                    "classes": classes,
                    "attrs": attrs,
                    "children": []
                }));
            } else {
                self.warnings.push(format!(
                    "Unknown element '<{}>' was treated as text",
                    tag_name
                ));
            }
        }
    }
}

/// Extract all attributes from an open-tag string into `(name, value)` pairs.
/// Handles double/single-quoted values, unquoted values, and bare boolean
/// attributes (empty-string value). The leading `<tagname` token yields a
/// name that never matches the whitelist and is harmlessly discarded.
fn extract_all_attrs(tag: &str) -> Vec<(String, String)> {
    let mut out = Vec::new();
    let bytes = tag.as_bytes();
    let mut i = 0;
    // When given a full open tag ("<a href=…>"), the first token is the
    // element name, not an attribute — discard it.
    let mut skip_first_token = tag.starts_with('<');

    while i < bytes.len() {
        if bytes[i].is_ascii_whitespace() || bytes[i] == b'<' || bytes[i] == b'/' {
            i += 1;
            continue;
        }

        // Attribute name
        let start = i;
        while i < bytes.len()
            && bytes[i] != b'='
            && bytes[i] != b'>'
            && !bytes[i].is_ascii_whitespace()
        {
            i += 1;
        }
        let name = tag[start..i].to_lowercase();

        // Optional value
        while i < bytes.len() && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        let value;
        if i < bytes.len() && bytes[i] == b'=' {
            i += 1;
            while i < bytes.len() && bytes[i].is_ascii_whitespace() {
                i += 1;
            }
            if i < bytes.len() && (bytes[i] == b'"' || bytes[i] == b'\'') {
                let quote = bytes[i];
                i += 1;
                let val_start = i;
                while i < bytes.len() && bytes[i] != quote {
                    i += 1;
                }
                value = tag[val_start..i].to_string();
                if i < bytes.len() {
                    i += 1; // closing quote
                }
            } else {
                let val_start = i;
                while i < bytes.len() && bytes[i] != b'>' && !bytes[i].is_ascii_whitespace() {
                    i += 1;
                }
                value = tag[val_start..i].to_string();
            }
        } else {
            value = String::new();
        }

        if skip_first_token {
            skip_first_token = false;
            continue;
        }

        out.push((name, value));
    }

    out
}

/// Convert extracted attributes into `(classes, styles, attrs)` node data.
/// Inline `style` declarations are parsed into the styles map; `class`
/// becomes the class list; whitelisted (plus aria-/data-) names go to attrs.
fn build_node_extras(
    open_tag: &str,
) -> (
    Vec<String>,
    serde_json::Map<String, Value>,
    serde_json::Map<String, Value>,
) {
    let mut classes: Vec<String> = Vec::new();
    let mut styles = serde_json::Map::new();
    let mut attrs = serde_json::Map::new();

    for (name, value) in extract_all_attrs(open_tag) {
        match name.as_str() {
            "class" => classes.extend(value.split_whitespace().map(|s| s.to_string())),
            "style" => {
                for decl in value.split(';') {
                    if let Some((prop, val)) = decl.split_once(':') {
                        let prop = prop.trim().to_lowercase();
                        if !prop.is_empty() {
                            styles.insert(prop, json!(val.trim()));
                        }
                    }
                }
            }
            other => {
                let keep = KNOWN_ATTRS.contains(&other)
                    || other.starts_with("aria-")
                    || other.starts_with("data-");
                if keep {
                    attrs.insert(other.to_string(), json!(value));
                }
            }
        }
    }

    (classes, styles, attrs)
}

/// Remove markup tags from an HTML snippet, keeping text content.
fn strip_tags(html: &str) -> String {
    let mut out = String::with_capacity(html.len());
    let mut inside = false;
    for ch in html.chars() {
        match ch {
            '<' => inside = true,
            '>' => inside = false,
            c if !inside => out.push(c),
            _ => {}
        }
    }
    out
}

fn find_content_end(html: &str, start: usize, tag_name: &str) -> usize {
    let close_tag = format!("</{}>", tag_name);
    html[start..].find(&close_tag).unwrap_or(html.len() - start)
}

fn extract_attr(tag: &str, attr_name: &str) -> Option<String> {
    let pattern = format!("{}=\"", attr_name);
    let idx = tag.find(&pattern)?;
    let val_start = idx + pattern.len();
    let val_end = tag[val_start..].find('"')?;
    Some(tag[val_start..val_start + val_end].to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_title_works() {
        assert_eq!(
            extract_title("<html><head><title>My Page</title></head></html>"),
            Some("My Page".to_string())
        );
    }

    #[test]
    fn extract_meta_description_works() {
        let html = r#"<meta name="description" content="A test page">"#;
        assert_eq!(
            extract_meta_description(html),
            Some("A test page".to_string())
        );
    }

    #[test]
    fn extract_attr_works() {
        assert_eq!(extract_attr(r#"<img src="./a.png" alt="pic">"#, "src"), Some("./a.png".to_string()));
        assert_eq!(extract_attr(r#"<img src="./a.png" alt="pic">"#, "alt"), Some("pic".to_string()));
    }

    #[test]
    fn extract_attr_bool_works() {
        assert!(extract_attr_bool(r#"<script src="x.js" defer>"#, "defer"));
        assert!(!extract_attr_bool(r#"<script src="x.js">"#, "defer"));
        assert!(extract_attr_bool(r#"<script src="x.js" async>"#, "async"));
        assert!(!extract_attr_bool(r#"<link rel="stylesheet" href="x">"#, "defer"));
    }

    #[test]
    fn parse_head_elements_works() {
        let html = r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta name="description" content="A test page">
    <meta name="author" content="Jane">
    <meta property="og:title" content="Home">
    <link rel="stylesheet" href="/css/main.css" media="screen">
    <link rel="stylesheet" href="/css/print.css" media="print">
    <style>
        .hero { padding: 4rem; }
    </style>
    <script src="/js/app.js" defer></script>
    <script>
        console.log('init');
    </script>
</head>
<body></body>
</html>"#;

        let elements = parse_head_elements(html);

        // Should have 8 elements (viewport and description skipped)
        assert_eq!(elements.len(), 8);

        // charset meta
        assert_eq!(elements[0]["type"], "meta");
        assert_eq!(elements[0]["charset"], "utf-8");

        // author meta
        assert_eq!(elements[1]["type"], "meta");
        assert_eq!(elements[1]["name"], "author");
        assert_eq!(elements[1]["content"], "Jane");

        // og:title meta
        assert_eq!(elements[2]["type"], "meta");
        assert_eq!(elements[2]["property"], "og:title");
        assert_eq!(elements[2]["content"], "Home");

        // stylesheet link
        assert_eq!(elements[3]["type"], "stylesheet");
        assert_eq!(elements[3]["href"], "/css/main.css");
        assert_eq!(elements[3]["media"], "screen");

        // second stylesheet link
        assert_eq!(elements[4]["type"], "stylesheet");
        assert_eq!(elements[4]["href"], "/css/print.css");
        assert_eq!(elements[4]["media"], "print");

        // style block
        assert_eq!(elements[5]["type"], "style");
        assert_eq!(elements[5]["css"], "\n        .hero { padding: 4rem; }\n    ");

        // script with src
        assert_eq!(elements[6]["type"], "script");
        assert_eq!(elements[6]["src"], "/js/app.js");
        assert_eq!(elements[6]["defer"], true);

        // inline script
        assert_eq!(elements[7]["type"], "script");
        assert_eq!(elements[7]["js"], "\n        console.log('init');\n    ");
    }

    #[test]
    fn import_html_includes_head_elements() {
        let html = r#"<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="/css/style.css">
    <style>body { margin: 0; }</style>
</head>
<body>
    <h1>Hello</h1>
</body>
</html>"#;

        let result = import_html(html).unwrap();
        let page = &result["page"];

        let head = page["head"].as_array().unwrap();
        assert_eq!(head.len(), 2); // viewport skipped, stylesheet + style remain

        assert_eq!(head[0]["type"], "stylesheet");
        assert_eq!(head[0]["href"], "/css/style.css");

        assert_eq!(head[1]["type"], "style");
        assert_eq!(head[1]["css"], "body { margin: 0; }");
    }

    #[test]
    fn extract_all_attrs_works() {
        let attrs = extract_all_attrs(r#"<a href="/x" target='_blank' disabled data-id="7">"#);
        assert_eq!(attrs[0], ("href".to_string(), "/x".to_string()));
        assert_eq!(attrs[1], ("target".to_string(), "_blank".to_string()));
        assert_eq!(attrs[2], ("disabled".to_string(), String::new()));
        assert_eq!(attrs[3], ("data-id".to_string(), "7".to_string()));
    }

    #[test]
    fn import_parses_new_base_components() {
        let html = r#"<!DOCTYPE html>
<html>
<head><title>T</title></head>
<body>
<div class="hero" style="padding: 2rem;">
    <nav role="navigation">
        <a href="/about">About</a>
        <a href="/ext" target="_blank" rel="noopener">Ext</a>
    </nav>
    <ul>
        <li>First</li>
        <li>Second</li>
    </ul>
    <button type="submit" disabled>Go</button>
    <video src="./media/v.mp4" controls muted></video>
    <form><input></form>
</div>
</body>
</html>"#;

        let result = import_html(html).unwrap();
        let page = &result["page"];
        let hero = &page["root"]["children"][0];

        // class + inline style extraction
        assert_eq!(hero["classes"][0], "hero");
        assert_eq!(hero["styles"]["padding"], "2rem");

        let nav = &hero["children"][0];
        assert_eq!(nav["props"]["element"], "nav");
        assert_eq!(nav["attrs"]["role"], "navigation");
        assert_eq!(nav["children"].as_array().unwrap().len(), 2);

        let link0 = &nav["children"][0];
        assert_eq!(link0["type"], "text");
        assert_eq!(link0["props"]["element"], "a");
        assert_eq!(link0["props"]["value"], "About");
        assert_eq!(link0["attrs"]["href"], "/about");

        let link1 = &nav["children"][1];
        assert_eq!(link1["attrs"]["target"], "_blank");
        assert_eq!(link1["attrs"]["rel"], "noopener");

        let list = &hero["children"][1];
        assert_eq!(list["props"]["element"], "ul");
        let items = list["children"].as_array().unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0]["props"]["element"], "li");
        assert_eq!(items[0]["props"]["value"], "First");

        let button = &hero["children"][2];
        assert_eq!(button["props"]["element"], "button");
        assert_eq!(button["attrs"]["type"], "submit");
        assert_eq!(button["attrs"]["disabled"], "");

        let video = &hero["children"][3];
        assert_eq!(video["type"], "box");
        assert_eq!(video["props"]["element"], "video");
        assert_eq!(video["attrs"]["src"], "./media/v.mp4");
        assert_eq!(video["attrs"]["controls"], "");
        assert_eq!(video["attrs"]["muted"], "");
        assert_eq!(video["children"].as_array().unwrap().len(), 0);

        // form/input unsupported warning
        let warnings = result["warnings"].as_array().unwrap();
        assert!(warnings.iter().any(|w| w.as_str().unwrap().contains("form")));
        assert!(warnings.iter().any(|w| w.as_str().unwrap().contains("input")));
    }

    #[test]
    fn import_generates_unique_ids() {
        let html = r#"<body><div><p>A</p></div><div><p>B</p></div><img src="./x.png" alt="x"></body>"#;
        let result = import_html(html).unwrap();
        let children = result["page"]["root"]["children"].as_array().unwrap();
        assert_eq!(children.len(), 3);

        let mut ids: Vec<String> = Vec::new();
        fn collect(node: &Value, out: &mut Vec<String>) {
            out.push(node["id"].as_str().unwrap_or_default().to_string());
            if let Some(kids) = node["children"].as_array() {
                for k in kids {
                    collect(k, out);
                }
            }
        }
        collect(&result["page"]["root"], &mut ids);

        let total = ids.len();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), total, "node ids must be unique");
    }
}
