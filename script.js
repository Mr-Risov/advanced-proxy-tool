let currentMode = "Fetch"; // Default mode
let proxyList = [];

// Toggle between modes
document.getElementById("toggle-mode").addEventListener("click", () => {
    currentMode = currentMode === "Fetch" ? "Checker" : "Fetch";
    document.getElementById("current-mode").textContent = currentMode;
    document.getElementById("fetch-section").classList.toggle("hidden");
    document.getElementById("checker-section").classList.toggle("hidden");
    document.getElementById("toggle-mode").textContent = 
        `Switch to ${currentMode === "Fetch" ? "Checker" : "Fetch"}`;
});

// Fetch proxies
document.getElementById("fetch-proxies-btn").addEventListener("click", async () => {
    const limit = document.getElementById("proxy-limit").value || 10;
    const proxies = await fetchProxies(limit);
    const checkedProxies = await checkProxies(proxies);

    displayResults(checkedProxies);
    window.proxies = checkedProxies;
});

// Check custom proxies
document.getElementById("check-custom-btn").addEventListener("click", async () => {
    const customProxies = document.getElementById("manual-proxies").value.trim().split("\n");
    const checkedProxies = await checkProxies(customProxies);

    displayResults(checkedProxies);
    window.proxies = checkedProxies;
});

// Download alive proxies
document.getElementById("download-btn").addEventListener("click", () => {
    if (!window.proxies) {
        alert("No proxies fetched or checked yet!");
        return;
    }

    const aliveProxies = window.proxies.filter(p => p.status === "Alive").map(p => p.proxy).join("\n");
    const blob = new Blob([aliveProxies], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alive-proxies.txt";
    a.click();
    URL.revokeObjectURL(url);
});

// Fetch proxies from API
async function fetchProxies(limit) {
    try {
        const response = await fetch(`https://proxylist.geonode.com/api/proxy-list?limit=${limit}&page=1&sort_by=lastChecked&sort_type=desc`);
        const data = await response.json();
        return data.data.map(proxy => `${proxy.ip}:${proxy.port}`);
    } catch (error) {
        console.error("Error fetching proxies:", error);
        return [];
    }
}

// Check proxies
async function checkProxies(proxies) {
    const results = [];
    let progress = 0;

    for (const proxy of proxies) {
        try {
            const startTime = Date.now();
            await fetch("https://httpbin.org/ip", { method: "GET", proxy: `http://${proxy}` });
            const ping = Date.now() - startTime;
            results.push({ proxy, status: "Alive", ping });
        } catch {
            results.push({ proxy, status: "Dead", ping: "N/A" });
        }

        progress += (100 / proxies.length);
        document.getElementById("progress").style.width = `${progress}%`;
    }

    return results;
}

// Display results
function displayResults(proxies) {
    const proxyContainer = document.getElementById("proxy-list");
    proxyContainer.innerHTML = "";

    let aliveCount = 0;
    let deadCount = 0;

    proxies.forEach(proxy => {
        const proxyItem = document.createElement("div");
        proxyItem.className = `proxy-item ${proxy.status.toLowerCase()}`;
        proxyItem.innerHTML = `
            <strong>${proxy.proxy}</strong><br>
            Status: ${proxy.status}<br>
            Ping: ${proxy.ping}ms
        `;
        proxyContainer.appendChild(proxyItem);

        if (proxy.status === "Alive") aliveCount++;
        else deadCount++;
    });

    document.getElementById("alive-count").textContent = aliveCount;
    document.getElementById("dead-count").textContent = deadCount;
    proxyList = proxies;
}
