// 获取页面中的所有文本
function getTextFromPage() {
    return document.body.innerText;
}
  
// 发送页面文本到后台脚本
function sendPageTextToBackground() {
    const text = getTextFromPage();
    const title = document.title; // 获取当前页面的标题
    const link = window.location.href; // 获取当前页面的链接

    chrome.runtime.sendMessage(
        {
            action: "sendPageText",
            text: text,
            title: title,
            link: link
        },
        (response) => {
            if (response && response.status) {
                console.log("页面文本发送状态:", response.status);
            } else {
                console.error("页面文本发送失败");
            }
        }
    );
}

  
// 创建对话框元素
function createSearchBox() {
    const searchBox = document.createElement('div');
    searchBox.id = 'search-box';
    searchBox.style.position = 'fixed';
    searchBox.style.right = '0';
    searchBox.style.top = '0';
    searchBox.style.width = '300px';
    searchBox.style.height = '100%';
    searchBox.style.backgroundColor = '#fff';
    searchBox.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.5)';
    searchBox.style.zIndex = '9999';
    searchBox.style.display = 'flex';
    searchBox.style.flexDirection = 'column';

    const inputArea = document.createElement('div');
    inputArea.style.display = 'flex';
    inputArea.style.padding = '10px';
    const input = document.createElement('input');
    input.type = 'text';
    input.style.flex = '1';
    input.style.padding = '5px';
    input.placeholder = '输入搜索词...';
    inputArea.appendChild(input);
    searchBox.appendChild(inputArea);

    const searchButton = document.createElement('button');
    searchButton.textContent = '搜索';
    searchButton.style.marginTop = '5px';
    searchButton.style.alignSelf = 'center'; // Center the button
    searchBox.appendChild(searchButton);

    const resultsDiv = document.createElement('div');
    resultsDiv.style.flex = '1';
    resultsDiv.style.overflowY = 'auto';
    resultsDiv.style.padding = '10px';
    searchBox.appendChild(resultsDiv);

    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        document.body.removeChild(searchBox);
    };
    searchBox.appendChild(closeButton);

    // 搜索逻辑
    searchButton.addEventListener('click', () => {
        const query = input.value.trim();
        if (query) {
            chrome.runtime.sendMessage({ action: 'search', query: query }, response => {
                resultsDiv.innerHTML = ''; // 清空之前的搜索结果
                if (response && response.results) {
                    response.results.forEach(result => {
                        const resultDiv = document.createElement('div');
                        // 确保 result 是字符串
                        resultDiv.textContent = typeof result === 'string' ? result : JSON.stringify(result);
                        resultsDiv.appendChild(resultDiv);
                    });
                } else {
                    // 如果没有结果或出错，显示提示信息
                    resultsDiv.textContent = '没有找到结果或出现错误';
                }
            });
        }
    });

    // 将搜索框添加到页面
    document.body.appendChild(searchBox);
}
  
// 当接收到显示聊天窗口的命令时，创建聊天窗口
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openSearchBox") {
        console.log("接收到打开聊天窗口的命令");
        createSearchBox();
    }
});
  
// 页面加载时自动发送文本
window.onload = sendPageTextToBackground;
