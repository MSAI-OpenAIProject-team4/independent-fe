import cv2
import numpy as np
import os
import matplotlib.pyplot as plt
import pickle
import time

plt.rcParams['font.family'] = 'Malgun Gothic'
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# ORB 특징점 수 조정
orb = cv2.ORB_create(nfeatures=500)  # 특징점 수 증가

def detect_face(image):
    """ 얼굴 검출 후 150x150 크기로 리사이즈 """
    try:
        if image is None:
            print("입력 이미지가 None입니다.")
            return None
            
        # 이미지 크기 출력
        print(f"입력 이미지 크기: {image.shape}")
            
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 얼굴 검출 파라미터 조정
        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.3,  # 스케일 팩터 증가
            minNeighbors=3,   # 민감도 증가
            minSize=(30, 30)  # 최소 크기 감소
        )
        
        print(f"검출된 얼굴 수: {len(faces)}")
        
        if len(faces) > 0:
            x, y, w, h = faces[0]
            face_img = image[y:y+h, x:x+w]
            resized_face = cv2.resize(face_img, (150, 150))
            print(f"얼굴 영역 크기: {w}x{h}, 리사이즈 후: 150x150")
            return resized_face
        else:
            print("얼굴을 찾을 수 없습니다.")
            return None
    except Exception as e:
        print(f"얼굴 검출 중 오류 발생: {str(e)}")
        return None

def process_single_image(img_path):
    """ 단일 이미지 처리 (얼굴 검출 → 특징 벡터 추출) """
    try:
        filename = os.path.basename(img_path)
        print(f"\n이미지 처리 시작: {filename}")
        
        img = cv2.imread(img_path)
        if img is None:
            print(f"이미지를 불러올 수 없습니다: {img_path}")
            return None
            
        print(f"원본 이미지 크기: {img.shape}")
        
        face = detect_face(img)
        if face is not None:
            embedding = get_face_embedding(face)
            if embedding is not None:
                print(f"특징점 추출 성공: {embedding.shape}")
                return filename, embedding, cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
            else:
                print("특징점 추출 실패")
        return None
    except Exception as e:
        print(f"이미지 처리 중 오류: {str(e)}")
        return None

def get_face_embedding(face_img):
    """ 얼굴 이미지에서 특징 벡터 추출 """
    try:
        if face_img is None:
            print("입력 이미지가 None입니다.")
            return None
            
        # 그레이스케일 변환
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        
        # ORB로 특징점 검출 및 디스크립터 계산
        keypoints, descriptors = orb.detectAndCompute(gray, None)
        
        if descriptors is None:
            print("특징점을 찾을 수 없습니다.")
            return None
            
        print(f"추출된 특징점 수: {len(keypoints)}")
        return descriptors
        
    except Exception as e:
        print(f"특징 벡터 추출 중 오류: {str(e)}")
        return None

def main():
    try:
        # 현재 작업 디렉토리 출력
        print(f"현재 작업 디렉토리: {os.getcwd()}")
        
        data_dir = "public/images/"
        target_path = "public/target.jpg"
        
        # 디렉토리와 파일 존재 여부 확인
        if not os.path.exists(data_dir):
            print(f"❌ 이미지 디렉토리가 없습니다: {data_dir}")
            return
            
        if not os.path.exists(target_path):
            print(f"❌ 타겟 이미지가 없습니다: {target_path}")
            return

        print(f"타겟 이미지 경로: {target_path}")
        target_img = cv2.imread(target_path)
        
        if target_img is None:
            print("❌ 타겟 이미지를 불러올 수 없습니다.")
            return
            
        print(f"타겟 이미지 크기: {target_img.shape}")

        target_face = detect_face(target_img)
        if target_face is None:
            print("❌ 타겟 이미지에서 얼굴을 찾을 수 없습니다.")
            return
            
        target_embedding = get_face_embedding(target_face)
        if target_embedding is None:
            print("❌ 타겟 이미지의 특징점 추출에 실패했습니다.")
            return

        # 데이터베이스 이미지 처리
        database = []
        for filename in os.listdir(data_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                img_path = os.path.join(data_dir, filename)
                result = process_single_image(img_path)
                if result:
                    database.append(result)

        print(f"\n처리된 데이터베이스 이미지 수: {len(database)}")

        # 결과 저장
        with open('face_database.pkl', 'wb') as f:
            pickle.dump(database, f)
            
        print("✅ 얼굴 데이터베이스가 성공적으로 저장되었습니다.")

    except Exception as e:
        print(f"❌ 실행 중 오류 발생: {str(e)}")

if __name__ == "__main__":
    main() 