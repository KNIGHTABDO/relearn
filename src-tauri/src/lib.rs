use std::fs;
use std::path::PathBuf;
use tauri::{Manager, Runtime, Emitter};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use serde::{Deserialize, Serialize};

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

// ==================== OAuth Commands (App-Level) ====================

#[derive(Serialize, Deserialize)]
struct DeviceCodeResponse {
    device_code: Option<String>,
    user_code: Option<String>,
    verification_uri: Option<String>,
    expires_in: Option<u64>,
    interval: Option<u64>,
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct TokenResponse {
    access_token: Option<String>,
    token_type: Option<String>,
    scope: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct GitHubUser {
    login: Option<String>,
    email: Option<String>,
    avatar_url: Option<String>,
    name: Option<String>,
}

#[derive(Serialize)]
struct DeviceCodeResult {
    device_code: String,
    user_code: String,
    verification_uri: String,
    interval: u64,
}

#[derive(Serialize)]
struct PollResult {
    status: String,
    access_token: Option<String>,
    login: Option<String>,
    email: Option<String>,
    avatar_url: Option<String>,
    error: Option<String>,
}

const COPILOT_CLIENT_ID: &str = "Iv1.b507a08c87ecfe98";

#[tauri::command]
async fn start_oauth_server(app: tauri::AppHandle) -> Result<u16, String> {
    let listener = std::net::TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("Failed to bind: {}", e))?;
    let port = listener.local_addr()
        .map_err(|e| format!("Failed to get port: {}", e))?
        .port();

    let app_handle = app.clone();

    std::thread::spawn(move || {
        use std::io::{Read, Write};
        use std::time::{Duration, Instant};
        let deadline = Instant::now() + Duration::from_secs(300);
        let mut got_code = false;

        while !got_code && Instant::now() < deadline {
            let _ = listener.set_nonblocking(true);
            std::thread::sleep(Duration::from_millis(100));

            if let Ok((mut stream, _)) = listener.accept() {
                let mut buf = [0u8; 4096];
                let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
                if let Ok(n) = stream.read(&mut buf) {
                    let request = String::from_utf8_lossy(&buf[..n]);
                    if let Some(path_line) = request.lines().next() {
                        if path_line.contains("code=") {
                            if let Some(query_start) = path_line.find('?') {
                                if let Some(query_end) = path_line.rfind(" HTTP") {
                                    let query = &path_line[query_start + 1..query_end];
                                    let _ = app_handle.emit("oauth-callback", query.to_string());
                                    got_code = true;
                                }
                            }
                            let html = r#"<!DOCTYPE html><html><head><style>body{font-family:Inter,system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fafafa}.card{text-align:center;padding:2rem}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.25rem;font-weight:600;margin:0 0 0.5rem}p{font-size:0.875rem;color:#a3a3a3;margin:0}</style></head><body><div class="card"><div class="icon">✓</div><h1>Connected to Google</h1><p>You can close this tab and return to ReLearn.</p></div></body></html>"#;
                            let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", html.len(), html);
                            let _ = stream.write_all(response.as_bytes());
                        } else {
                            let _ = stream.write_all(b"HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n");
                        }
                    }
                    let _ = stream.flush();
                }
            }
        }
    });

    Ok(port)
}


#[tauri::command]
async fn github_device_code() -> Result<DeviceCodeResult, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "client_id": COPILOT_CLIENT_ID,
            "scope": "read:user"
        }))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let data: DeviceCodeResponse = res.json().await
        .map_err(|e| format!("Parse failed: {}", e))?;

    if let Some(err) = data.error {
        return Err(format!("{}: {}", err, data.error_description.unwrap_or_default()));
    }

    Ok(DeviceCodeResult {
        device_code: data.device_code.ok_or("No device_code")?,
        user_code: data.user_code.ok_or("No user_code")?,
        verification_uri: data.verification_uri.unwrap_or_else(|| "https://github.com/login/device".to_string()),
        interval: data.interval.unwrap_or(5),
    })
}

#[tauri::command]
async fn github_poll_token(device_code: String) -> Result<PollResult, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "client_id": COPILOT_CLIENT_ID,
            "device_code": device_code,
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
        }))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let data: TokenResponse = res.json().await
        .map_err(|e| format!("Parse failed: {}", e))?;

    if let Some(error) = &data.error {
        if error == "authorization_pending" {
            return Ok(PollResult {
                status: "pending".to_string(),
                access_token: None, login: None, email: None, avatar_url: None, error: None,
            });
        }
        if error == "slow_down" {
            return Ok(PollResult {
                status: "slow_down".to_string(),
                access_token: None, login: None, email: None, avatar_url: None, error: None,
            });
        }
        return Ok(PollResult {
            status: "error".to_string(),
            access_token: None, login: None, email: None, avatar_url: None,
            error: Some(data.error_description.unwrap_or_else(|| error.clone())),
        });
    }

    if let Some(token) = data.access_token {
        let user_res = client
            .get("https://api.github.com/user")
            .header("Authorization", format!("Bearer {}", token))
            .header("Accept", "application/json")
            .header("User-Agent", "ReLearn/1.0")
            .send()
            .await;

        let (login, email, avatar_url) = if let Ok(user_resp) = user_res {
            if let Ok(user) = user_resp.json::<GitHubUser>().await {
                (user.login, user.email, user.avatar_url)
            } else {
                (None, None, None)
            }
        } else {
            (None, None, None)
        };

        Ok(PollResult {
            status: "success".to_string(),
            access_token: Some(token),
            login, email, avatar_url, error: None,
        })
    } else {
        Ok(PollResult {
            status: "error".to_string(),
            access_token: None, login: None, email: None, avatar_url: None,
            error: Some("No access token received".to_string()),
        })
    }
}

#[tauri::command]
async fn google_exchange_token(
    code: String,
    redirect_uri: String,
    code_verifier: String,
    client_id: String,
    client_secret: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://oauth2.googleapis.com/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(format!(
            "client_id={}&code={}&grant_type=authorization_code&redirect_uri={}&code_verifier={}&client_secret={}",
            urlencoding::encode(&client_id),
            urlencoding::encode(&code),
            urlencoding::encode(&redirect_uri),
            urlencoding::encode(&code_verifier),
            urlencoding::encode(&client_secret),
        ))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let data: serde_json::Value = res.json().await
        .map_err(|e| format!("Parse failed: {}", e))?;

    if let Some(err) = data.get("error") {
        return Err(format!("{}: {}", err, data.get("error_description").and_then(|v| v.as_str()).unwrap_or("")));
    }

    if let Some(access_token) = data.get("access_token").and_then(|v| v.as_str()) {
        let user_res = client
            .get("https://www.googleapis.com/oauth2/v2/userinfo")
            .header("Authorization", format!("Bearer {}", access_token))
            .send()
            .await;

        let mut result = data.clone();
        if let Ok(user_resp) = user_res {
            if let Ok(user_info) = user_resp.json::<serde_json::Value>().await {
                result["user_info"] = user_info;
            }
        }
        Ok(result)
    } else {
        Ok(data)
    }
}

#[tauri::command]
async fn google_refresh_token(
    refresh_token: String,
    client_id: String,
    client_secret: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://oauth2.googleapis.com/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(format!(
            "client_id={}&grant_type=refresh_token&refresh_token={}&client_secret={}",
            urlencoding::encode(&client_id),
            urlencoding::encode(&refresh_token),
            urlencoding::encode(&client_secret),
        ))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    res.json().await.map_err(|e| format!("Parse failed: {}", e))
}

// ==================== App Entry ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]

#[tauri::command]
async fn github_fetch_models(token: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get("https://api.githubcopilot.com/models")
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/json")
        .header("Copilot-Integration-Id", "vscode-chat")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    let body = resp.text().await.map_err(|e| format!("Read failed: {}", e))?;
    Ok(body)
}

pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("PANIC: {}", info);
        log_crash(&msg);
    }));

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            start_oauth_server,
            github_device_code,
            github_poll_token, github_fetch_models,
            google_exchange_token,
            google_refresh_token,
        ])
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
