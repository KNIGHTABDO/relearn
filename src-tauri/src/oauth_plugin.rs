use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime, Emitter};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use serde::{Deserialize, Serialize};

// ==================== Google OAuth (Loopback Server) ====================

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
        if let Ok((mut stream, _)) = listener.accept() {
            use std::io::{Read, Write};
            let mut buf = [0u8; 4096];
            if let Ok(n) = stream.read(&mut buf) {
                let request = String::from_utf8_lossy(&buf[..n]);
                if let Some(path_line) = request.lines().next() {
                    if let Some(query_start) = path_line.find('?') {
                        if let Some(query_end) = path_line.rfind(" HTTP") {
                            let query = &path_line[query_start + 1..query_end];
                            let _ = app_handle.emit("oauth-callback", query.to_string());
                        }
                    }
                }
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

// ==================== GitHub OAuth (Device Code — no CORS) ====================

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
    status: String, // "pending", "success", "error"
    access_token: Option<String>,
    login: Option<String>,
    email: Option<String>,
    avatar_url: Option<String>,
    error: Option<String>,
}

const COPILOT_CLIENT_ID: &str = "Iv1.b507a08c87ecfe98";

/// Start GitHub device code login flow (bypasses CORS by running in Rust)
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

/// Poll GitHub for access token (bypasses CORS)
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
        // Fetch user info
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

/// Exchange Google auth code for tokens (bypasses CORS)
#[tauri::command]
async fn google_exchange_token(
    code: String,
    redirect_uri: String,
    code_verifier: String,
    client_id: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://oauth2.googleapis.com/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(format!(
            "client_id={}&code={}&grant_type=authorization_code&redirect_uri={}&code_verifier={}",
            urlencoding::encode(&client_id),
            urlencoding::encode(&code),
            urlencoding::encode(&redirect_uri),
            urlencoding::encode(&code_verifier),
        ))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let data: serde_json::Value = res.json().await
        .map_err(|e| format!("Parse failed: {}", e))?;

    if let Some(err) = data.get("error") {
        return Err(format!("{}: {}", err, data.get("error_description").and_then(|v| v.as_str()).unwrap_or("")));
    }

    // Also fetch user info
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

/// Refresh Google token (bypasses CORS)
#[tauri::command]
async fn google_refresh_token(
    refresh_token: String,
    client_id: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://oauth2.googleapis.com/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(format!(
            "client_id={}&grant_type=refresh_token&refresh_token={}",
            urlencoding::encode(&client_id),
            urlencoding::encode(&refresh_token),
        ))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    res.json().await.map_err(|e| format!("Parse failed: {}", e))
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("oauth")
        .invoke_handler(tauri::generate_handler![
            start_oauth_server,
            github_device_code,
            github_poll_token,
            google_exchange_token,
            google_refresh_token,
        ])
        .build()
}
