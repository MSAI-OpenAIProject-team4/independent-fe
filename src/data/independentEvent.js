const historicalEvents = {
  ahnJoongGeun: {
    id: 'event_001',
    title: '안중근 의사의 하얼빈 의거',
    year: '1909',
    summary: '안중근 의사는 1909년 10월 26일, 하얼빈 역에서 대한제국의 외교권을 박탈한 주범 이토 히로부미를 저격하였다. 이는 한국의 독립 의지를 세계에 알린 대표적인 의거로 평가된다.',
    keyFigures: ['안중근', '이토 히로부미', '우덕순', '조도선'],
    flows: [
      {
        id: 0,
        text: '이토 히로부미의 만주 방문 소식이 들어왔습니다. 하얼빈 역에서 그를 처단할 기회가 찾아왔습니다.',
        choices: [
          {
            id: 'A',
            text: '하얼빈에 잠입해 정찰을 한다',
            nextScene: 'scout'
          },
          {
            id: 'B',
            text: '의거 후 탈출 경로를 준비한다',
            nextScene: 'escape'
          },
          {
            id: 'C',
            text: '재판에서 자신의 뜻을 밝힌다',
            nextScene: 'trial'
          }
        ]
      }
    ],
    outcomes: {
      scout: {
        text: '당신은 하얼빈 역을 정찰하며 이토 히로부미의 동선을 파악했습니다. 이는 성공적인 의거의 첫걸음이 되었습니다.',
        result: '이토 히로부미 제거로 독립 의지 표출'
      },
      escape: {
        text: '당신은 의거 후의 탈출 경로를 준비했지만, 결국 체포되어 사형을 선고받았습니다.',
        result: '체포되어 사형 판결'
      },
      trial: {
        text: '재판에서 당신은 당당히 독립의 의지를 밝혔고, 이는 세계 언론의 주목을 받았습니다.',
        result: '세계 언론의 주목과 한국 독립운동 고취'
      }
    }
  },
  marchFirst: {
    id: 'event_002',
    title: '3·1 운동 참여한 유관순 열사',
    year: '1919',
    summary: '3·1 운동은 1919년 3월 1일 시작된 한국의 대규모 비폭력 항일 운동이다. 독립선언서 낭독과 함께 전국적으로 만세 시위가 펼쳐졌으며, 이는 대한민국 임시정부 수립의 계기가 되었다.',
    keyFigures: ['유관순', '손병희', '이승훈', '한용운'],
    flows: [
      {
        id: 0,
        text: '고종의 죽음으로 인한 국민적 분노가 고조되고 있습니다. 3월 1일, 독립선언서 낭독과 함께 만세운동이 시작되려 합니다.',
        choices: [
          {
            id: 'A',
            text: '독립선언서를 몰래 배포한다',
            nextScene: 'distribute'
          },
          {
            id: 'B',
            text: '학교에서 만세운동을 조직한다',
            nextScene: 'organize'
          },
          {
            id: 'C',
            text: '체포되어 법정에서 진술한다',
            nextScene: 'testify'
          }
        ]
      }
    ],
    outcomes: {
      distribute: {
        text: '당신은 독립선언서를 몰래 배포하며 독립의 의지를 전파했습니다. 하지만 일제의 감시 대상이 되었습니다.',
        result: '일제의 감시 대상이 됨'
      },
      organize: {
        text: '당신은 학교에서 만세운동을 조직했지만, 결국 체포되어 동료들과 함께 투옥되었습니다.',
        result: '동료들과 함께 투옥됨'
      },
      testify: {
        text: '법정에서 당신의 진술은 대한민국 임시정부 탄생에 기여하는 중요한 계기가 되었습니다.',
        result: '대한민국 임시정부 탄생에 기여'
      }
    }
  },
  yunBongGil: {
    id: 'event_003',
    title: '윤봉길 의사의 홍커우 공원 의거',
    year: '1932',
    summary: '윤봉길 의사는 1932년 4월 29일, 상하이 홍커우 공원에서 열린 일본 천황 생일 행사에 폭탄을 투척해 일본군 수뇌부를 공격하였다. 이 의거는 중국과 세계에 한국의 독립의지를 강하게 알렸다.',
    keyFigures: ['윤봉길', '김구', '시라카와 요시노리', '도조 히데키'],
    flows: [
      {
        id: 0,
        text: '상하이 홍커우 공원에서 일본 천황 생일 행사가 열립니다. 한인애국단의 일원으로서 의거를 준비하고 있습니다.',
        choices: [
          {
            id: 'A',
            text: '위장 신분으로 행사장 잠입',
            nextScene: 'infiltrate'
          },
          {
            id: 'B',
            text: '폭탄 위치를 조정해 최대 피해 유도',
            nextScene: 'bomb'
          },
          {
            id: 'C',
            text: '체포 후 당당히 신념 밝힘',
            nextScene: 'belief'
          }
        ]
      }
    ],
    outcomes: {
      infiltrate: {
        text: '당신은 위장 신분으로 행사장에 잠입하여 일본군 고위 인사들을 제거했습니다.',
        result: '일본군 고위 인사 제거'
      },
      bomb: {
        text: '당신의 의거로 인해 중국과의 협력이 강화되었습니다.',
        result: '중국과의 협력 강화'
      },
      belief: {
        text: '체포 후 당신의 당당한 태도는 전 세계의 독립운동에 대한 관심을 높였습니다.',
        result: '전 세계 독립운동 관심 증가'
      }
    }
  }
};

export default historicalEvents;
