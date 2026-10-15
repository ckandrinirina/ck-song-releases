// Offers each visitor the CK Song download for their device, from the newest release's latest.json.

const PLATFORMS = [
  { platform: "windows", label: "Windows", note: "Windows 10 or later · installer" },
  { platform: "macos", label: "macOS", note: "macOS 11 or later · Apple silicon and Intel" },
  { platform: "linux", label: "Linux", note: "x86-64 · AppImage, no install needed" },
];

/** "windows", "macos" or "linux" for a desktop browser; null for phones, tablets and unknown agents. */
export function detectPlatform(userAgent) {
  const ua = userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return null;
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Linux|X11/i.test(ua)) return "linux";
  return null;
}

export function formatSize(bytes) {
  return bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : "";
}

/** The visitor's download first, then the rest, each with its label, file and size. */
export function chooseDownloads(manifest, platform) {
  const available = PLATFORMS.filter((p) => manifest.assets && manifest.assets[p.platform]).map((p) => {
    const a = manifest.assets[p.platform];
    return { ...p, name: a.name, url: a.url, size: formatSize(a.size) };
  });

  const primary = available.find((d) => d.platform === platform) || null;
  return { version: manifest.version, released: manifest.released, primary, others: available.filter((d) => d !== primary) };
}

const RELEASES_URL = "https://github.com/ckandrinirina/ck-song-releases/releases";

/** What the page shows before the first release exists: no download button, a link to the releases page. */
export function noReleaseView() {
  return { version: "No release yet", label: "See the releases page", href: RELEASES_URL };
}

function renderNoRelease() {
  const view = noReleaseView();
  const a = document.createElement("a");
  a.className = "key key--small";
  a.href = view.href;
  a.innerHTML = `<span>${view.label}</span>`;
  document.getElementById("download-primary").hidden = true;
  document.getElementById("download-others").replaceChildren(a);
  document.getElementById("download-version").textContent = view.version;
}

function render(downloads) {
  const button = document.getElementById("download-primary");
  const others = document.getElementById("download-others");
  const version = document.getElementById("download-version");

  version.textContent = `Version ${downloads.version}${downloads.released ? ` · released ${downloads.released}` : ""}`;

  if (downloads.primary) {
    button.href = downloads.primary.url;
    button.querySelector("[data-label]").textContent = `Download for ${downloads.primary.label}`;
    button.querySelector("[data-meta]").textContent = `${downloads.primary.note} · ${downloads.primary.size}`;
    button.hidden = false;
  }

  others.replaceChildren(...downloads.others.map((d) => {
    const a = document.createElement("a");
    a.className = "key key--small";
    a.href = d.url;
    a.innerHTML = `<span>${d.label}</span><small>${d.size}</small>`;
    a.title = d.note;
    return a;
  }));
}

async function init() {
  try {
    const response = await fetch("latest.json", { cache: "no-cache" });
    if (response.status === 404) return renderNoRelease();
    if (!response.ok) throw new Error(response.statusText);
    render(chooseDownloads(await response.json(), detectPlatform(navigator.userAgent)));
  } catch {
    document.getElementById("download-version").textContent = "Downloads are on the releases page.";
  }
}

if (typeof document !== "undefined") init();
