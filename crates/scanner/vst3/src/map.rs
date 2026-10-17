use scanner_types::PluginInfo;
use std::path::Path;
use vst3_host::discovery::{ClassInfo, DetailedPluginInfo};

const AUDIO_MODULE: &str = "Audio Module Class";

pub fn map_detailed(path: &Path, detailed: DetailedPluginInfo) -> PluginInfo {
    let class = pick_class(&detailed.classes);
    let path_str = path.to_string_lossy().into_owned();

    let (name, version, cid, cardinality) = if let Some(c) = class {
        (
            c.name.clone(),
            c.version.clone(),
            normalize_cid(&c.class_id),
            c.cardinality,
        )
    } else {
        (
            detailed.info.name.clone(),
            detailed.info.version.clone(),
            normalize_cid(&detailed.info.uid),
            0,
        )
    };

    let vendor = if !detailed.factory.vendor.is_empty() {
        detailed.factory.vendor.clone()
    } else {
        detailed.info.vendor.clone()
    };

    let mut sub_categories = sub_categories_for_class(&detailed, cid.as_str());
    if sub_categories.is_empty() && !detailed.info.category.is_empty() {
        sub_categories.push(detailed.info.category.clone());
    }

    let (sdk_version, flags) = sdk_and_flags(&detailed, cid.as_str());

    PluginInfo {
        path: path_str,
        paths: Vec::new(),
        is_valid: true,
        scan_source: "factory".into(),
        name,
        vendor,
        version,
        cid,
        sdk_version,
        cardinality,
        flags,
        sub_categories,
        missing_license: false,
        load_failed: false,
        load_timed_out: false,
        error: String::new(),
        size: String::new(),
        format: "vst3".into(),
        scan_duration_ms: 0,
    }
}

fn pick_class(classes: &[ClassInfo]) -> Option<&ClassInfo> {
    classes
        .iter()
        .find(|c| c.category == AUDIO_MODULE)
        .or(classes.first())
}

fn normalize_cid(cid: &str) -> String {
    cid.chars()
        .filter(|c| !c.is_whitespace())
        .collect::<String>()
        .to_ascii_uppercase()
}

fn sub_categories_for_class(detailed: &DetailedPluginInfo, class_id: &str) -> Vec<String> {
    let Some(module) = detailed.module_info.as_ref() else {
        return Vec::new();
    };
    for c in &module.classes {
        if c.class_id.eq_ignore_ascii_case(class_id) {
            return c.sub_categories.clone();
        }
    }
    Vec::new()
}

fn sdk_and_flags(detailed: &DetailedPluginInfo, class_id: &str) -> (String, u32) {
    if let Some(module) = detailed.module_info.as_ref() {
        for c in &module.classes {
            if c.class_id.eq_ignore_ascii_case(class_id) {
                return (c.sdk_version.clone(), c.class_flags.max(0) as u32);
            }
        }
    }
    (String::new(), 0)
}
