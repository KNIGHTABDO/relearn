// YouTube Transcript Extraction via Innertube API
// Works without API keys by impersonating Android client

// XML parsing via browser-native DOMParser (no server deps needed)

export interface TranscriptEntry {
  text: string;
  startTime: number;
  endTime: number;
}

export interface YouTubeVideoInfo {
  title: string;
  channelName: string;
  duration: number; // seconds
  transcript: TranscriptEntry[];
  fullText: string;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

export async function fetchYouTubeInfo(url: string, language = "en"): Promise<YouTubeVideoInfo> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Step 1: Get Innertube API key from page HTML
  const pageRes = await fetch(videoUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  const html = await pageRes.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) throw new Error("Could not extract Innertube API key");
  const apiKey = apiKeyMatch[1];

  // Extract title from HTML as fallback
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  let title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "YouTube Video";

  // Extract channel name
  const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
  const channelName = channelMatch ? channelMatch[1] : "Unknown Channel";

  // Step 2: Call Innertube player API (Android client)
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
          },
        },
        videoId,
      }),
    }
  );

  const playerData = await playerRes.json();

  // Get video title from player response if available
  if (playerData?.videoDetails?.title) {
    title = playerData.videoDetails.title;
  }
  const duration = parseInt(playerData?.videoDetails?.lengthSeconds || "0", 10);

  // Step 3: Extract caption track URL
  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!tracks || tracks.length === 0) {
    // No captions available — return what we have without transcript
    return {
      title,
      channelName,
      duration,
      transcript: [],
      fullText: `[YouTube Video: ${title}]\nChannel: ${channelName}\nDuration: ${formatDuration(duration)}\n\nNo captions/transcript available for this video. The AI can still help with general questions about the video topic based on its title and metadata.`,
    };
  }

  // Try to find requested language, fall back to first available
  let track = tracks.find((t: any) => t.languageCode === language);
  if (!track) {
    // Try auto-generated version
    track = tracks.find((t: any) => t.languageCode === language && t.kind === "asr");
  }
  if (!track) {
    // Use first available track
    track = tracks[0];
  }

  const baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");

  // Step 4: Fetch and parse captions XML
  const captionRes = await fetch(baseUrl);
  const xml = await captionRes.text();

  let transcript: TranscriptEntry[] = [];
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const textElements = xmlDoc.querySelectorAll("text");
    transcript = Array.from(textElements).map((el) => ({
      text: (el.textContent || "")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n/g, " ")
        .trim(),
      startTime: parseFloat(el.getAttribute("start") || "0"),
      endTime:
        parseFloat(el.getAttribute("start") || "0") + parseFloat(el.getAttribute("dur") || "0"),
    }));
  } catch (parseErr) {
    console.error("Caption XML parse error:", parseErr);
  }

  // Build full text from transcript
  const fullText = buildFullText(title, channelName, duration, transcript);

  return { title, channelName, duration, transcript, fullText };
}

function buildFullText(
  title: string,
  channel: string,
  duration: number,
  transcript: TranscriptEntry[]
): string {
  const header = `[YouTube Video: ${title}]\nChannel: ${channel}\nDuration: ${formatDuration(duration)}\n\n`;

  if (transcript.length === 0) {
    return header + "No transcript available.";
  }

  // Group transcript into paragraphs (~every 30 seconds)
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  let paragraphStart = 0;

  for (const entry of transcript) {
    if (entry.startTime - paragraphStart > 30 && currentParagraph.length > 0) {
      const timestamp = formatDuration(Math.floor(paragraphStart));
      paragraphs.push(`[${timestamp}] ${currentParagraph.join(" ")}`);
      currentParagraph = [];
      paragraphStart = entry.startTime;
    }
    if (entry.text) currentParagraph.push(entry.text);
  }

  if (currentParagraph.length > 0) {
    const timestamp = formatDuration(Math.floor(paragraphStart));
    paragraphs.push(`[${timestamp}] ${currentParagraph.join(" ")}`);
  }

  return header + "--- TRANSCRIPT ---\n\n" + paragraphs.join("\n\n");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
