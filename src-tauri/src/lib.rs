use tauri::Manager;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

fn get_log_path() -> Option<PathBuf> {
    // Try AppData/Local/ReLearn on Windows, ~/.local/share/ReLearn on Linux
    if let Ok(val) = std::env::var("LOCALAPPDATA") {
        return Some(PathBuf::from(val).join("ReLearn").join("crash.log"));
    }
    if let Ok(val) = std::env::var("HOME") {
        return Some(PathBuf::from(val).join(".relearn").join("crash.log"));
    }
    None
}

fn write_log(msg: &str) {
    if let Some(log_path) = get_log_path() {
        let _ = fs::create_dir_all(log_path.parent().unwrap());
        if let Ok(mut file) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
        {
            let _ = writeln!(file, "{}", msg);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Set up panic handler
    let default_panic = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        write_log(&format!("PANIC: {:?}", info));
        default_panic(info);
    }));

    write_log("ReLearn starting...");

    let result = tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            write_log("Tauri setup complete — window should appear now");
            Ok(())
        })
        .build(tauri::generate_context!());

    match result {
        Ok(app) => {
            write_log("Tauri built successfully — running event loop");
            app.run(|_app_handle, event| {
                // Log window events for debugging
                match &event {
                    tauri::RunEvent::Ready => {
                        write_log("RunEvent::Ready — app is fully loaded");
                    }
                    tauri::RunEvent::ExitRequested { .. } => {
                        write_log("RunEvent::ExitRequested");
                    }
                    _ => {}
                }
            });
        }
        Err(e) => {
            let msg = format!("FATAL: Failed to build Tauri app: {}", e);
            write_log(&msg);
            // Show error dialog on Windows
            #[cfg(target_os = "windows")]
            {
                use std::ffi::CString;
                let c_msg = CString::new(msg.clone()).unwrap_or_default();
                let c_title = CString::new("ReLearn Error").unwrap_or_default();
                unsafe {
                    // MessageBoxA
                    extern "system" {
                        fn MessageBoxA(hwnd: *mut std::ffi::c_void, text: *const i8, caption: *const i8, utype: u32) -> i32;
                    }
                    MessageBoxA(std::ptr::null_mut(), c_msg.as_ptr(), c_title.as_ptr(), 0x10);
                }
            }
            eprintln!("{}", msg);
            std::process::exit(1);
        }
    }
}
