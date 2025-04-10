import cv2
import numpy as np
import pickle
import matplotlib.pyplot as plt

def load_database():
    """데이터베이스 로드"""
    try:
        with open('face_database.pkl', 'rb') as f:
            database = pickle.load(f)
        print(f"데이터베이스 로드 완료: {len(database)}개의 얼굴")
        return database
    except Exception as e:
        print(f"데이터베이스 로드 실패: {str(e)}")
        return None

def detect_face(image):
    """이미지에서 얼굴 검출"""
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 이미지 크기 출력
        print(f"이미지 크기: {image.shape}")
        
        # 얼굴 검출 파라미터 조정
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,  # 더 작은 값으로 조정
            minNeighbors=3,   # 더 작은 값으로 조정
            minSize=(30, 30)  # 최소 얼굴 크기
        )
        
        print(f"검출된 얼굴 수: {len(faces)}")
        
        if len(faces) == 0:
            # 원본 이미지 저장하여 확인
            cv2.imwrite('debug_target.jpg', image)
            print("얼굴을 찾을 수 없습니다. debug_target.jpg 파일을 확인해주세요.")
            return None
            
        # 가장 큰 얼굴 선택
        faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
        (x, y, w, h) = faces[0]
        
        # 얼굴 영역 좌표 출력
        print(f"얼굴 영역: x={x}, y={y}, width={w}, height={h}")
        
        face = image[y:y+h, x:x+w]
        face = cv2.resize(face, (150, 150))
        
        # 검출된 얼굴 저장하여 확인
        cv2.imwrite('debug_face.jpg', face)
        return face
    except Exception as e:
        print(f"얼굴 검출 실패: {str(e)}")
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

def find_match(database, target_face):
    """가장 닮은 독립운동가 찾기"""
    best_match = None
    highest_similarity = 0
    
    for entry in database:
        similarity = compare_faces(target_face, entry['face'])
        if similarity > highest_similarity:
            highest_similarity = similarity
            best_match = entry
    
    return best_match, highest_similarity

def show_result(target_face, match_face, name, similarity):
    """결과 시각화"""
    plt.figure(figsize=(10, 5))
    
    plt.subplot(121)
    plt.imshow(cv2.cvtColor(target_face, cv2.COLOR_BGR2RGB))
    plt.title('입력 이미지')
    plt.axis('off')
    
    plt.subplot(122)
    plt.imshow(cv2.cvtColor(match_face, cv2.COLOR_BGR2RGB))
    plt.title(f'가장 닮은 독립운동가\n{name}\n(유사도: {similarity:.2%})')
    plt.axis('off')
    
    plt.tight_layout()
    plt.show()

def main():
    # 데이터베이스 로드
    database = load_database()
    if database is None:
        return
        
    # 테스트 이미지 로드
    test_image = cv2.imread('public/target.jpg')
    if test_image is None:
        print("테스트 이미지를 로드할 수 없습니다.")
        return
        
    # 얼굴 검출
    target_face = detect_face(test_image)
    if target_face is None:
        return
        
    # 가장 닮은 독립운동가 찾기
    best_match, similarity = find_match(database, target_face)
    
    if best_match:
        print(f"\n가장 닮은 독립운동가: {best_match['name']}")
        print(f"유사도: {similarity:.2%}")
        
        # 결과 시각화
        show_result(target_face, best_match['face'], best_match['name'], similarity)
        
        # 독립운동가 정보 출력
        print("\n[독립운동가 정보]")
        info = best_match['info']
        print(f"이름: {info['name']} ({info['nameHanja']})")
        print(f"운동 계열: {info['movementFamily']}")
        print(f"훈장: {info['orders']}")
        print(f"출생지: {info['addressBirth']}")
        print(f"활동: {info['activities']}")
    else:
        print("매칭 결과가 없습니다.")

if __name__ == "__main__":
    main() 