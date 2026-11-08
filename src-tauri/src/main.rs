// Jefflix desktop (Mac / Windows / Linux): a window around the same web build the TV uses (dist/).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Jefflix");
}
