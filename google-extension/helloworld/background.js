try {
  importScripts('flexsearch.bundle.js');
  console.log('FlexSearch loaded successfully.');
} catch (error) {
  console.error('Failed to load FlexSearch:', error);
}
importScripts('indexedDB.js');

// 自定义编码函数，用于处理中文
function customEncode(str) {
  if (typeof str !== 'string') {
    console.error('customEncode received non-string input:', str);
    return '';  // Return an empty string if the input is not a string
  }
  return str
    .replace(/[\x00-\x7F]/g, '')  // 删除所有ASCII字符
    .split('')  // 将字符串分解成单个字符
    .join(' '); // 使用空格连接字符，增强单个汉字的独立性
}

// 创建一个复合索引，以便使用多个字段进行搜索
const index = new FlexSearch.Document({
  tokenize: "strict",
  optimize: true,
  resolution: 9,
  document: {
    id: "id", // 设置文档的唯一标识符
    index: [{
      field: "title",
      encode: customEncode,
      tokenize: "forward",
      optimize: true
    }, {
      field: "text",
      encode: customEncode,
      tokenize: "strict",
      optimize: true,
      minlength: 3,
      context: {
        depth: 1,
        resolution: 3
      }
    }, {
      field: "link",
      tokenize: "forward"
    }]
  }
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendPageText') {
    const text = request.text;
    const title = request.title;
    const link = request.link;
    const id = new Date().toISOString(); // 生成一个基于时间的唯一ID

    console.log("接收到的页面文本:", text);

    // 创建一个包含标题、链接和文本的对象
    const pageData = {
      id: id,
      title: title,
      link: link,
      text: text
    };

    // 将对象添加到 FlexSearch 索引
    index.add(pageData);

    // 将对象存储到 IndexedDB
    dbPromise.then(db => {
      const tx = db.transaction('texts', 'readwrite');
      const store = tx.objectStore('texts');
      store.put({ id: id, pageData: pageData });
      return tx.complete;
    }).then(() => {
      console.log("页面数据已存储到 IndexedDB 和索引:", pageData);
      sendResponse({ status: "success" });
    }).catch(error => {
      console.error("存储页面数据错误:", error);
      sendResponse({ status: "error" });
    });

    return true; // 保持通道打开以等待异步响应
  } else if (request.action === 'chat') {
    const userText = request.text;
    console.log("用户发送的消息:", userText);

    // 发送聊天消息到外部API
    fetch("https://example.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: userText })
    })
      .then(response => response.json())
      .then(data => {
        const reply = data.reply || "抱歉，我现在无法处理这个请求。";
        sendResponse({ reply: reply });
      })
      .catch(error => {
        console.error("聊天消息发送错误:", error);
        sendResponse({ reply: "出现错误，请稍后再试。" });
      });

    return true; // 保持通道打开以等待异步响应
  }
});

// 处理点击扩展图标事件
chrome.action.onClicked.addListener((tab) => {
  console.log("点击扩展图标");
  // 发送消息给内容脚本以打开聊天窗口
  chrome.tabs.sendMessage(tab.id, { action: "openSearchBox" });
});

chrome.runtime.onInstalled.addListener(() => {
  // 清空 IndexedDB 中的所有数据
  // dbPromise.then(db => {
  //   const tx = db.transaction('texts', 'readwrite');
  //   const textsStore = tx.objectStore('texts');
  
  //   const clearRequest = textsStore.clear();
  
  //   clearRequest.onsuccess = function() {
  //     console.log("已清空 'texts' 存储中的所有条目。");
  //   };
  
  //   clearRequest.onerror = function(event) {
  //     console.error("清空 'texts' 存储时出错:", event.target.error);
  //   };
  // }).catch(error => {
  //   console.error("打开 IndexedDB 时出错:", error);
  // });
  // 从 IndexedDB 加载数据并建立索引
  dbPromise.then(db => {
    const tx = db.transaction('texts', 'readonly');
    const textsStore = tx.objectStore('texts');
    textsStore.openCursor().then(function cursorIterate(cursor) {
      if (!cursor) return;
      const value = cursor.value;
      if (!value || !value.pageData) {
        console.error("cursor value or pageData is undefined:", value);
      } else {
        const { id, title, link, text } = value.pageData;
        index.add({ id, title, link, text });
      }
      return cursor.continue().then(cursorIterate);
    }).catch(error => {
      console.error("Error iterating cursor:", error);
    });
  }).catch(error => {
    console.error("Error opening IndexedDB:", error);
  });
});

// 搜索功能
function search(query) {
  try {
    // 执行搜索并返回包含所有信息的结果
    const results = index.search(query, { enrich : true },{ index: ["title", "text"] });
    return results.map(result => {
      // 返回搜索到的文档中的存储信息
      const { title, link, text } = result.pageData;
      return { title, link, text };
    });
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// 监听来自内容脚本的搜索请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'search') {
    const results = search(request.query);
    sendResponse({ results });
    return true;  // 异步响应
  }
});
