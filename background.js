// --- 配置 ---
const burpProxyConfig = {
  mode: "fixed_servers",
  rules: {
    singleProxy: {
      scheme: "http",
      host: "127.0.0.1",
      port: 8080
    },
    bypassList: ["<local>"] // 可选：绕过本地地址
  }
};

const directConnectionConfig = {
  mode: "direct"
};

// --- 核心逻辑 ---

// 1. 首次安装：默认开启代理
chrome.runtime.onInstalled.addListener(() => {
  console.log("插件已安装：默认开启代理。");
  // 设置存储的状态为开启
  chrome.storage.local.set({ proxyEnabled: true });
  // 应用代理设置
  updateProxy(true);
});

// 2. 浏览器启动：强制开启代理
// 这是解决问题的关键！
chrome.runtime.onStartup.addListener(() => {
  console.log("浏览器已启动：自动开启代理。");
  // 无论上次状态如何，都设置为开启
  chrome.storage.local.set({ proxyEnabled: true });
  // 应用代理设置
  updateProxy(true);
});


// 3. 监听按钮点击事件：用于手动切换状态
chrome.action.onClicked.addListener(async (tab) => {
  const { proxyEnabled } = await chrome.storage.local.get("proxyEnabled");
  const newStatus = !proxyEnabled; // 反转当前状态
  await chrome.storage.local.set({ proxyEnabled: newStatus });
  updateProxy(newStatus);
});

// 4. 更新代理设置和图标的函数 (这部分逻辑保持不变)
function updateProxy(isEnabled) {
  const config = isEnabled ? burpProxyConfig : directConnectionConfig;
  const iconPath = isEnabled ? "icons/icon_on.png" : "icons/icon_off.png";
  const badgeText = isEnabled ? 'ON' : 'OFF';
  const badgeColor = isEnabled ? '#4CAF50' : '#757575'; // 绿 / 灰
  const title = isEnabled ? 'Burp Proxy is ON' : 'Burp Proxy is OFF';
  
  // 设置代理
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    if (chrome.runtime.lastError) {
      console.error(`设置代理失败: ${chrome.runtime.lastError.message}`);
      return;
    }
    console.log(isEnabled ? "代理已开启。" : "代理已关闭（直接连接）。");
  });

  // 更新UI
  chrome.action.setIcon({ path: iconPath });
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  chrome.action.setTitle({ title: title });
}

// 检查并恢复初始状态（可选，但推荐）
// 这段代码可以确保在插件更新或因错误重启时，也能恢复到开启状态
(async () => {
    // 默认行为是开启
    console.log("Service Worker 启动，检查并设置代理为开启状态。");
    await chrome.storage.local.set({ proxyEnabled: true });
    updateProxy(true);
})();