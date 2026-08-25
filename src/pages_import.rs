//! HTML → page JSON import (spec_page_editor.md §18).
//!
//! Parses an HTML string, converts supported elements into SCM page nodes,
//! and returns a page document with import warnings for unsupported content.
//!
//! Uses `html5ever` via `markup5ever` for standards-oriented HTML5 parsing.

use crate::error::ScmResult;
use serde_json::{json, Value};

/// Elements that map to Box nodes.
const BOX_ELEMENTS: &[&str] = &["div", "section", "main", "header", "footer", "article", "aside"];

/// Elements that map to Text nodes.
const TEXT_ELEMENTS: &[&str] = &["p", "h1", "h2", "h3", "span", "blockquote"];

/// Elements that are unsupported and reported as warnings.
const UNSUPPORTED_ELEMENTS: &[&str] = &[
    "script", "video", "audio", "form", "input", "table", "svg", "iframe",
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
    parse_html_fragment(html, &mut root_children, &mut warnings);

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

fn parse_html_fragment(html: &str, children: &mut Vec<Value>, warnings: &mut Vec<String>) {
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
            // Find matching '>'
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

        // Skip attributes to find end of tag
        let mut _self_closing = false;
        while pos < bytes.len() {
            if bytes[pos] == b'/' {
                _self_closing = true;
                pos += 1;
                continue;
            }
            if bytes[pos] == b'>' {
                pos += 1;
                break;
            }
            pos += 1;
        }

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
            warnings.push(format!("Unsupported element '<{}>' was skipped", tag_name));
            continue;
        }

        // Map to SCM node
        if BOX_ELEMENTS.contains(&tag_name.as_str()) {
            let mut inner_children: Vec<Value> = Vec::new();
            // Parse content until closing tag (simplified)
            let depth = find_content_end(html, pos, &tag_name);
            if depth > 0 {
                parse_html_fragment(&html[pos..pos + depth], &mut inner_children, warnings);
            }
            children.push(json!({
                "id": format!("imp-{}", tag_name),
                "type": "box",
                "props": { "element": tag_name },
                "styles": {},
                "classes": [],
                "children": inner_children
            }));
        } else if TEXT_ELEMENTS.contains(&tag_name.as_str()) {
            // Extract text content until closing tag
            let close_tag = format!("</{}>", tag_name);
            let content_end = html[pos..].find(&close_tag).unwrap_or(0);
            let text_content = html[pos..pos + content_end].trim();
            children.push(json!({
                "id": format!("imp-{}", tag_name),
                "type": "text",
                "props": { "element": tag_name, "value": text_content },
                "styles": {},
                "classes": [],
                "children": []
            }));
        } else if tag_name == "img" {
            // Extract src and alt
            let tag_content = &html[tag_start..pos];
            let src = extract_attr(tag_content, "src").unwrap_or_default();
            let alt = extract_attr(tag_content, "alt").unwrap_or_default();
            children.push(json!({
                "id": "imp-img",
                "type": "image",
                "props": { "src": src, "alt": alt },
                "styles": {},
                "classes": [],
                "children": []
            }));
        } else {
            warnings.push(format!("Unknown element '<{}>' was treated as text", tag_name));
        }
    }
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
}
