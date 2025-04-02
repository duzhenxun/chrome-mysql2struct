// 版本检查配置
const GITHUB_OWNER = 'duzhenxun';
const GITHUB_REPO = 'chrome-mysql2struct';
const VERSION_CHECK_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const UPDATE_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// 检查新版本
async function checkForUpdates() {
  try {
    const response = await fetch(VERSION_CHECK_URL);
    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', '');
    const currentVersion = chrome.runtime.getManifest().version;

    if (latestVersion > currentVersion) {
      // 创建通知
      chrome.notifications.create('update-notification', {
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: '有新版本可用',
        message: `新版本 ${latestVersion} 已发布，点击此处更新`,
        priority: 2
      });

      // 更新扩展图标
      chrome.action.setBadgeText({ text: '↑'});
      chrome.action.setBadgeTextColor({ color: '#000000' });
      chrome.action.setBadgeBackgroundColor({ color: '#FFCC00' });

      return {
        hasUpdate: true,
        currentVersion,
        latestVersion,
        releaseNotes: data.body || '暂无更新说明'
      };
    }

    return { hasUpdate: false };
  } catch (error) {
    console.error('检查更新失败:', error);
    return { hasUpdate: false, error: error.message };
  }
}

// 监听通知点击事件
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'update-notification') {
    chrome.tabs.create({ url: UPDATE_URL });
    chrome.notifications.clear(notificationId);
  }
});

// 监听来自popup页面的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'checkUpdate') {
    checkForUpdates().then(sendResponse);
    return true; // 保持消息通道开启以支持异步响应
  } else if (request.type === 'openUpdatePage') {
    chrome.tabs.create({ url: UPDATE_URL });
  }
});

// 启动时检查更新
checkForUpdates();

// 每天检查一次更新
chrome.alarms.create('checkForUpdates', {
  periodInMinutes: 1440 // 24小时
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkForUpdates') {
    checkForUpdates();
  }
});