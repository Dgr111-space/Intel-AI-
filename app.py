from flask import Flask, request, Response, send_from_directory  # 新增send_from_directory
from openai import OpenAI
from flask_cors import CORS
import json

app = Flask(__name__,
           template_folder='templates',
           static_folder='static')  # 静态文件目录配置

CORS(app)

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed"
)

# 新增根路由，指向static目录下的index.html
@app.route('/')
def serve_index():
    return send_from_directory(".", 'index.html')

# 修改请求方法为 POST
@app.route('/chat', methods=['POST'])
def chat_stream():
    # 获取客户端传递的对话历史
    request_data = request.get_json()
    if request_data is None:
        return "请求数据不是有效的 JSON 格式", 400

    messages = request_data.get('messages', [])
    # 添加 AI 办公助手规则，将规则作为系统消息插入到消息列表开头
    ai_rule = {"role": "system", "content": "你是一个专业的 AI 办公助手，回答问题需简洁专业，主要处理办公相关问题。"}
    messages.insert(0, ai_rule)
    print(messages)
    # 创建流式对话补全
    completion = client.chat.completions.create(
        model="local-model",
        messages=messages,
        temperature=0.7,
        stream=True
    )
    
    def event_stream():
        new_message = {"role": "assistant", "content": ""}
        # 流式处理每个数据块
        for chunk in completion:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                new_message["content"] += content
        return f"data: {json.dumps({'token': new_message["content"]})}\n"
    result = event_stream()
    print(result)
    return result

if __name__ == '__main__':
    app.run(port=5000, debug=True)
