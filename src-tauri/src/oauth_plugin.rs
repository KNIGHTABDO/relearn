use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime, Emitter};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

/// Starts a temporary HTTP server on a random port to handle the OAuth callback.
/// Returns the port number so the frontend can construct the redirect_uri.
#[tauri::command]
async fn start_oauth_server<R: Runtime>(app: tauri::AppHandle<R>) -> Result<u16, String> {
    let listener = std::net::TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("Failed to bind: {}", e))?;
    let port = listener.local_addr()
        .map_err(|e| format!("Failed to get port: {}", e))?
        .port();

    let app_handle = app.clone();
    let shutdown = Arc::new(AtomicBool::new(false));
    let shutdown_clone = shutdown.clone();

    std::thread::spawn(move || {
        listener.set_nonblocking(false).ok();
        // Accept ONE connection then shut down
        if let Ok((mut stream, _)) = listener.accept() {
            use std::io::{Read, Write};
            let mut buf = [0u8; 4096];
            if let Ok(n) = stream.read(&mut buf) {
                let request = String::from_utf8_lossy(&buf[..n]);
                // Parse the GET request to extract code and state
                if let Some(path_line) = request.lines().next() {
                    // e.g. "GET /callback?code=xxx&state=yyy HTTP/1.1"
                    if let Some(query_start) = path_line.find('?') {
                        if let Some(query_end) = path_line.rfind(" HTTP") {
                            let query = &path_line[query_start + 1..query_end];
                            // Emit the auth code to the frontend
                            let _ = app_handle.emit("oauth-callback", query.to_string());
                        }
                    }
                }
                // Send a nice response page
                let html = r#"<!DOCTYPE html><html><head><style>
                    body{font-family:Inter,system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fafafa}
                    .card{text-align:center;padding:2rem}
                    .icon{font-size:3rem;margin-bottom:1rem}
                    h1{font-size:1.25rem;font-weight:600;margin:0 0 0.5rem}
                    p{font-size:0.875rem;color:#a3a3a3;margin:0}
                </style></head><body><div class="card">
                    <div class="icon">✓</div>
                    <h1>Connected to Google</h1>
                    <p>You can close this tab and return to ReLearn.</p>
                </div></body></html>"#;
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    html.len(), html
                );
                let _ = stream.write_all(response.as_bytes());
                let _ = stream.flush();
            }
        }
        shutdown_clone.store(true, Ordering::Relaxed);
    });

    Ok(port)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("oauth")
        .invoke_handler(tauri::generate_handler![start_oauth_server])
        .build()
}
