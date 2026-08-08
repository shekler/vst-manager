pub const MINT: egui::Color32 = egui::Color32::from_rgb(0x41, 0xC4, 0x9D); // #41C49D
pub const SEA: egui::Color32 = egui::Color32::from_rgb(0x20, 0xBF, 0xCF); // #20BFCF
pub const RED: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x45, 0x45); // #ff4545
pub const ONYX: egui::Color32 = egui::Color32::from_rgb(0x1B, 0x1D, 0x20); // #1B1D20
pub const POWDER: egui::Color32 = egui::Color32::from_rgb(0xF9, 0xF7, 0xF2); // #F9F7F2
pub const JET: egui::Color32 = egui::Color32::from_rgb(0x10, 0x11, 0x12); // #101112

/// VST3 sub_category tag label colors (scanner splits pipe-separated tags).
/// Grouped by family; all values saturated for contrast on ONYX/JET backgrounds.
pub mod category {
    use super::*;

    // Instruments — greens
    pub const INSTRUMENT: egui::Color32 = MINT; // #41C49D
    pub const SYNTH: egui::Color32 = egui::Color32::from_rgb(0x4A, 0xE8, 0xA8); // #4AE8A8
    pub const SAMPLER: egui::Color32 = egui::Color32::from_rgb(0x36, 0xDE, 0x90); // #36DE90
    pub const DRUM: egui::Color32 = egui::Color32::from_rgb(0x28, 0xE0, 0x7A); // #28E07A
    pub const PIANO: egui::Color32 = egui::Color32::from_rgb(0x72, 0xF0, 0xB8); // #72F0B8
    pub const EXTERNAL: egui::Color32 = egui::Color32::from_rgb(0x48, 0xC8, 0x8F); // #48C88F

    // Generic fx & routing — blues & cyans
    pub const FX: egui::Color32 = egui::Color32::from_rgb(0x68, 0xA8, 0xFF); // #68A8FF
    pub const ANALYZER: egui::Color32 = SEA; // #20BFCF
    pub const NETWORK: egui::Color32 = egui::Color32::from_rgb(0x40, 0x80, 0xFF); // #4080FF

    // Spatial & channel format — lighter blues
    pub const SPATIAL: egui::Color32 = egui::Color32::from_rgb(0x5B, 0x9F, 0xFF); // #5B9FFF
    pub const SURROUND: egui::Color32 = egui::Color32::from_rgb(0x4F, 0x8F, 0xF5); // #4F8FF5
    pub const AMBISONICS: egui::Color32 = egui::Color32::from_rgb(0x78, 0xB0, 0xFF); // #78B0FF
    pub const UP_DOWNMIX: egui::Color32 = egui::Color32::from_rgb(0x58, 0x98, 0xF0); // #5898F0
    pub const MONO: egui::Color32 = egui::Color32::from_rgb(0x6C, 0xA0, 0xF8); // #6CA0F8
    pub const STEREO: egui::Color32 = egui::Color32::from_rgb(0x78, 0xAC, 0xFF); // #78ACFF

    // Mixing & correction — yellows & golds
    pub const DYNAMICS: egui::Color32 = egui::Color32::from_rgb(0xFF, 0xD2, 0x3F); // #FFD23F
    pub const DYNAMICS_MULTIBAND: egui::Color32 = egui::Color32::from_rgb(0xFF, 0xCC, 0x33); // #FFCC33
    pub const EQ: egui::Color32 = egui::Color32::from_rgb(0xFF, 0xE0, 0x45); // #FFE045
    pub const FILTER: egui::Color32 = egui::Color32::from_rgb(0xFF, 0xC9, 0x28); // #FFC928
    pub const MASTERING: egui::Color32 = egui::Color32::from_rgb(0xF5, 0xB8, 0x00); // #F5B800
    pub const RESTORATION: egui::Color32 = egui::Color32::from_rgb(0xF0, 0xD0, 0x30); // #F0D030
    pub const CHANNEL_STRIP: egui::Color32 = egui::Color32::from_rgb(0xFF, 0xDA, 0x44); // #FFDA44
    pub const TOOLS: egui::Color32 = egui::Color32::from_rgb(0xFF, 0xD5, 0x4A); // #FFD54A
    pub const GENERATOR: egui::Color32 = egui::Color32::from_rgb(0xFF, 0xE8, 0x58); // #FFE858

    // Creative / instrument-specific fx — oranges & corals
    pub const DISTORTION: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x5A, 0x3D); // #FF5A3D
    pub const MODULATION: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x6F, 0x4A); // #FF6F4A
    pub const BASS: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x63, 0x47); // #FF6347
    pub const GUITAR: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x75, 0x55); // #FF7555
    pub const DRUMS: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x50, 0x38); // #FF5038
    pub const MICROPHONE: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x88, 0x70); // #FF8870
    pub const VOCALS: egui::Color32 = egui::Color32::from_rgb(0xFF, 0x80, 0x78); // #FF8078

    // Time & pitch — purples
    pub const DELAY: egui::Color32 = egui::Color32::from_rgb(0xB3, 0x88, 0xFF); // #B388FF
    pub const REVERB: egui::Color32 = egui::Color32::from_rgb(0x9C, 0x6D, 0xFF); // #9C6DFF
    pub const PITCH_SHIFT: egui::Color32 = egui::Color32::from_rgb(0xC4, 0x9B, 0xFF); // #C49BFF

    // Meta / unknown — magentas (no neutral gray)
    pub const CONSTRAINT: egui::Color32 = egui::Color32::from_rgb(0xE0, 0x40, 0xFB); // #E040FB
    pub const UNDEFINED: egui::Color32 = egui::Color32::from_rgb(0xD0, 0x60, 0xFF); // #D060FF
}
