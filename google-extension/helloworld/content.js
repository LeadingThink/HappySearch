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

// 显示搜索结果的外观增强
function displayResults(results, resultsDiv) {
    results.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.style.border = '1px solid #ddd';
        resultCard.style.borderRadius = '8px';
        resultCard.style.padding = '10px';
        resultCard.style.marginBottom = '10px';
        resultCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        resultCard.style.transition = 'box-shadow 0.3s';

        resultCard.onmouseover = function () {
            resultCard.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
        };

        resultCard.onmouseout = function () {
            resultCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        };

        const title = document.createElement('a');
        title.href = result.link;
        title.textContent = result.title;
        title.style.fontSize = '16px';
        title.style.fontWeight = 'bold';
        title.style.color = '#1a0dab';
        title.style.textDecoration = 'none';

        const link = document.createElement('a');
        link.href = result.link;
        link.textContent = result.link;
        link.style.fontSize = '12px';
        link.style.color = '#006621';
        link.style.textDecoration = 'none';
        link.style.display = 'block';
        link.style.marginBottom = '5px';

        const text = document.createElement('p');
        text.textContent = result.text.length > 100 ? result.text.substring(0, 100) + '...' : result.text;
        text.style.fontSize = '14px';
        text.style.color = '#545454';

        resultCard.appendChild(title);
        resultCard.appendChild(link);
        resultCard.appendChild(text);

        resultsDiv.appendChild(resultCard);
    });
}

// 创建搜索对话框元素
// 创建搜索对话框元素
function createSearchBox() {
    const searchBox = document.createElement('div');
    searchBox.id = 'search-box';
    searchBox.style.position = 'fixed';
    searchBox.style.right = '20px';
    searchBox.style.top = '20px';
    searchBox.style.width = '320px';
    searchBox.style.height = 'auto'; // 自动调整高度
    searchBox.style.backgroundColor = '#f9f9f9';
    searchBox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    searchBox.style.zIndex = '9999';
    searchBox.style.borderRadius = '8px';
    searchBox.style.overflow = 'hidden'; // 防止内容溢出
    searchBox.style.display = 'flex';
    searchBox.style.flexDirection = 'column';
    searchBox.style.padding = '10px';

    const inputArea = document.createElement('div');
    inputArea.style.display = 'flex';
    inputArea.style.paddingBottom = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.style.flex = '1';
    input.style.marginRight = '10px';
    input.style.padding = '10px';
    input.style.fontSize = '16px';
    input.style.borderRadius = '4px';
    input.placeholder = '输入搜索词...';

    const searchButton = document.createElement('button');
    searchButton.textContent = '搜索';
    searchButton.style.padding = '10px 20px';
    searchButton.style.fontSize = '16px';
    searchButton.style.backgroundColor = '#007BFF';
    searchButton.style.color = '#fff';
    searchButton.style.border = 'none';
    searchButton.style.borderRadius = '4px';
    searchButton.style.cursor = 'pointer';

    inputArea.appendChild(input);
    inputArea.appendChild(searchButton);
    searchBox.appendChild(inputArea);

    const resultsDiv = document.createElement('div');
    resultsDiv.style.overflowY = 'scroll';
    resultsDiv.style.maxHeight = '400px'; // 设置最大高度以允许滚动
    resultsDiv.style.padding = '10px';
    resultsDiv.style.backgroundColor = '#fff';

    searchBox.appendChild(resultsDiv);

    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#dc3545';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
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
                    displayResults(response.results, resultsDiv);
                } else {
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
