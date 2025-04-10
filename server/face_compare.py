import cv2
import numpy as np
import base64
from azure.storage.blob import BlobServiceClient
import pandas as pd
import os

class FaceComparer:
    def __init__(self):
        # Azure Blob Storage 연결 설정
        connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_client = self.blob_service_client.get_container_client("image")
        
        # CSV 데이터 로드 - 파일명과 경로 수정
        self.fighter_data = pd.read_csv("../public/data/IndependentData.csv")
        
        # OpenCV 설정
        self.face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        self.orb = cv2.ORB_create(nfeatures=100)
        
    def _base64_to_cv2(self, base64_string):
        if 'data:image' in base64_string:
            base64_string = base64_string.split(',')[1]
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
    def _get_blob_image(self, blob_name):
        try:
            blob_client = self.container_client.get_blob_client(f"images/{blob_name}")
            blob_data = blob_client.download_blob().readall()
            image_array = np.frombuffer(blob_data, np.uint8)
            return cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error loading blob image: {e}")
            return None

    def detect_face(self, image):
        try:
            if image is None:
                return None
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))
            if len(faces) > 0:
                x, y, w, h = faces[0]
                return cv2.resize(image[y:y+h, x:x+w], (150, 150))
            return None
        except Exception as e:
            print(f"Error detecting face: {e}")
            return None

    def get_face_embedding(self, image):
        try:
            if image is None:
                return None
            keypoints, descriptors = self.orb.detectAndCompute(image, None)
            return descriptors
        except Exception as e:
            print(f"Error getting face embedding: {e}")
            return None

    def calculate_similarity(self, embedding1, embedding2):
        try:
            if embedding1 is None or embedding2 is None:
                return 0
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(np.uint8(embedding1), np.uint8(embedding2))
            avg_distance = sum(m.distance for m in matches) / len(matches) if matches else float('inf')
            return max(0, 1 - min(1, avg_distance/100))
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return 0

    def find_match(self, user_image_base64):
        try:
            # 사용자 이미지 처리
            user_image = self._base64_to_cv2(user_image_base64)
            user_face = self.detect_face(user_image)
            if user_face is None:
                return {"error": "얼굴을 찾을 수 없습니다."}
            
            user_embedding = self.get_face_embedding(user_face)
            if user_embedding is None:
                return {"error": "얼굴 특징을 추출할 수 없습니다."}

            # 가장 높은 유사도를 가진 독립운동가 찾기
            best_match = None
            highest_similarity = 0

            for _, row in self.fighter_data.iterrows():
                try:
                    blob_name = row['image_url'].split('/')[-1]
                    fighter_image = self._get_blob_image(blob_name)
                    if fighter_image is None:
                        continue

                    fighter_face = self.detect_face(fighter_image)
                    if fighter_face is None:
                        continue

                    fighter_embedding = self.get_face_embedding(fighter_face)
                    if fighter_embedding is None:
                        continue

                    similarity = self.calculate_similarity(user_embedding, fighter_embedding)
                    
                    if similarity > highest_similarity:
                        highest_similarity = similarity
                        best_match = {
                            'name': row['name'],  # hangle -> name으로 변경
                            'similarity': similarity,
                            'fighterImage': row['image_url'],
                            'matchedFighter': {
                                'name': row['name'],
                                'nameHanja': row['nameHanja'],
                                'movementFamily': row['movementFamily'],
                                'orders': row['orders'],
                                'addressBirth': row['addressBirth'],
                                'activities': row['activities'],
                                'content': row['content'],
                                'image_url': row['image_url']
                            }
                        }
                except Exception as e:
                    print(f"Error processing fighter {row.get('name', 'unknown')}: {e}")
                    continue

            return best_match or {
                'name': '매칭 실패',
                'similarity': 0,
                'fighterImage': '/independence-fighter.png',
                'matchedFighter': None
            }

        except Exception as e:
            print(f"Error in find_match: {e}")
            return {"error": "이미지 비교 중 오류가 발생했습니다."}