from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import pickle
import os
from werkzeug.utils import secure_filename
import base64
from dotenv import load_dotenv
import io
from PIL import Image
from PIL import ExifTags

load_dotenv()

app = Flask(__name__)

# CORS 설정
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://20.84.89.102"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# OPTIONS 요청 처리
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# 환경 변수에서 설정 로드
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 업로드 폴더가 없으면 생성
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 전역 변수로 데이터베이스 로드
DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'face_database.pkl')

try:
    if not os.path.exists(DB_PATH):
        print(f"데이터베이스 파일이 존재하지 않습니다: {DB_PATH}")
        face_database = None
    else:
        with open(DB_PATH, 'rb') as f:
            face_database = pickle.load(f)
            print(f"데이터베이스 로드 완료: {len(face_database)}개의 얼굴")
except Exception as e:
    print(f"데이터베이스 로드 실패: {str(e)}")
    face_database = None

# 데이터베이스 상태 확인 엔드포인트 추가
@app.route('/database-status', methods=['GET'])
def check_database():
    if face_database is None:
        return jsonify({
            "status": "error",
            "message": "데이터베이스가 로드되지 않았습니다.",
            "path": DB_PATH
        })
    return jsonify({
        "status": "success",
        "count": len(face_database),
        "path": DB_PATH
    })

def detect_face(image):
    """이미지에서 얼굴 검출"""
    try:
        # 이미지 전처리
        # 이미지 크기 조정 (너무 큰 이미지 처리 방지)
        max_dimension = 1024
        height, width = image.shape[:2]
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            image = cv2.resize(image, None, fx=scale, fy=scale)

        # 이미지 품질 개선
        image = cv2.equalizeHist(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
        
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # 다양한 스케일로 얼굴 검출 시도
        faces = face_cascade.detectMultiScale(
            image,
            scaleFactor=1.1,  # 더 세밀한 스케일 팩터
            minNeighbors=3,   # 더 관대한 이웃 설정
            minSize=(30, 30),
            maxSize=(800, 800)
        )
        
        if len(faces) == 0:
            # 첫 시도 실패시 다른 파라미터로 재시도
            faces = face_cascade.detectMultiScale(
                image,
                scaleFactor=1.2,
                minNeighbors=2,
                minSize=(20, 20),
                maxSize=(1000, 1000)
            )
            
        if len(faces) == 0:
            print("얼굴 검출 실패: 얼굴을 찾을 수 없습니다")
            return None
            
        # 가장 큰 얼굴 선택
        faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
        (x, y, w, h) = faces[0]
        
        # 얼굴 영역 약간 확장
        margin = int(min(w, h) * 0.1)
        x = max(0, x - margin)
        y = max(0, y - margin)
        w = min(image.shape[1] - x, w + 2*margin)
        h = min(image.shape[0] - y, h + 2*margin)
        
        face = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)[y:y+h, x:x+w]
        face = cv2.resize(face, (150, 150))
        
        # 이미지 품질 확인
        if face.size == 0 or face is None:
            print("얼굴 이미지 추출 실패")
            return None
            
        return face
        
    except Exception as e:
        print(f"얼굴 검출 중 오류 발생: {str(e)}")
        return None

def compare_faces(face1, face2):
    """두 얼굴 이미지 비교"""
    try:
        # ORB 특징점 검출기 생성
        orb = cv2.ORB_create(nfeatures=1000)
        
        # 각 이미지에서 특징점 검출
        kp1, des1 = orb.detectAndCompute(face1, None)
        kp2, des2 = orb.detectAndCompute(face2, None)
        
        if des1 is None or des2 is None:
            return 0
        
        # 브루트 포스 매칭
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        
        # 매칭 거리의 평균 계산
        avg_distance = sum(m.distance for m in matches) / len(matches)
        
        # 유사도 점수 계산 (0~1 사이 값)
        similarity = max(0, 1 - avg_distance/100)
        return similarity
        
    except Exception as e:
        print(f"얼굴 비교 실패: {str(e)}")
        return 0

@app.route('/compare', methods=['POST'])
def compare_images():
    try:
        if face_database is None:
            return jsonify({"error": "데이터베이스가 로드되지 않았습니다."})
            
        # 이미지 데이터 받기
        data = request.json
        image_data = data.get('image', '')
        
        # base64 디코딩
        if 'data:image' in image_data:
            image_data = image_data.split(',')[1]
        
        # 이미지 변환 및 전처리
        img_data = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_data))
        user_img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        # 이미지 방향 보정
        try:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            exif = dict(img._getexif().items())
            if exif[orientation] == 3:
                user_img_cv = cv2.rotate(user_img_cv, cv2.ROTATE_180)
            elif exif[orientation] == 6:
                user_img_cv = cv2.rotate(user_img_cv, cv2.ROTATE_90_CLOCKWISE)
            elif exif[orientation] == 8:
                user_img_cv = cv2.rotate(user_img_cv, cv2.ROTATE_90_COUNTERCLOCKWISE)
        except (AttributeError, KeyError, IndexError):
            # EXIF 데이터가 없거나 처리할 수 없는 경우 무시
            pass
        
        # 얼굴 검출
        user_face = detect_face(user_img_cv)
        if user_face is None:
            return jsonify({"error": "얼굴을 찾을 수 없습니다. 다른 사진을 시도해보세요."})
        
        # 가장 닮은 독립운동가 찾기
        best_match = None
        highest_similarity = 0
        
        for entry in face_database:
            similarity = compare_faces(user_face, entry['face'])
            if similarity > highest_similarity:
                highest_similarity = similarity
                best_match = entry
        
        if best_match and highest_similarity > 0.1:  # 최소 유사도 임계값 추가
            return jsonify({
                "matchedFighter": best_match['info'],
                "similarity": float(highest_similarity)
            })
        else:
            return jsonify({"error": "유사한 얼굴을 찾을 수 없습니다. 다른 사진을 시도해보세요."})
            
    except Exception as e:
        print(f"Error in compare_images: {str(e)}")
        return jsonify({"error": "이미지 처리 중 오류가 발생했습니다. 다른 사진을 시도해보세요."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)