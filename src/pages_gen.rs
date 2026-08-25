//! Static HTML generation from page JSON documents (spec_page_editor.md §16).
//!
//! Converts a page tree into a complete static HTML file with generated CSS,
//! escaped text, valid element nesting, and filename-based output mapping.

use crate::error::{ScmError, ScmResult};
use serde_json::Value;
use std::path::Path;

/// Supported Box semantic elements.
const BOX_ELEMENTS: &[&str] = &["div", "section", "header", "main", "footer", "article", "aside"];

/// Supported Text semantic elements.
const TEXT_ELEMENTS: &[&str] = &["p", "h1", "h2", "h3", "span", "blockquote"];

/// CSS properties that are emitted as inline styles.
const SUPPORTED_CSS_PROPS: &[&str] = &[
    "display",
    "width",
    "max-width",
    "min-height",
    "margin",
    "padding",
    "gap",
    "color",
    "background-color",
    "font-size",
    "font-weight",
    "line-height",
    "text-align",
    "border",
    "border-radius",
    "box-shadow",
    "flex-direction",
    "justify-content",
    "align-items",
    "grid-template-columns",
];

/// Generate static HTML from a page JSON document.
/// Returns the output path relative to the checkout root.
pub fn generate_html(checkout: &Path, page_name: &str, doc: &Value) -> ScmResult<String> {
    // Validate basic structure
    validate_document(doc)?;

    let title = doc
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled");
    let description = doc
        .get("meta")
        .and_then(|m| m.get("description"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let root = doc.get("root").ok_or_else(|| {
        ScmError::invalid_json("Page document must have a 'root' node")
    })?;

    // Collect reusable classes used by the page
    let mut used_classes = Vec::new();
    collect_used_classes(root, &mut used_classes);

    let classes_array = doc
        .get("classes")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    // Build CSS
    let mut css = String::new();
    // Reusable class CSS
    for class_def in &classes_array {
        let name = class_def.get("name").and_then(|v| v.as_str());
        let styles = class_def.get("styles");
        if let (Some(name), Some(styles)) = (name, styles) {
            if used_classes.iter().any(|c| c == name) {
                if let Some(obj) = styles.as_object() {
                    css.push_str(&format!(".{} {{\n", name));
                    for (prop, val) in obj {
                        if SUPPORTED_CSS_PROPS.contains(&prop.as_str()) {
                            if let Some(s) = val.as_str() {
                                css.push_str(&format!("  {}: {};\n", prop, s));
                            }
                        }
                    }
                    css.push_str("}\n");
                }
            }
        }
    }
    // Inline style rules (collected during node rendering)
    let mut inline_styles = Vec::new();
    collect_inline_styles(root, &mut inline_styles);
    for (id, styles) in &inline_styles {
        if let Some(obj) = styles.as_object() {
            if !obj.is_empty() {
                css.push_str(&format!("#{} {{\n", id));
                for (prop, val) in obj {
                    if SUPPORTED_CSS_PROPS.contains(&prop.as_str()) {
                        if let Some(s) = val.as_str() {
                            css.push_str(&format!("  {}: {};\n", prop, s));
                        }
                    }
                }
                css.push_str("}\n");
            }
        }
    }

    // Build body HTML
    let body_html = render_node(root)?;

    // Assemble full document
    let html = format!(
        r#"<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>{desc_section}
  <style>
{css}</style>
</head>
<body>
{body_html}
</body>
</html>
"#,
        title = escape_attr(title),
        desc_section = if description.is_empty() {
            String::new()
        } else {
            format!("\n  <meta name=\"description\" content=\"{}\">", escape_attr(description))
        },
        css = css,
        body_html = body_html,
    );

    // Determine output path
    let (output_path, output_dir) = if page_name == "index.json" {
        (checkout.join("index.html"), checkout.to_path_buf())
    } else {
        let stem = page_name.trim_end_matches(".json");
        let pages_dir = checkout.join("pages");
        (
            pages_dir.join(format!("{}.html", stem)),
            pages_dir,
        )
    };

    // Ensure output directory exists
    if !output_dir.is_dir() {
        std::fs::create_dir_all(&output_dir).map_err(|e| {
            ScmError::filesystem("Could not create output directory")
                .with_detail(e.to_string())
        })?;
    }

    // Atomic write
    write_atomic(&output_path, &html)?;

    // Return relative path
    let rel = output_path.strip_prefix(checkout).unwrap_or(&output_path);
    Ok(rel.to_string_lossy().into_owned())
}

fn validate_document(doc: &Value) -> ScmResult<()> {
    let version = doc.get("version").and_then(|v| v.as_u64());
    if version != Some(1) {
        return Err(ScmError::invalid_json("Page document version must be 1"));
    }
    let root = doc.get("root").ok_or_else(|| {
        ScmError::invalid_json("Page document must have a 'root' node")
    })?;
    validate_node(root, &mut Vec::new())?;
    Ok(())
}

fn validate_node(node: &Value, seen_ids: &mut Vec<String>) -> ScmResult<()> {
    let id = node.get("id").and_then(|v| v.as_str()).ok_or_else(|| {
        ScmError::invalid_json("Every node must have an 'id'")
    })?;
    if seen_ids.contains(&id.to_string()) {
        return Err(ScmError::invalid_json(format!("Duplicate node id '{id}'")));
    }
    seen_ids.push(id.to_string());

    let node_type = node.get("type").and_then(|v| v.as_str()).ok_or_else(|| {
        ScmError::invalid_json(format!("Node '{id}' must have a 'type'"))
    })?;

    match node_type {
        "box" => {
            let element = node
                .get("props")
                .and_then(|p| p.get("element"))
                .and_then(|v| v.as_str())
                .unwrap_or("div");
            if !BOX_ELEMENTS.contains(&element) {
                return Err(ScmError::invalid_json(format!(
                    "Box '{id}' has unsupported element '{element}'"
                )));
            }
            if let Some(children) = node.get("children").and_then(|v| v.as_array()) {
                for child in children {
                    validate_node(child, seen_ids)?;
                }
            }
        }
        "text" => {
            let element = node
                .get("props")
                .and_then(|p| p.get("element"))
                .and_then(|v| v.as_str())
                .unwrap_or("p");
            if !TEXT_ELEMENTS.contains(&element) {
                return Err(ScmError::invalid_json(format!(
                    "Text '{id}' has unsupported element '{element}'"
                )));
            }
        }
        "image" => {
            let src = node
                .get("props")
                .and_then(|p| p.get("src"))
                .and_then(|v| v.as_str());
            if src.is_none() {
                return Err(ScmError::invalid_json(format!(
                    "Image '{id}' must have a 'src' property"
                )));
            }
            // Reject absolute filesystem paths
            if let Some(s) = src {
                if s.starts_with('/') || s.contains("..") || s.contains("\\") {
                    return Err(ScmError::invalid_json(format!(
                        "Image '{id}' has unsafe src path"
                    )));
                }
            }
            let alt = node
                .get("props")
                .and_then(|p| p.get("alt"));
            if alt.is_none() || alt.and_then(|v| v.as_str()).unwrap_or("").is_empty() {
                return Err(ScmError::invalid_json(format!(
                    "Image '{id}' must have a non-empty 'alt' property"
                )));
            }
        }
        other => {
            return Err(ScmError::invalid_json(format!(
                "Unknown component type '{other}' in node '{id}'"
            )));
        }
    }
    Ok(())
}

fn render_node(node: &Value) -> ScmResult<String> {
    let id = node.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let node_type = node.get("type").and_then(|v| v.as_str()).unwrap_or("box");
    let classes = node
        .get("classes")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|c| c.as_str())
                .collect::<Vec<_>>()
                .join(" ")
        })
        .unwrap_or_default();
    let styles = node
        .get("styles")
        .and_then(|v| v.as_object())
        .map(|obj| {
            obj.iter()
                .filter(|(k, _)| SUPPORTED_CSS_PROPS.contains(&k.as_str()))
                .filter_map(|(k, v)| v.as_str().map(|s| format!("{}: {}", k, s)))
                .collect::<Vec<_>>()
                .join("; ")
        })
        .unwrap_or_default();

    let mut attrs = String::new();
    if !id.is_empty() && id != "root" {
        attrs.push_str(&format!(" id=\"{}\"", escape_attr(id)));
    }
    if !classes.is_empty() {
        attrs.push_str(&format!(" class=\"{}\"", escape_attr(&classes)));
    }
    if !styles.is_empty() {
        attrs.push_str(&format!(" style=\"{}\"", escape_attr(&styles)));
    }

    match node_type {
        "box" => {
            let element = node
                .get("props")
                .and_then(|p| p.get("element"))
                .and_then(|v| v.as_str())
                .unwrap_or("div");
            let children_html = node
                .get("children")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .map(|c| render_node(c))
                        .collect::<Result<Vec<_>, _>>()
                        .map(|v| v.join("\n"))
                })
                .transpose()?
                .unwrap_or_default();
            Ok(format!(
                "<{element}{attrs}>\n{children_html}\n</{element}>"
            ))
        }
        "text" => {
            let element = node
                .get("props")
                .and_then(|p| p.get("element"))
                .and_then(|v| v.as_str())
                .unwrap_or("p");
            let content = node
                .get("props")
                .and_then(|p| p.get("value"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            Ok(format!(
                "<{element}{attrs}>{content}</{element}>",
                content = escape_text(content),
            ))
        }
        "image" => {
            let src = node
                .get("props")
                .and_then(|p| p.get("src"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let alt = node
                .get("props")
                .and_then(|p| p.get("alt"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            Ok(format!("<img{attrs} src=\"{}\" alt=\"{}\">", escape_attr(src), escape_attr(alt)))
        }
        _ => Err(ScmError::internal(format!("Unknown type '{node_type}'"))),
    }
}

fn collect_used_classes(node: &Value, out: &mut Vec<String>) {
    if let Some(classes) = node.get("classes").and_then(|v| v.as_array()) {
        for c in classes {
            if let Some(name) = c.as_str() {
                if !out.contains(&name.to_string()) {
                    out.push(name.to_string());
                }
            }
        }
    }
    if let Some(children) = node.get("children").and_then(|v| v.as_array()) {
        for child in children {
            collect_used_classes(child, out);
        }
    }
}

fn collect_inline_styles(node: &Value, out: &mut Vec<(String, Value)>) {
    let id = node.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let styles = node.get("styles");
    if let Some(s) = styles {
        if let Some(obj) = s.as_object() {
            if !obj.is_empty() {
                out.push((id.to_string(), s.clone()));
            }
        }
    }
    if let Some(children) = node.get("children").and_then(|v| v.as_array()) {
        for child in children {
            collect_inline_styles(child, out);
        }
    }
}

fn escape_text(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

fn escape_attr(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('"', "&quot;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

fn write_atomic(path: &Path, body: &str) -> ScmResult<()> {
    use std::io::Write;
    let tmp = path.with_file_name(format!(
        ".{}.tmp",
        path.file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default()
    ));
    let write_result = (|| -> std::io::Result<()> {
        let mut f = std::fs::File::create(&tmp)?;
        f.write_all(body.as_bytes())?;
        f.flush()?;
        f.sync_all()?;
        drop(f);
        std::fs::rename(&tmp, path)?;
        Ok(())
    })();
    match write_result {
        Ok(()) => Ok(()),
        Err(e) => {
            let _ = std::fs::remove_file(&tmp);
            Err(ScmError::filesystem(format!(
                "Could not write '{}'",
                path.display()
            ))
            .with_detail(e.to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn validates_version() {
        let doc = json!({"version": 2, "root": {"id": "r", "type": "box", "props": {"element": "div"}, "styles": {}, "classes": [], "children": []}});
        assert!(validate_document(&doc).is_err());
    }

    #[test]
    fn validates_duplicate_ids() {
        let doc = json!({
            "version": 1,
            "root": {
                "id": "a",
                "type": "box",
                "props": {"element": "div"},
                "styles": {},
                "classes": [],
                "children": [
                    {"id": "a", "type": "text", "props": {"element": "p", "value": "hi"}, "styles": {}, "classes": []}
                ]
            }
        });
        assert!(validate_document(&doc).is_err());
    }

    #[test]
    fn validates_image_requires_alt() {
        let doc = json!({
            "version": 1,
            "root": {
                "id": "r",
                "type": "box",
                "props": {"element": "div"},
                "styles": {},
                "classes": [],
                "children": [
                    {"id": "img1", "type": "image", "props": {"src": "./media/a.png", "alt": ""}, "styles": {}, "classes": []}
                ]
            }
        });
        assert!(validate_document(&doc).is_err());
    }

    #[test]
    fn escape_text_works() {
        assert_eq!(escape_text("a < b & c > d"), "a &lt; b &amp; c &gt; d");
    }

    #[test]
    fn escape_attr_works() {
        assert_eq!(escape_attr(r#"a "b" c&#x27;d"#), "a &quot;b&quot; c&amp;#x27;d");
    }
}
