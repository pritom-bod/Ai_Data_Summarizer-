let downloadUrl = null;

document.getElementById("scrape").addEventListener("click", async () => {
  document.getElementById("status").textContent = "Collecting links...";
  document.getElementById("download-btn")?.remove();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeLinksFromPage
  }, async (results) => {
    const links = results[0].result;
    if (!links || links.length === 0) {
      document.getElementById("status").textContent = "No internal links found.";
      return;
    }

    document.getElementById("status").textContent = `${links.length} links found. Sending to server...`;

    try {
      const response = await fetch("http://localhost:5000/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: links })
      });

      if (response.ok) {
        const blob = await response.blob();
        downloadUrl = window.URL.createObjectURL(blob);

        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "Download DOCX";
        downloadBtn.id = "download-btn";
        downloadBtn.onclick = () => {
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = "website_data.docx";
          a.click();
        };
        document.body.appendChild(downloadBtn);
        document.getElementById("status").textContent = "Done!";
      } else {
        document.getElementById("status").textContent = "Server Error.";
      }
    } catch (err) {
      document.getElementById("status").textContent = "Error connecting to server.";
      console.error(err);
    }
  });
});

function scrapeLinksFromPage() {
  const anchors = Array.from(document.querySelectorAll("a"));
  const base = window.location.origin;
  const internalLinks = new Set();

  for (let a of anchors) {
    const href = a.href;
    if (href.startsWith(base)) {
      internalLinks.add(href.split("#")[0]); // Remove fragments
    }
  }

  return Array.from(internalLinks);
}
