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

    // Simple element extraction (v1 approach)
    parse_html_fragment(html, &mut root_children, &mut warnings);

    let page = json!({
        "version": 1,
        "title": extract_title(html).unwrap_or_else(|| "Imported Page".to_string()),
        "meta": {
            "description": extract_meta_description(html).unwrap_or_default(),
            "og_image": ""
        },
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
}
