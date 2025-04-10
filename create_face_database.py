import cv2
import numpy as np
import os
import pickle
import pandas as pd

def detect_face(image):
    """ 이미지에서 얼굴 검출 """
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 중간 값의 파라미터 사용
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.2,    # 1.1(관대) ~ 1.3(엄격) 사이의 중간 값
            minNeighbors=4,     # 3(관대) ~ 5(엄격) 사이의 중간 값
            minSize=(35, 35),   # 최소 얼굴 크기 설정
            maxSize=(500, 500)  # 최대 얼굴 크기 제한
        )
        
        if len(faces) == 0:
            print("얼굴을 찾을 수 없습니다.")
            return None
            
        # 가장 큰 얼굴 선택 (여러 얼굴이 검출된 경우)
        faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
        (x, y, w, h) = faces[0]
        
        face = image[y:y+h, x:x+w]
        face = cv2.resize(face, (150, 150))
        return face
    except Exception as e:
        print(f"얼굴 검출 실패: {str(e)}")
        return None

def get_hangul_name(filename):
    """ 파일 이름에서 한글 이름만 추출 """
    # 확장자 제거
    name = os.path.splitext(filename)[0]
    # 공백 이전의 한글 이름만 반환
    return name.split()[0]

def process_images():
    """ 이미지 디렉토리에서 얼굴을 검출하고 데이터베이스 생성 """
    database = []
    image_dir = "public/images"
    csv_path = "public/data/doklip.csv"
    
    # CSV 파일에서 독립운동가 정보 로드
    try:
        print(f"CSV 파일 로드 시도: {csv_path}")
        df = pd.read_csv(csv_path, encoding='utf-8')
        print(f"CSV 파일 로드 성공: {len(df)}개의 레코드")
    except Exception as e:
        print(f"CSV 파일 로드 실패: {str(e)}")
        return None
    
    # 이미지 디렉토리 확인
    if not os.path.exists(image_dir):
        print(f"이미지 디렉토리가 없습니다: {image_dir}")
        return None
        
    print(f"이미지 디렉토리 확인: {image_dir}")
    image_files = [f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"처리할 이미지 파일 수: {len(image_files)}")
    
    # 각 이미지 처리
    for filename in image_files:
        image_path = os.path.join(image_dir, filename)
        print(f"\n처리 중: {filename}")
        
        # 이미지 로드
        try:
            image = cv2.imdecode(np.fromfile(image_path, dtype=np.uint8), cv2.IMREAD_COLOR)
            if image is None:
                print(f"이미지를 로드할 수 없습니다: {filename}")
                continue
        except Exception as e:
            print(f"이미지 로드 중 오류 발생: {filename} - {str(e)}")
            continue
            
        # 얼굴 검출
        face = detect_face(image)
        if face is None:
            print(f"얼굴을 찾을 수 없습니다: {filename}")
            continue
            
        # CSV에서 해당 인물 정보 찾기
        name = get_hangul_name(filename)
        person_info = df[df['name'] == name]
        
        if not person_info.empty:
            entry = {
                'name': name,
                'face': face,
                'info': person_info.iloc[0].to_dict()
            }
            database.append(entry)
            print(f"처리 완료: {name}")
        else:
            print(f"CSV에서 정보를 찾을 수 없습니다: {name}")
    
    return database

def save_database(database):
    """ 데이터베이스를 파일로 저장 """
    try:
        with open('face_database.pkl', 'wb') as f:
            pickle.dump(database, f)
        print(f"\n데이터베이스 저장 완료: {len(database)}개의 얼굴")
    except Exception as e:
        print(f"데이터베이스 저장 실패: {str(e)}")

def main():
    print("얼굴 데이터베이스 생성 시작...")
    database = process_images()
    
    if database:
        save_database(database)
    else:
        print("데이터베이스 생성 실패")

if __name__ == "__main__":
    main() 