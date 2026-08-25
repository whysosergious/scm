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
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "z-index",
    "width",
    "max-width",
    "min-width",
    "height",
    "max-height",
    "min-height",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "gap",
    "flex-direction",
    "flex-wrap",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "justify-content",
    "align-items",
    "align-self",
    "grid-template-columns",
    "grid-template-rows",
    "grid-gap",
    "color",
    "background-color",
    "background-image",
    "font-size",
    "font-weight",
    "font-family",
    "line-height",
    "text-align",
    "text-decoration",
    "text-transform",
    "letter-spacing",
    "word-spacing",
    "white-space",
    "overflow",
    "overflow-x",
    "overflow-y",
    "border",
    "border-width",
    "border-style",
    "border-color",
    "border-radius",
    "box-shadow",
    "opacity",
    "cursor",
    "transition",
];

/// Generate static HTML from a page JSON document.
/// Returns the output path relative to the checkout root.
pub fn generate_html(checkout: &Path, page_name: &str, doc: &Value) -> ScmResult<String> {
    // Validate basic structure
    validate_document(doc)?;

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

    // Build head
    let head_html = build_head_html(doc, &css);

    // Assemble full document
    let html = format!(
        r#"<!doctype html>
<html lang="en">
{head_html}</head>
<body>
{body_html}
</body>
</html>
"#,
        head_html = head_html,
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
    validate_head_elements(doc)?;
    Ok(())
}

fn validate_head_elements(doc: &Value) -> ScmResult<()> {
    let head = match doc.get("head").and_then(|v| v.as_array()) {
        Some(arr) => arr,
        None => return Ok(()),
    };
    for (i, elem) in head.iter().enumerate() {
        let elem_type = elem.get("type").and_then(|v| v.as_str()).ok_or_else(|| {
            ScmError::invalid_json(format!("head element [{i}] must have a 'type'"))
        })?;
        match elem_type {
            "stylesheet" => {
                if elem.get("href").and_then(|v| v.as_str()).is_none() {
                    return Err(ScmError::invalid_json(format!(
                        "head element [{i}] type 'stylesheet' requires 'href'"
                    )));
                }
            }
            "meta" => {
                let has_name = elem.get("name").and_then(|v| v.as_str()).is_some();
                let has_property = elem.get("property").and_then(|v| v.as_str()).is_some();
                let has_charset = elem.get("charset").and_then(|v| v.as_str()).is_some();
                if !has_name && !has_property && !has_charset {
                    return Err(ScmError::invalid_json(format!(
                        "head element [{i}] type 'meta' requires at least one of 'name', 'property', or 'charset'"
                    )));
                }
            }
            "script" => {
                let has_src = elem.get("src").and_then(|v| v.as_str()).is_some();
                let has_js = elem.get("js").and_then(|v| v.as_str()).is_some();
                if !has_src && !has_js {
                    return Err(ScmError::invalid_json(format!(
                        "head element [{i}] type 'script' requires at least one of 'src' or 'js'"
                    )));
                }
            }
            "style" => {
                // css is optional — missing css produces empty <style></style>
            }
            other => {
                return Err(ScmError::invalid_json(format!(
                    "Unknown head element type '{other}' at index {i}"
                )));
            }
        }
    }
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

fn render_head_element(elem: &Value) -> String {
    let t = elem.get("type").and_then(|v| v.as_str()).unwrap_or("");
    match t {
        "stylesheet" => {
            let href = elem.get("href").and_then(|v| v.as_str()).unwrap_or("");
            let media_attr = elem
                .get("media")
                .and_then(|v| v.as_str())
                .map(|m| format!(" media=\"{}\"", escape_attr(m)))
                .unwrap_or_default();
            format!("<link rel=\"stylesheet\" href=\"{}\"{}>", escape_attr(href), media_attr)
        }
        "style" => {
            let css = elem.get("css").and_then(|v| v.as_str()).unwrap_or("");
            format!("<style>{css}</style>")
        }
        "meta" => {
            if let Some(charset) = elem.get("charset").and_then(|v| v.as_str()) {
                format!("<meta charset=\"{}\">", escape_attr(charset))
            } else if let Some(name) = elem.get("name").and_then(|v| v.as_str()) {
                let content = elem.get("content").and_then(|v| v.as_str()).unwrap_or("");
                format!(
                    "<meta name=\"{}\" content=\"{}\">",
                    escape_attr(name),
                    escape_attr(content)
                )
            } else if let Some(property) = elem.get("property").and_then(|v| v.as_str()) {
                let content = elem.get("content").and_then(|v| v.as_str()).unwrap_or("");
                format!(
                    "<meta property=\"{}\" content=\"{}\">",
                    escape_attr(property),
                    escape_attr(content)
                )
            } else {
                String::new()
            }
        }
        "script" => {
            if let Some(src) = elem.get("src").and_then(|v| v.as_str()) {
                let mut attrs = format!(" src=\"{}\"", escape_attr(src));
                if elem.get("defer").and_then(|v| v.as_bool()).unwrap_or(false) {
                    attrs.push_str(" defer");
                }
                if elem.get("async").and_then(|v| v.as_bool()).unwrap_or(false) {
                    attrs.push_str(" async");
                }
                format!("<script{attrs}></script>")
            } else {
                let js = elem.get("js").and_then(|v| v.as_str()).unwrap_or("");
                format!("<script>{js}</script>")
            }
        }
        _ => String::new(),
    }
}

fn build_head_html(doc: &Value, css: &str) -> String {
    let title = doc
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled");
    let description = doc
        .get("meta")
        .and_then(|m| m.get("description"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let og_image = doc
        .get("meta")
        .and_then(|m| m.get("og_image"))
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let head_elements = doc
        .get("head")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    // Categorize head elements
    let mut other_meta = Vec::new();
    let mut stylesheets = Vec::new();
    let mut styles = Vec::new();
    let mut defer_scripts = Vec::new();
    let mut blocking_scripts = Vec::new();

    for elem in &head_elements {
        let t = elem.get("type").and_then(|v| v.as_str()).unwrap_or("");
        match t {
            "meta" => {
                // Deduplication: skip head meta entries that duplicate legacy meta object
                if let Some(name) = elem.get("name").and_then(|v| v.as_str()) {
                    if name == "description" && !description.is_empty() {
                        continue;
                    }
                }
                if let Some(property) = elem.get("property").and_then(|v| v.as_str()) {
                    if property == "og:image" && !og_image.is_empty() {
                        continue;
                    }
                }
                other_meta.push(render_head_element(elem));
            }
            "stylesheet" => stylesheets.push(render_head_element(elem)),
            "style" => styles.push(render_head_element(elem)),
            "script" => {
                let is_defer_async = elem
                    .get("defer")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false)
                    || elem
                        .get("async")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                if is_defer_async {
                    defer_scripts.push(render_head_element(elem));
                } else {
                    blocking_scripts.push(render_head_element(elem));
                }
            }
            _ => {}
        }
    }

    // Build head in spec order
    let mut head = String::from("<head>\n");

    // 1. charset (always first)
    head.push_str("  <meta charset=\"utf-8\">\n");

    // 2. viewport (always present)
    head.push_str("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");

    // 3. other meta (deduplicated with legacy meta object)
    for m in &other_meta {
        head.push_str(&format!("  {m}\n"));
    }

    // Legacy description meta (if not already in head)
    if !description.is_empty() && !other_meta.iter().any(|m| m.contains("name=\"description\"")) {
        head.push_str(&format!(
            "  <meta name=\"description\" content=\"{}\">\n",
            escape_attr(description)
        ));
    }

    // Legacy og:image meta (if not already in head)
    if !og_image.is_empty() && !other_meta.iter().any(|m| m.contains("property=\"og:image\"")) {
        head.push_str(&format!(
            "  <meta property=\"og:image\" content=\"{}\">\n",
            escape_attr(og_image)
        ));
    }

    // 4. title (always present)
    head.push_str(&format!("  <title>{}</title>\n", escape_attr(title)));

    // 5. stylesheets
    for s in &stylesheets {
        head.push_str(&format!("  {s}\n"));
    }

    // 6. styles
    for s in &styles {
        head.push_str(&format!("  {s}\n"));
    }

    // 7. generated CSS
    if !css.is_empty() {
        head.push_str("  <style>\n");
        head.push_str(css);
        head.push_str("  </style>\n");
    }

    // 8. defer/async scripts
    for s in &defer_scripts {
        head.push_str(&format!("  {s}\n"));
    }

    // 9. blocking scripts
    for s in &blocking_scripts {
        head.push_str(&format!("  {s}\n"));
    }

    head
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

    #[test]
    fn head_elements_generated_in_order() {
        let doc = json!({
            "version": 1,
            "title": "Test Page",
            "meta": { "description": "A test", "og_image": "" },
            "head": [
                { "type": "meta", "name": "author", "content": "Jane" },
                { "type": "stylesheet", "href": "/css/main.css" },
                { "type": "stylesheet", "href": "/css/print.css", "media": "print" },
                { "type": "style", "css": ".hero { padding: 4rem; }" },
                { "type": "meta", "property": "og:title", "content": "Home" },
                { "type": "script", "src": "/js/app.js", "defer": true },
                { "type": "script", "src": "/js/counter.js", "async": true },
                { "type": "script", "js": "console.log('init');" },
                { "type": "meta", "charset": "utf-8" }
            ],
            "classes": [],
            "root": {
                "id": "root",
                "type": "box",
                "props": { "element": "main" },
                "styles": {},
                "classes": [],
                "children": []
            }
        });
        validate_document(&doc).unwrap();

        let css = "";
        let head = build_head_html(&doc, css);

        // charset meta is always first (after <head>)
        let after_head = head.strip_prefix("<head>\n").unwrap();
        assert!(after_head.starts_with("  <meta charset=\"utf-8\">"), "charset must be first, got: {after_head}");

        // viewport is second
        let lines: Vec<&str> = after_head.lines().collect();
        assert_eq!(lines[1], "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");

        // other meta after viewport (deduplicated: author, og:title, description from legacy meta)
        let joined = after_head.to_string();
        assert!(joined.contains("  <meta name=\"author\" content=\"Jane\">"));
        assert!(joined.contains("  <meta property=\"og:title\" content=\"Home\">"));
        assert!(joined.contains("  <meta name=\"description\" content=\"A test\">"));

        // title
        assert!(joined.contains("  <title>Test Page</title>"));

        // stylesheets
        assert!(joined.contains("  <link rel=\"stylesheet\" href=\"/css/main.css\">"));
        assert!(joined.contains("  <link rel=\"stylesheet\" href=\"/css/print.css\" media=\"print\">"));

        // style
        assert!(joined.contains("  <style>.hero { padding: 4rem; }</style>"));

        // defer/async scripts come before blocking
        let defer_pos = joined.find("defer").unwrap();
        let blocking_pos = joined.find("console.log").unwrap();
        assert!(defer_pos < blocking_pos, "defer script must come before blocking script");

        // blocking script is last element before </head>
        assert!(joined.trim_end().ends_with("  <script>console.log('init');</script>"));
    }

    #[test]
    fn head_deduplication_with_legacy_meta() {
        let doc = json!({
            "version": 1,
            "title": "T",
            "meta": { "description": "legacy desc", "og_image": "legacy.png" },
            "head": [
                { "type": "meta", "name": "description", "content": "head desc" },
                { "type": "meta", "property": "og:image", "content": "head.png" }
            ],
            "classes": [],
            "root": {
                "id": "root",
                "type": "box",
                "props": { "element": "div" },
                "styles": {},
                "classes": [],
                "children": []
            }
        });
        validate_document(&doc).unwrap();
        let head = build_head_html(&doc, "");

        // Legacy meta takes precedence — head duplicates are skipped
        assert!(head.contains("content=\"legacy desc\""), "should use legacy description");
        assert!(!head.contains("content=\"head desc\""), "should skip head description");
        assert!(head.contains("content=\"legacy.png\""), "should use legacy og_image");
        assert!(!head.contains("content=\"head.png\""), "should skip head og:image");
    }

    #[test]
    fn head_deduplication_skipped_when_legacy_empty() {
        let doc = json!({
            "version": 1,
            "title": "T",
            "meta": { "description": "", "og_image": "" },
            "head": [
                { "type": "meta", "name": "description", "content": "from head" },
                { "type": "meta", "property": "og:image", "content": "head_og.png" }
            ],
            "classes": [],
            "root": {
                "id": "root",
                "type": "box",
                "props": { "element": "div" },
                "styles": {},
                "classes": [],
                "children": []
            }
        });
        validate_document(&doc).unwrap();
        let head = build_head_html(&doc, "");

        // Legacy empty → head entries are NOT deduplicated
        assert!(head.contains("content=\"from head\""));
        assert!(head.contains("content=\"head_og.png\""));
    }

    #[test]
    fn head_elements_escapes_attributes() {
        let doc = json!({
            "version": 1,
            "title": "T",
            "meta": { "description": "", "og_image": "" },
            "head": [
                { "type": "stylesheet", "href": "/css?a=1&b=2" },
                { "type": "meta", "name": "author", "content": "O'Brien & Co" },
                { "type": "meta", "charset": "utf-8" }
            ],
            "classes": [],
            "root": {
                "id": "root",
                "type": "box",
                "props": { "element": "div" },
                "styles": {},
                "classes": [],
                "children": []
            }
        });
        validate_document(&doc).unwrap();
        let head = build_head_html(&doc, "");

        assert!(head.contains("href=\"/css?a=1&amp;b=2\""));
        assert!(head.contains("content=\"O'Brien &amp; Co\""));
    }

    #[test]
    fn validate_head_stylesheet_requires_href() {
        let doc = json!({
            "version": 1,
            "title": "T",
            "meta": { "description": "", "og_image": "" },
            "head": [
                { "type": "stylesheet" }
            ],
            "classes": [],
            "root": {
                "id": "root",
                "type": "box",
                "props": { "element": "div" },
                "styles": {},
                "classes": [],
                "children": []
            }
        });
        assert!(validate_document(&doc).is_err());
    }

    #[test]
    fn validate_head_meta_requires_identifier() {
        let doc = json!({
            "version": 1,
            "title": "T",
            "meta": { "description": "", "og_image": "" },
            "head": [
                { "type": "meta", "content": "val" }
            ],
            "classes": [],
            "root": {
                "id": "root",
                "type": "box",
                "props": { "element": "div" },
                "styles": {},
                "classes": [],
                "children": []
            }
        });
        assert!(validate_document(&doc).is_err());
    }

    #[test]
    fn validate_head_script_requires_src_or_js() {
        let doc = json!({
            "version": 1,
            "title": "T",
            "meta": { "description": "", "og_image": "" },
            "head": [
                { "type": "script", "defer": true }
            ],
            "classes": [],
            "root": {
                "id": "root",
                "type": "box",
                "props": { "element": "div" },
                "styles": {},
                "classes": [],
                "children": []
            }
        });
        assert!(validate_document(&doc).is_err());
    }
}
