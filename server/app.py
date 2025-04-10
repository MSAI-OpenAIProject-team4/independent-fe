from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import pickle
import os
from werkzeug.utils import secure_filename
import base64
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# CORS 설정
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://20.84.89.102"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# 환경 변수에서 설정 로드
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 업로드 폴더가 없으면 생성
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_face(image):
    try:
        # 얼굴 검출기 초기화
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # 그레이스케일 변환
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 얼굴 검출
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            return None
            
        # 첫 번째 얼굴만 사용
        (x, y, w, h) = faces[0]
        face = image[y:y+h, x:x+w]
        
        # 크기 조정
        face = cv2.resize(face, (150, 150))
        
        return face
    except Exception as e:
        print(f"얼굴 검출 중 오류: {str(e)}")
        return None

def compare_faces(face1, face2):
    try:
        # ORB 특징점 검출기 초기화
        orb = cv2.ORB_create()
        
        # 특징점과 디스크립터 계산
        kp1, des1 = orb.detectAndCompute(face1, None)
        kp2, des2 = orb.detectAndCompute(face2, None)
        
        if des1 is None or des2 is None:
            return 0.0
            
        # BFMatcher 객체 생성
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        
        # 매칭 수행
        matches = bf.match(des1, des2)
        
        # 매칭 점수 계산
        score = sum(m.distance for m in matches) / len(matches) if matches else float('inf')
        
        # 점수를 0-100 사이로 변환 (낮을수록 유사)
        similarity = max(0, min(100, 100 - (score / 100)))
        
        return similarity
    except Exception as e:
        print(f"얼굴 비교 중 오류: {str(e)}")
        return 0.0

@app.route('/compare', methods=['POST'])
def compare_images():
    try:
        if 'image' not in request.files:
            return jsonify({'error': '이미지 파일이 없습니다.'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': '선택된 파일이 없습니다.'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': '허용되지 않는 파일 형식입니다.'}), 400
            
        # 파일 저장
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 이미지 읽기
        user_image = cv2.imread(filepath)
        if user_image is None:
            return jsonify({'error': '이미지를 읽을 수 없습니다.'}), 400
            
        # 얼굴 검출
        user_face = detect_face(user_image)
        if user_face is None:
            return jsonify({'error': '얼굴을 찾을 수 없습니다.'}), 400
            
        # 데이터베이스 로드
        try:
            with open('face_database.pkl', 'rb') as f:
                database = pickle.load(f)
        except FileNotFoundError:
            return jsonify({'error': '얼굴 데이터베이스를 찾을 수 없습니다.'}), 500
            
        # 가장 유사한 얼굴 찾기
        best_match = None
        best_score = 0
        
        for entry in database:
            similarity = compare_faces(user_face, entry['face'])
            if similarity > best_score:
                best_score = similarity
                best_match = entry
                
        if best_match is None:
            return jsonify({'error': '일치하는 얼굴을 찾을 수 없습니다.'}), 404
            
        # 결과 반환
        return jsonify({
            'match': True,
            'name': best_match['name'],
            'nameHanja': best_match['nameHanja'],
            'movementFamily': best_match['movementFamily'],
            'orders': best_match['orders'],
            'addressBirth': best_match['addressBirth'],
            'activities': best_match['activities'],
            'references': best_match['references'],
            'similarity': round(best_score, 2),
            'matchedImage': f"data:image/jpeg;base64,{base64.b64encode(cv2.imencode('.jpg', best_match['face'])[1]).decode()}"
        })
        
    except Exception as e:
        print(f"서버 오류: {str(e)}")
        return jsonify({'error': '서버 오류가 발생했습니다.'}), 500
        
    finally:
        # 임시 파일 삭제
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)