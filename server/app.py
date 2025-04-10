from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from face_compare import FaceComparer

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
CORS(app)

# FaceComparer 인스턴스 생성
face_comparer = FaceComparer()

@app.route('/compare', methods=['POST'])
def compare_images():
    try:
        data = request.json
        user_image = data.get('userImage')
        
        if not user_image:
            return jsonify({'error': '사용자 이미지가 없습니다.'}), 400
            
        # FaceComparer를 사용하여 이미지 비교
        result = face_comparer.find_match(user_image)
        
        if 'error' in result:
            return jsonify(result), 500
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': '이미지 비교 중 오류가 발생했습니다.'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)