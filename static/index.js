// 移动端菜单切换
$('#mobile-menu-button').click(function () {
  $('#mobile-menu').toggleClass('hidden');
});

// 聊天功能
const chatInput = $('#chat-input');
const sendButton = $('#send-button');
let chatHistory = [];

function addUserMessage(message) {
  const chatContainer = $('#chat-container');
  const messageDiv = $('<div>', {
    class: 'flex mb-4 justify-end'
  });
  messageDiv.html(`
    <div class="bg-purple-600 text-white p-4 rounded-lg shadow-sm max-w-3xl">
      <p>${message}</p>
    </div>
    <div class="flex-shrink-0 ml-3">
      <div class="bg-purple-100 p-2 rounded-full">
        <i class="fas fa-user text-purple-600"></i>
      </div>
    </div>
  `);
  chatContainer.append(messageDiv);
  chatContainer.scrollTop(chatContainer[0].scrollHeight);
  chatHistory.push({
    role: 'user',
    content: message
  });
}

function addBotMessage(message) {
  const chatContainer = $('#chat-container');
  const messageDiv = $('<div>', {
    class: 'flex mb-4'
  });
  messageDiv.html(`
    <div class="flex-shrink-0 mr-3">
      <div class="bg-purple-100 p-2 rounded-full">
        <i class="fas fa-robot text-purple-600"></i>
      </div>
    </div>
    <div class="bg-white p-4 rounded-lg shadow-sm max-w-3xl">
      <p>${message}</p>
    </div>
  `);
  chatContainer.append(messageDiv);
  chatContainer.scrollTop(chatContainer[0].scrollHeight);
  chatHistory.push({
    role: 'bot',
    content: message
  });
}

function showLoadingIndicator() {
  const chatContainer = $('#chat-container');
  const loadingDiv = $('<div>', {
    class: 'flex mb-4'
  });
  loadingDiv.html(`
<div class="flex-shrink-0 mr-3">
  <div class="bg-purple-100 p-2 rounded-full">
    <i class="fas fa-robot text-purple-600"></i>
  </div>
</div>
<div class="bg-white p-4 rounded-lg shadow-sm max-w-3xl">
  <div class="flex items-center">
    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
    正在思考中...
  </div>
</div>
`);
  loadingDiv.attr('id', 'loading-indicator');
  chatContainer.append(loadingDiv);
  chatContainer.scrollTop(chatContainer[0].scrollHeight);
}

function hideLoadingIndicator() {
  $('#loading-indicator').remove();
}

let isWaitingForResponse = false;

sendButton.click(function () {
  if (isWaitingForResponse) return;

  const message = chatInput.val().trim();
  if (message) {
    // 禁用交互
    isWaitingForResponse = true;
    sendButton.prop('disabled', true).addClass('opacity-50 cursor-not-allowed'); // 新增样式类
    chatInput.prop('disabled', true).addClass('opacity-50 cursor-not-allowed'); // 同时禁用输入框

    addUserMessage(message);
    chatInput.val('');
    showLoadingIndicator();

    $.ajax({
      url: 'http://localhost:5000/chat',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        messages: [chatHistory[chatHistory.length - 1]]
      }),
      success: function (data) {
        hideLoadingIndicator();
        isWaitingForResponse = false;
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = JSON.parse(line.substring(6));
            if (jsonData.token) {
              addBotMessage(jsonData.token);
            }
          }
        }
        sendButton.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
        chatInput.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
      },
      error: function (response) {
        hideLoadingIndicator();
        isWaitingForResponse = false;
        console.error('请求失败:', response.status, response.statusText);
        addBotMessage('抱歉，暂时无法获取回复，请稍后再试。');
        sendButton.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
        chatInput.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
      }
    });
  }
});

chatInput.keypress(function (e) {
  if (e.key === 'Enter') {
    if (isWaitingForResponse) {
      e.preventDefault();
      // 可以添加震动动画提示
      chatInput.addClass('animate-shake').on('animationend', function () {
        $(this).removeClass('animate-shake');
      });
      return;
    }
    sendButton.click();
  }
});
