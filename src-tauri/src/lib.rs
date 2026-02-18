use std::fs;
use std::path::PathBuf;

mod oauth_plugin;

fn get_log_path() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        let appdata = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(appdata).join("ReLearn")
    }
    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join(".relearn")
    }
}

fn log_crash(msg: &str) {
    let log_dir = get_log_path();
    let _ = fs::create_dir_all(&log_dir);
    let log_file = log_dir.join("crash.log");
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let entry = format!("[{}] {}\n", timestamp, msg);
    let _ = fs::write(&log_file, entry);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Set up panic hook for crash logging
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("PANIC: {}", info);
        log_crash(&msg);
    }));

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(oauth_plugin::init())
        .setup(|_app| {
            Ok(())
        })
        .build(tauri::generate_context!());

    match app {
        Ok(app) => {
            log_crash("App built successfully, starting...");
            app.run(|_app_handle, event| {
                match &event {
                    tauri::RunEvent::Ready => {
                        log_crash("RunEvent::Ready — app window should be visible");
                    }
                    tauri::RunEvent::ExitRequested { .. } => {
                        log_crash("RunEvent::ExitRequested");
                    }
                    _ => {}
                }
            });
        }
        Err(e) => {
            let error_msg = format!("FATAL: Failed to build Tauri app: {}", e);
            log_crash(&error_msg);

            #[cfg(target_os = "windows")]
            {
                use std::ffi::CString;
                let text = CString::new(error_msg.clone()).unwrap_or_default();
                let title = CString::new("ReLearn Error").unwrap_or_default();
                unsafe {
                    #[link(name = "user32")]
                    extern "system" {
                        fn MessageBoxA(hwnd: *mut std::ffi::c_void, text: *const i8, caption: *const i8, utype: u32) -> i32;
                    }
                    MessageBoxA(std::ptr::null_mut(), text.as_ptr(), title.as_ptr(), 0x10);
                }
            }

            #[cfg(not(target_os = "windows"))]
            {
                eprintln!("{}", error_msg);
            }
        }
    }
}
