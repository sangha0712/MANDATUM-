import { Character } from '../types';

export const characters: Character[] = [
  // LADER
  {
    id: 'han-yuna', name: '한유나', gender: '여성', age: 17, grade: 2, organization: 'LADER',
    pulse: { name: '마스터키', description: '전 세계 온라인 및 오프라인 정보에 대한 접근 권한을 부여한다.' },
    personality: '귀차니즘 / 상냥함', features: '남의 정보를 훔쳐보는 것이 취미.\n사이버폭력으로 학교를 자퇴했다.\n현장팀 지휘 에이스.', image: '/assets/characters/han-yuna.webp'
  },
  {
    id: 'ha-siyeon', name: '하시연', gender: '여성', age: 20, grade: 1, organization: 'LADER',
    pulse: { name: 'NULL', description: '상대의 기능 중 하나를 무효화한다.' },
    personality: '비관적 / 귀염성 / 허당', features: '능력 자체는 강력하지만 제어하지 못해 1세대.\n한유나에게 매일 찡찡대는 케미가 있다.', image: '/assets/characters/ha-siyeon.webp'
  },
  {
    id: 'song-seoyeon', name: '송서연', gender: '여성', age: 19, grade: 2, organization: 'LADER',
    pulse: { name: '일섬', description: '손이나 발로 허공에 그은 방향으로 참격을 발생시킨다.' },
    personality: '긍정적 / 유능함 / 헌신적', features: '실력은 4세대 상위권 수준.\nLADER 인사팀장.\n전 특수부대 출신.\n와이어 무기를 사용한다.', image: '/assets/characters/song-seoyeon.webp'
  },
  {
    id: 'yu-haein', name: '유해인', gender: '여성', age: 29, grade: 4, organization: 'LADER',
    pulse: { name: '로드아웃 & 인시전', description: '로드아웃: 각종 무기를 소환하고 투척한다.\n인시전: 무기와 자신의 이동 경로에 궤적을 남겨 베어낸다.' },
    personality: '냉정함 / 책임감', features: 'LADER의 리더.\nPACTUM을 예의주시하고 있다.', image: '/assets/characters/yu-haein.webp'
  },
  
  // PACTUM
  {
    id: 'han-jiwon', name: '한지원', gender: '여성', age: 25, grade: 4, organization: 'PACTUM',
    pulse: { name: '무능력', description: '펄스가 없는 대신 신체능력이 성인 남성의 약 40배. 에테르 제어술에 능하다.' },
    personality: '무뚝뚝함 / 상냥함 / 능글맞음', features: 'PACTUM 부리더.', image: '/assets/characters/han-jiwon.webp'
  },
  {
    id: 'chae-nahyeon', name: '채나현', gender: '여성', age: 20, grade: 3, organization: 'PACTUM',
    pulse: { name: '아포카시스', description: '결손, 실명 등의 상처를 약 5분에 걸쳐 회복한다.' },
    personality: '관찰력 / 능글맞음 / 은근한 고집 / 정에 약함', features: '주로 의무실에 틀어박혀 있다.\n시체 해부 업무를 맡는다.\n채인아의 언니.', image: '/assets/characters/chae-nahyeon.webp'
  },
  {
    id: 'lim-harin', name: '임하린', gender: '여성', age: 21, grade: 5, organization: 'PACTUM',
    pulse: { name: '레플리카', description: '접촉한 대상의 능력을 영구적으로 복사한다. 최대 4개까지 보유 가능.' },
    personality: '명랑함 / 낙천적 / 친화력 / 희생정신', features: '정신적으로 위태로운 상태.\n동생의 죽음에 감응하여 5세대로 각성했다.\n"으엥"거리는 버릇이 있다.\n전직 특수부대 리더.\nPACTUM 리더.\n평화의 상징.', image: '/assets/characters/lim-harin.webp'
  },
  {
    id: 'chae-ina', name: '채인아', gender: '여성', age: 19, grade: 3, organization: 'PACTUM',
    pulse: { name: '아나스타시스', description: '처치한 에이저를 큐브로 변환 및 섭취한 뒤 소환수로 소환할 수 있다.' },
    personality: '천진난만 / 먹보 / 행동파 / 붙임성', features: '큐브는 매번 다른 맛이 나며 큐브 먹는 것을 좋아한다.\n채나현의 동생.\n"으헤~"거리는 버릇이 있다.\n종종 군대식 다/나/까체를 사용한다.', image: '/assets/characters/chae-ina.webp'
  },
  {
    id: 'tabi', name: '타비', gender: '여성', age: 20, grade: 2, organization: 'PACTUM',
    pulse: { name: '버스트 코어', description: '신체능력을 최대 약 30배까지 증가시킨다.' },
    personality: '성실함 / 츤데레 / 자존심 / 허당 / 쉽게 당황함 / 눈치 없음', features: '호랑이 귀와 꼬리를 가지고 있다.\nPACTUM의 메이드.', image: '/assets/characters/tabi.webp'
  },
  
  // UNKNOWN
  {
    id: 'yoon-hyunah', name: '윤현아', gender: '여성', age: 16, grade: 4, organization: 'UNKNOWN',
    pulse: { name: '프리즘', description: '손에서 레이저를 생성한다. 광선이나 무기 등 다양한 형태로 활용한다.' },
    personality: '장난기 / 능글맞음 / 호기심 / 약올리기 / 겁 없음', features: '암시장에서 물건 취급을 당하던 것을 크리스가 구해줬다.', image: '/assets/characters/yoon-hyunah.webp'
  },
  {
    id: 'yoon-seha', name: '윤세아', gender: '여성', age: 21, grade: 5, organization: 'UNKNOWN',
    pulse: { name: '메타시스', description: '의식만으로 자신과 생물을 소환하거나 위치를 변경한다.' },
    personality: '오만함 / 자기중심적 / 계산적 / 품위', features: '과거 붕괴 현장에서 히어로에게 구조받지 못했던 일로 증오를 품고 있다.\n해당 현장에서 펄스를 각성했다.', image: '/assets/characters/yoon-seha.webp'
  },
  {
    id: 'sage', name: '세이지', gender: '여성', age: 15, grade: 4, organization: 'UNKNOWN',
    pulse: { name: '벡터클로', description: '손톱을 자유자재로 늘리거나 각도를 휘게 만들어 공격한다.' },
    personality: '무기력 / 무관심 / 독설 / 마이페이스 / 은근한 의리', features: '고양이 수인.\n타비와 같은 학교에서 왕따를 당했다.', image: '/assets/characters/sage.webp'
  },
  {
    id: 'iruha', name: '이루하', gender: '여성', age: 27, grade: 4, organization: 'UNKNOWN',
    pulse: { name: '트랜스미션', description: '자신을 포함해 접촉한 물체의 속력을 최대 음속까지 조종한다.' },
    personality: '쿨함 / 원칙주의 / 유능함', features: '과거 PACTUM 소속.\n히어로의 희생에도 계속되는 비난에 회의를 느껴 UNKNOWN으로 이적했다.', image: '/assets/characters/iruha.webp'
  },
  {
    id: 'chris', name: '크리스', gender: '남성', age: 21, grade: 5, organization: 'UNKNOWN',
    pulse: { name: '오버라이드', description: '상대와 15초 이상 접촉하면 그 대상의 능력을 강탈한다. 현재 이미 5개의 능력을 소유하고 있다.' },
    personality: '광기 / 증오 / 영악함 / 치밀함', features: '임하린보다 강하다.', image: '/assets/characters/chris.webp'
  },

  // ORIA
  {
    id: 'geum-hana', name: '금하나', gender: '여성', age: 20, grade: 3, organization: 'ORIA',
    pulse: { name: '그라브', description: '손가락을 움직여 시선 내 대상의 중력 방향을 전환한다.' },
    personality: '건방짐 / 장난기 / 활발함 / 승부욕 / 허당', features: 'LADER에서 근무하다 근무환경에 불만을 느껴 서쪽으로 이동했다.', image: '/assets/characters/geum-hana.webp'
  },
  {
    id: 'oharu', name: '노연서', gender: '여성', age: 16, grade: 3, organization: 'ORIA',
    pulse: { name: '카운트', description: '자신을 포함한 물체의 질량을 자유자재로 변화시킨다.' },
    personality: '호쾌함 / 낙천적 / 대담함 / 책임감', features: 'ORIA의 리더.\n지방을 떠나는 사람이 많아 어린 나이에 리더가 되었다.', image: '/assets/characters/oharu.webp'
  },

  // EASTER
  {
    id: 'kim-jihyun', name: '김지현', gender: '남성', age: 25, grade: 3, organization: 'EASTER',
    pulse: { name: '리펄서', description: '반경 2미터에 무형·무색의 배리어를 생성한다.' },
    personality: '과묵 / 완벽주의 / 융통성 부족', features: 'EASTER의 리더.\n어린 시절 겪은 빌런 참사 이후 감정이 무뎌졌다.', image: '/assets/characters/kim-jihyun.webp'
  },
  {
    id: 'aira', name: '아이라', gender: '여성', age: 26, grade: 2, organization: 'EASTER',
    pulse: { name: '아첼레란도', description: '전투를 지속할수록 동작이 빨라지고 매끄러워진다.' },
    personality: '온화함 / 침착함 / 자기희생적', features: '김지현에게 구해진 뒤 EASTER에 들어가 김지현을 돕고 있다.', image: '/assets/characters/aira.webp'
  },

  // NIVALI
  {
    id: 'sora', name: '소라', gender: '여성', age: 17, grade: 4, organization: 'NIVALI',
    pulse: { name: '화이트아웃', description: '얼음을 생성하고 냉기를 조종한다. 최대 범위 약 10km.' },
    personality: '소심함 / 내향적 / 다정함 / 낯가림', features: '전투 시 성격이 완전히 반전된다.\nNIVALI의 리더.\n세츠나와 친하다.', image: '/assets/characters/sora.webp'
  },

  // SOLARIA
  {
    id: 'sui', name: '스이', gender: '여성', age: 23, grade: 3, organization: 'SOLARIA',
    pulse: { name: '마레아', description: '물을 조종한다. 고온, 고압, 고밀도로 응용해 공격할 수 있다.' },
    personality: '느긋함 / 현실적 / 친화적', features: 'SOLARIA의 리더.\nNIVALI의 인력이 부족해 종종 세츠나를 파견한다.', image: '/assets/characters/sui.webp'
  },
  {
    id: 'setsuna', name: '세츠나', gender: '여성', age: 24, grade: 4, organization: 'SOLARIA',
    pulse: { name: '제로 아워', description: '손가락을 튕겨 반경 10미터 내의 시간을 정지한다.' },
    personality: '상냥함 / 맹함 / 수줍음', features: '쓰다듬 받는 것을 좋아한다.\n소라를 매우 좋아한다.\n느긋하고 늘어지는 말투를 사용한다.', image: '/assets/characters/setsuna.webp'
  }
];

