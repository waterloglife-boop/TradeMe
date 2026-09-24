// 🤖 트레이드미 배민·쿠팡이츠 AI 리뷰 비서 - Background Service Worker
// CSP(Content Security Policy) 우회를 위해 구글 Gemini API 통신을 백그라운드에서 전담 처리합니다.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TradeMe Review AI] Extension successfully installed!');
});

// Content Script 및 Popup으로부터의 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GENERATE_REVIEW_REPLY') {
    handleGenerateReply(request.payload)
      .then((reply) => sendResponse({ success: true, reply }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // 비동기 응답 유지
  }

  if (request.action === 'OPEN_TAB' && request.url) {
    chrome.tabs.create({ url: request.url }, (tab) => {
      sendResponse({ success: true, tabId: tab?.id });
    });
    return true;
  }
});

async function handleGenerateReply(payload) {
  const { apiKey, storeName, persona, contexts, reviewData } = payload;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('구글 Gemini API 키가 설정되지 않았습니다. 확장 프로그램 아이콘을 눌러 API 키를 등록해 주세요.');
  }

  // 1. 사장님 페르소나 말투 가이드
  const personaGuideMap = {
    CHEF: '음식의 정성과 맛을 중요시하는 정중하고 신뢰감 있는 셰프 사장님 말투',
    AUNT: '다정하고 친근한 이모/삼촌 말투 (하트 🥰, 💖 및 애정 어린 이모티콘 사용)',
    MZ_WIT: '젊고 센스 넘치며 유쾌하고 위트 있는 톤',
    MANAGER: '단정하고 깔끔하며 신속하고 친절한 점장 톤'
  };
  const selectedPersonaGuide = personaGuideMap[persona] || personaGuideMap.AUNT;

  // 2. 상황 변수 주입 가이드
  const contextNotes = [];
  if (contexts && contexts.weather) {
    contextNotes.push(`날씨 인사("${contexts.weatherText || '환절기 감기 조심하세요'}")`);
  }
  if (contexts && contexts.newMenu) {
    contextNotes.push(`신메뉴 홍보("${contexts.newMenuText || '신메뉴'}")`);
  }
  if (contexts && contexts.monthlyReorder) {
    contextNotes.push(`단골 재주문 유도("${contexts.monthlyReorderText || '이번 달에도 언제든 생각나실 때 찾아주세요!'}")`);
  }
  if (contexts && contexts.delayApology) {
    contextNotes.push('피크시간 배달 지연/라이더 배차 양해 사과');
  }
  if (contexts && contexts.reviewEvent) {
    contextNotes.push('다음 주문 시 요청사항에 닉네임 기재 시 서비스 약속');
  }

  // 3. 고객 리뷰 및 별점 분석
  const starScore = Number(reviewData.rating) || 5;
  let rawReviewText = (reviewData.text || '').trim();
  if (!rawReviewText && reviewData.rawText) {
    rawReviewText = reviewData.rawText.trim();
  }
  // 더미 텍스트나 placeholder 문자열 방어
  const isDummyText = rawReviewText === '콩불 너무 맛있습니다' || rawReviewText === '맛있게 잘 먹었습니다!';
  const reviewText = isDummyText ? '' : rawReviewText;

  // 순수 한글만 추출하여 실질적인 후기 내용 유무 판별
  const koreanOnly = (reviewText.match(/[가-힣]/g) || []).join('');
  const hasKoreanText = koreanOnly.length > 0;
  const hasReviewText = reviewText.length >= 2 && hasKoreanText;

  // 단순 단답형(10자 이하의 짧은 표현 또는 상투적 감탄사) 판별:
  // 예: "좋아요", "맛있어요", "굿", "최고", "잘먹었습니다", "짱", "맛있네요", "배달 빨라요" 등
  const isGenericWord = /^(?:좋아요|맛있어요|맛나요|최고|최고예요|굿|굿굿|짱|짱짱|잘먹었습니다|잘먹었어요|감사합니다|맛있네요|배달\s*빨라요|또\s*시킬게요|추천|추천해요|만족|만족해요|존맛|존맛탱)+$/i.test(koreanOnly);
  const isShortOrEmpty = !hasKoreanText || koreanOnly.length < 8 || isGenericWord;

  const isNaver = payload.platform === 'NAVER' || reviewData.platform === 'NAVER';
  const isTakeout = Boolean(reviewData.isTakeout);
  const visitCount = Number(reviewData.visitCount) || 0;
  const orderCount = Number(reviewData.orderCount) || 0;
  const orderedMenu = reviewData.menu || (isNaver ? (isTakeout ? '포장 주문' : '매장 방문') : '주문하신 메뉴');
  const customerName = (reviewData.customerName && !isNaver) ? `${reviewData.customerName}님` : '고객님';
  const charLimit = Math.min(Number(payload.charLimit) || 300, 300);
  const emojiLevel = payload.emojiLevel || 'MEDIUM';
  const activePersona = persona || payload.persona || 'CHEF';

  // 3-1. 손님이 글을 안 적었거나, 단순 단답형(10글자 이하, "좋아요", "맛있어요" 등)인 경우:
  // 없는 사실(식사 경험, 밥 한 공기 비웠다는 등)을 AI가 지어내지 않도록, 
  // 사장님이 요청하신 [주문 감사 + 다음 주문도 맛있는 음식 보내드리겠다는 다짐]을 담아
  // 사장님 캐릭터에 맞춘 정갈하고 깔끔한 2~3문장(60~90자 내외)으로 즉시 반환 (0.01초 초고속 속도!)
  if (isShortOrEmpty) {
    let reply = '';
    const brandDisplay = storeName ? storeName : '저희 매장';

    if (isNaver) {
      // 네이버 스마트플레이스 단답형/글없음 답글
      if (activePersona === 'AUNT') {
        reply = `안녕하세요 고객님! 저희 ${brandDisplay}에 방문해 주셔서 정말 고마워요 🥰 다음 방문 때도 만족스러운 음식과 서비스로 뵐 수 있도록 정성을 다할게요. 늘 건강하시고 행복하세요~`;
      } else if (activePersona === 'MZ_WIT') {
        reply = `안녕하세요 고객님! ${brandDisplay}을 찾아주셔서 진심으로 감사드립니다 😆 다음 방문에도 기분 좋은 맛있는 음식으로 맞이하겠습니다! 오늘도 활기찬 하루 보내세요!`;
      } else if (activePersona === 'MANAGER') {
        reply = `안녕하세요 고객님, ${brandDisplay}에 방문해 주셔서 감사드립니다. 다음 방문 시에도 만족스러운 음식과 정성으로 찾아뵐 수 있도록 노력하겠습니다. 편안한 하루 되십시오.`;
      } else {
        // CHEF (기본)
        reply = `안녕하세요 고객님! 저희 ${brandDisplay}에 방문해 주셔서 진심으로 감사드립니다 😊 다음 방문 때도 만족스러운 음식으로 찾아뵐 수 있길 바라며, 재방문 기다리고 있겠습니다. 늘 행복하세요!`;
      }
    } else {
      // 배달 3사 (배민 / 쿠팡이츠 / 요기요) 단답형/글없음 답글
      if (activePersona === 'AUNT') {
        reply = `안녕하세요 고객님! 주문해 주셔서 정말 감사해요 🥰 다음 주문 때도 더욱 푸짐하고 맛있는 음식으로 정성껏 찾아뵐게요! 늘 건강하시고 기분 좋은 하루 보내세요~`;
      } else if (activePersona === 'MZ_WIT') {
        reply = `안녕하세요 고객님! 저희 ${brandDisplay}을 주문해 주셔서 감사드립니다 😆 다음 주문에도 꿀맛 가득 맛있는 음식으로 찾아뵙겠습니다! 오늘도 파이팅 넘치는 하루 되세요!`;
      } else if (activePersona === 'MANAGER') {
        reply = `안녕하세요 고객님, 소중한 주문에 깊이 감사드립니다. 다음 주문 시에도 변함없이 맛있는 음식과 정성으로 찾아뵐 수 있도록 노력하겠습니다. 편안한 하루 보내십시오.`;
      } else {
        // CHEF (기본)
        reply = `안녕하세요 고객님! 주문해 주셔서 진심으로 감사드립니다 😊 다음 주문도 더욱 맛있는 음식을 보내드리도록 정성을 다해 노력하겠습니다. 오늘도 행복하고 편안한 하루 보내세요!`;
      }
    }

    if (emojiLevel === 'NONE') {
      reply = reply.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}😊🥰😆~]/gu, '').trim();
    } else if (emojiLevel === 'LOW') {
      // 이모티콘 1개만 유지
      reply = reply.replace(/🥰/g, '😊').replace(/😆/g, '😊');
    }
    return reply;
  }

  // 이모티콘 사용 강도 지침
  const emojiGuideMap = {
    NONE: '이모티콘(이모지, 하트 등)은 일절 쓰지 말고 100% 텍스트로만 깔끔하고 정중하게 작성해.',
    LOW: '이모티콘은 전체 답글을 통틀어 딱 1~2개만 은은하게 포인트로만 사용해.',
    MEDIUM: '이모티콘은 2~3개 내외로 문맥에 맞게 자연스럽게 사용해.',
    HIGH: '하트와 이모티콘(🥰, 💖, ^^ 등)을 다정하고 풍성하게 듬뿍 사용해.'
  };
  const selectedEmojiGuide = emojiGuideMap[emojiLevel] || emojiGuideMap.MEDIUM;

  // 4. 프롬프트 구성 (실제 내용이 있는 리뷰 작성 시)
  let prompt = '';

  if (isNaver) {
    let visitInfo = '';
    if (visitCount === 1) {
      visitInfo = '저희 매장에 처음 방문해 주신 소중한 첫 손님입니다.';
    } else if (visitCount >= 2) {
      visitInfo = `벌써 ${visitCount}번째 다시 찾아주신 감사한 단골 손님입니다.`;
    }

    prompt = `당신은 네이버 스마트플레이스에서 매장을 운영하는 친절하고 센스 넘치는 사장님입니다.
방문 손님이 남겨주신 소중한 리뷰를 꼼꼼히 정독하고, 사장님이 직접 손님에게 마음을 담아 건네는 정성스럽고 따뜻한 1:1 맞춤형 댓글을 작성해 주세요.

[이용 및 리뷰 정보]
- 매장 상호: ${storeName || '저희 매장'}
- 이용 방식: ${isTakeout ? '포장(테이크아웃)' : '매장 식사'}
${visitInfo ? `- 방문 정보: ${visitInfo}\n` : ''}- 주문 메뉴/키워드: ${orderedMenu}
- 손님 작성 리뷰: "${reviewText}"
- 사장님 말투/캐릭터: ${selectedPersonaGuide}
${contextNotes.length > 0 ? `- 전달사항: ${contextNotes.join(', ')}\n` : ''}- 이모티콘 활용: ${selectedEmojiGuide}

[답글 작성 지침 - 절대 원칙]:
1. [첫인사]: 닉네임 없이 "안녕하세요 고객님!"으로 다정하게 시작하세요.
2. [본론 - 절대 사실 날조 금지 & 손님 언급 내용에만 화답]:
   - 손님이 남겨주신 리뷰("${reviewText}")에 실제로 언급된 구체적인 내용(맛, 양, 서비스 등)에만 1:1로 공감하고 감사하세요.
   - 손님이 쓰지도 않은 내용이나 경험(예: "밥 한 공기를 비우셨다니", "음식이 입맛에 찰떡이셨다니" 등)을 임의로 상상하거나 꾸며내지 마세요.
   - 손님의 리뷰 내용에 귀 기울여 진심으로 소통하는 느낌을 주세요.
${visitCount >= 2 ? `   - 벌써 ${visitCount}번째 다시 찾아주신 단골 고객님께 깊은 감사와 감동의 마음을 표현하세요.\n` : ''}3. [마무리]:
   - 다음 방문 때도 만족스러운 음식과 서비스로 뵐 수 있도록 정성을 다하겠다는 다짐을 전하세요.
   - 언제든 생각나실 때 편하게 또 찾아주시길 바라는 따뜻한 재방문 환영과 감사 인사로 마침표(.)나 느낌표(!)로 확신 있게 맺어 주세요. (절대로 질문이나 물음표로 끝내지 마세요.)
4. [분량 - 리뷰 길이에 비례하여 적정 길이 작성]:
   - 손님 리뷰 분량에 비례하여 자연스럽게 작성하세요. (120자~200자 내외, 최대 260자 이하).
   - 공백 포함 300자를 절대로 초과하지 마세요.
5. [절대 준수 - 원문 인용 및 영문 라벨 금지]:
   - 손님 리뷰 원문을 따옴표("")로 인용하거나 복사하여 출력하지 마세요.
   - "Customer Review:", "Review:" 같은 영문 라벨을 절대 적지 마세요.
   - 오직 사장님이 남길 순수 한국어 답글 본문만 작성하세요.`;
  } else {
    // B. 배달 3사 (배민 / 쿠팡이츠 / 요기요) 프롬프트
    prompt = `당신은 배달앱(배달의민족, 쿠팡이츠, 요기요)에서 매장을 운영하는 친절하고 센스 넘치는 사장님입니다.
손님이 소중한 시간을 내어 남겨주신 리뷰를 꼼꼼히 정독하고, 사장님이 직접 손님에게 마음을 담아 건네는 정성스럽고 감동적인 1:1 맞춤형 답글을 작성해 주세요.

[손님 주문 및 리뷰 정보]
- 매장 상호: ${storeName || '저희 매장'}
- 주문 메뉴: ${orderedMenu}
${orderCount >= 2 ? `- 주문 이력: 저희 매장에서 벌써 ${orderCount}번째 주문해 주신 귀한 단골 고객님입니다!\n` : (orderCount === 1 ? '- 주문 이력: 저희 매장을 처음 찾아주신 소중한 첫 주문 고객님입니다!\n' : '')}- 손님 작성 리뷰: "${reviewText}"
- 사장님 말투/캐릭터: ${selectedPersonaGuide}
${contextNotes.length > 0 ? `- 전달사항: ${contextNotes.join(', ')}\n` : ''}- 이모티콘 활용: ${selectedEmojiGuide}

[답글 작성 지침 - 절대 원칙]:
1. [첫인사]: 닉네임 없이 "안녕하세요 고객님!"으로 다정하게 시작하세요.
2. [본론 - 절대 사실 날조 금지 & 손님 언급 내용에만 화답]:
   - 손님이 남겨주신 리뷰("${reviewText}")에 실제로 언급된 구체적인 내용(맛, 양, 포장 등)에만 1:1로 공감하고 감사하세요.
   - 손님이 쓰지도 않은 내용이나 식사 상황(예: "밥 한 공기를 금세 비우셨다니", "식감이 아삭하셨다니" 등)을 임의로 상상하거나 꾸며내지 마세요.
   - 손님이 칭찬해주신 포인트에 정확히 맞추어 감사 인사를 전하세요.
${orderCount >= 2 ? `   - 벌써 ${orderCount}번째나 잊지 않고 저희 매장을 다시 찾아주신 단골 고객님께 깊은 감사의 마음을 전하세요.\n` : ''}3. [마무리]:
   - 다음 주문도 더욱 맛있는 음식을 보내드리도록 정성을 다해 노력하겠다는 다짐을 전하세요.
   - 다음번에도 언제든 편하게 찾아주시길 바라는 따뜻한 재주문 환영과 감사 인사로 마침표(.)나 느낌표(!)로 확신 있게 맺어 주세요. (절대로 질문이나 물음표로 끝내지 마세요.)
4. [분량 - 리뷰 길이에 비례하여 적정 길이 작성]:
   - 손님의 리뷰 분량에 비례하여 자연스럽게 작성하세요. (120자~200자 내외, 최대 260자 이하).
   - 쿠팡이츠 규격상 공백 포함 300자를 절대로 초과하지 마세요.
5. [절대 준수 - 원문 인용 및 영문 라벨 금지]:
   - 손님 리뷰 원문을 따옴표("")로 인용하거나 복사하여 출력하지 마세요.
   - "Customer Review:", "Review:", "Re-order:" 같은 영문 라벨을 절대 적지 마세요.
   - 오직 사장님이 남길 순수 한국어 답글 본문만 작성하세요.`;
  }

  // 5. Google Gemini API 호출 (다중 모델 폴백 및 자동 탐색)
  const rawText = await callGeminiApi(apiKey, prompt);

  // 6. 응답 정제: 메타데이터 에코 라인, 영문 번역 찌꺼기 전면 제거 및 진짜 답글 추출
  let cleanText = rawText.trim();
  cleanText = cleanText.replace(/^["'“”`]+|["'“”`]+$/g, '').trim();

  // 6-0. AI 검증 찌꺼기 / 프롬프트 체크리스트 원천 박멸 (줄 단위 & 인라인)
  cleanText = cleanText
    .replace(/^[^\n]*(?:Constraint|Greeting|Ending\s*style|Start\s*with|used\?\s*Yes|\?\s*Yes|\?\s*No|Rule\s*\d|Verification|Checklist)[^\n]*\n?/gmi, '')
    .replace(/(?:Constraint\s*\d*[:：]?[^\n.]*[.!]?)/gi, '')
    .replace(/(?:Greeting[:：]\s*)/gi, '')
    .replace(/(?:Ending\s*style[:：]\s*["']?)/gi, '')
    .replace(/(?:Start\s*with\s*["'][^"']*["']\??\s*(?:Yes|No)\.?)/gi, '')
    .replace(/(?:["'][^"']*["']\s*used\?\s*(?:Yes|No)\.?)/gi, '')
    .replace(/\b(?:Yes|No)\.\s*/g, '')
    .replace(/^[*\s-]*No\s+/gm, '')
    .replace(/\(\d+\s*stars?\)/gi, '')
    .trim();

  // 6-0.1. 손님 리뷰 복사/인용구 및 영문 라벨 (Customer Review, Re-order 등) 즉시 박멸
  if (hasReviewText) {
    const escapedReview = reviewText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 따옴표로 감싸진 손님 리뷰 인용구 (예: "3인분인데 양 많아요..." .) 통째로 삭제
    cleanText = cleanText.replace(new RegExp(`["'“”][^"'“”]*${escapedReview}[^"'“”]*["'“”][.]?\\s*`, 'gi'), '');
    cleanText = cleanText.replace(new RegExp(`["'“”]${escapedReview}["'“”][.]?\\s*`, 'gi'), '');
    if (reviewText.length >= 8) {
      const snippet = reviewText.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanText = cleanText.replace(new RegExp(`["'“”][^"'“”]*${snippet}[^"'“”]*["'“”][.]?\\s*`, 'gi'), '');
    }
    // 시작 부분에 따옴표가 있든 없든 손님 리뷰를 그대로 출력하고 마침표 찍은 형태 제거
    cleanText = cleanText.replace(new RegExp(`^(?:안녕하세요\\s*고객님!?[,\\s]*)?["'“”]?${escapedReview}["'“”]?[.]?\\s*`, 'gmi'), '');
    // 첫인사 직후 바로 따옴표로 시작하는 4글자 이상의 인용구 (예: 안녕하세요 고객님! "3인분인데..." .) 통째로 제거
    cleanText = cleanText.replace(/^(?:안녕하세요\s*고객님!?[,\\s]*)?["'“”][^"'“”]{4,}["'“”]\s*[.·•-]?\s*/i, '');
  }

  // 영문 메타 라벨 라인 통째로 삭제 (Customer Review:, Re-order: 등)
  cleanText = cleanText.replace(/^[^\n]*(?:Customer\s*Review|Re-?order|Review\s*Content|Ordered\s*Menu)[^\n]*\n?/gmi, '');
  cleanText = cleanText.replace(/(?:Customer\s*Review|Re-?order|Review\s*Content)[:：]\s*["'“”]?[^"\n]*["'“”]?[.]?/gi, '');

  // 주문 메뉴명이 첫인사 앞/뒤에 단독 라벨 형태로 찍힌 잔여물 정리
  if (orderedMenu && orderedMenu !== '주문하신 메뉴' && orderedMenu !== '매장 방문' && orderedMenu !== '포장 주문') {
    const escapedMenu = orderedMenu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanText = cleanText.replace(new RegExp(`^(?:안녕하세요\\s*고객님!?[,\\s]*)?${escapedMenu}\\s*[.·•-]?\\s*`, 'gmi'), '');
  }

  // 중복된 "안녕하세요 고객님!" 정리
  cleanText = cleanText.replace(/^(?:안녕하세요\s*고객님[!\s.]*){2,}/, '안녕하세요 고객님! ');

  // 6-1. 라인별 메타데이터 / 영문 번역 라인 필터링
  const lines = cleanText.split('\n');
  const filteredLines = [];

  const metaLabelRegex = /^[\s*•\-]*\b(Customer\s*Review|Customer|Client|User|Ordered\s*Menu|Menu|Review\s*Content|Review|Re-?order|Rating|Score|Address(\s*the\s*customer)?|Tone|Persona|Analysis|Note|Notes|Translation|Context|Situation|Response|Reply|Task|Constraint|Greeting|Ending|Rule|Instruction)\b\s*[:：]/i;

  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) {
      filteredLines.push('');
      continue;
    }

    // 앞머리에 닉네임과 불릿 또는 번호가 결합된 오염 방어
    trimmed = trimmed.replace(/^[^\s,，\n]+님[,，\s]*[*•\-]/, '*');
    trimmed = trimmed.replace(/^[^\s,，\n]+님[,，\s]*\d+[.)]\s*/, '');

    // 영문 번역/메타 괄호 제거 — 숫자 포함 (예: "(5 stars)", "(Generous portion)")
    trimmed = trimmed.replace(/\([a-zA-Z0-9\s/,\-'.*:!?~]{3,}\)/g, '').trim();

    // 인라인 영문 프롬프트 지침 잔여물 제거
    trimmed = trimmed.replace(/\d+\.\s*\*?[A-Za-z]+\*?\s*[:：].*$/g, '').trim();
    trimmed = trimmed.replace(/\bNo\s+nickname\.?\s*/gi, '').trim();
    trimmed = trimmed.replace(/\bUse\s+[""\u201C][^""\u201D]*[""\u201D](\s*(or|and)\s+[""\u201C][^""\u201D]*[""\u201D])*\.?\s*/gi, '').trim();
    trimmed = trimmed.replace(/^[*\s-]*(?:Yes|No)\s+/i, '').trim();

    // 마크다운 불릿/별표 접두사 제거 ("* 앞으로도..." → "앞으로도...")
    trimmed = trimmed.replace(/^\*\s+/, '').trim();

    if (!trimmed) continue;

    // AI 메타 라인 감지 시 즉시 스킵 (중요: '안녕'이나 '감사'가 섞여있어도 무조건 스킵!)
    if (/\b(Constraint|Greeting|Ending\s*style|Start\s*with|used\?|Checklist|Rule|Instruction|Verification)\b/i.test(trimmed)) {
      continue;
    }
    if (/\?\s*(?:Yes|No)\b/i.test(trimmed) || /^(?:Yes|No)\.\s*$/i.test(trimmed)) {
      continue;
    }

    // 프롬프트 에코 라인 제거
    if (/^\d+[.)]\s*(Start|Output|Rule|Write|Please|Customer|Response|Reply|Instruction|Translate|Greeting|Address|Ending)/i.test(trimmed)) {
      continue;
    }
    if (/\bStart immediately with\b/i.test(trimmed)) {
      continue;
    }

    // 영문 메타 라벨 제거
    if (metaLabelRegex.test(trimmed)) {
      continue;
    }

    // 별점 메타 라인 제거 (예: "5 stars, ...", "5/5", "5점")
    if (/^\d+\s*stars?\b/i.test(trimmed) || /^[\s*•\-]*(\d+\s*[\/／]\s*\d+|\d+\s*점|별점\s*[:：]?\s*\d+)\s*$/.test(trimmed)) {
      continue;
    }

    // 주문 메뉴명 단독 라인 제거 (Image 3처럼 메뉴명만 단독으로 쓴 라인 제거)
    if (orderedMenu && (trimmed === orderedMenu || trimmed === '주문메뉴' || trimmed.startsWith('주문메뉴:') || (trimmed.includes(orderedMenu) && trimmed.length <= orderedMenu.length + 10 && !trimmed.includes('안녕') && !trimmed.includes('감사') && !trimmed.includes('맛있') && !trimmed.includes('정성')))) {
      continue;
    }

    // 고객 리뷰 복붙 인용 단독 라인 제거
    if (/^["'“”][^"'“”]+["'“”][.]?$/.test(trimmed) && !trimmed.includes('안녕') && !trimmed.includes('감사')) {
      continue;
    }

    // 상호명 단독 라인 제거
    if (storeName && (trimmed === storeName || (trimmed.includes(storeName) && trimmed.length <= storeName.length + 15 && !trimmed.includes('안녕') && !trimmed.includes('감사')))) {
      continue;
    }

    // 손님 닉네임만 단독으로 적힌 라인 제거
    if (trimmed === customerName || trimmed === customerName.replace(/님$/, '') || (/^[^\s,，\n]+님\s*$/.test(trimmed) && trimmed.length <= 8 && !trimmed.includes('안녕') && !trimmed.includes('감사'))) {
      continue;
    }

    // 한글 프롬프트 라벨 형태 제거
    if (/^[\s*•\-]*(\d+\s*[\/／]\s*\d+|\d+\s*점|별점|가게\s*상호|손님\s*닉네임|주문\s*메뉴|손님\s*리뷰|답글|말투|상호명)\s*[:：]/i.test(trimmed)) {
      continue;
    }

    // 불릿으로 시작하면서 영문이 포함된 라인 제거
    const englishCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (/^[\s*•\-]/.test(trimmed) && englishCount >= 3) {
      continue;
    }

    // 순수 영문 메타 라인 제거
    if (!/[가-힣]/.test(trimmed) && englishCount >= 3) {
      continue;
    }

    // 영문 위주의 라인 제거 (영단어 3개 이상이고 한글 문장이 빈약한 경우)
    const words = trimmed.match(/[a-zA-Z]{2,}/g) || [];
    const nonNickWords = words.filter(w => !customerName || !customerName.toLowerCase().includes(w.toLowerCase()));
    if (nonNickWords.length >= 3) {
      continue;
    }

    filteredLines.push(trimmed);
  }

  cleanText = filteredLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  // 6-2. 단락 분리 및 진짜 답글(사장님 본문) 정밀 추출
  const rawParagraphs = cleanText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  let finalParagraphs = [];
  let foundGreeting = false;

  for (let p of rawParagraphs) {
    let tp = p.replace(/^["'“”`]+|["'“”`]+$/g, '').trim();
    if (!tp) continue;

    // 앞머리에 불필요한 라벨 제거
    tp = tp.replace(/^[A-Za-z0-9\s:：*•\-]+[:：]\s*/, '').trim();

    // 프롬프트 에코 잔여물 필터링
    if (/^(Start immediately|Please write|Option \d|Version \d|답글 \d|버전 \d|Constraint|Greeting|Ending)/i.test(tp)) {
      continue;
    }
    if (/^\d+[.)]\s*(Start|Output|Rule|Write|Please|Constraint)/i.test(tp)) {
      continue;
    }

    // 단락 내 잔여 영문 번역 괄호 제거
    tp = tp.replace(/\([a-zA-Z0-9\s/,\-'.*:!?~]{3,}\)/g, '').trim();

    // 앞머리에 손님 닉네임이 달려있다면 제거 (단 "고객님"은 유지)
    tp = tp.replace(/^(?!고객님)[가-힣a-zA-Z0-9*]{2,10}님[,，\s]*/, '');

    // 혹시 닉네임 제거 후 "Start with..." 같은 잔여물이 드러났다면 제거
    tp = tp.replace(/^\d+[.)]\s*(Start immediately with.*?[.!]?|Output.*?[.!]?)\s*/i, '').trim();
    tp = tp.replace(/^[*\s-]*(?:Yes|No)\s+/i, '').trim();
    if (!tp) continue;

    // 기존 단락과의 중복 비교
    const isDuplicate = finalParagraphs.some(existing => {
      const exStripped = existing.replace(/^["'“”`]+|["'“”`]+$/g, '').trim();
      return exStripped === tp || (tp.length >= 15 && exStripped.includes(tp.substring(0, 15)));
    });
    if (isDuplicate) continue;

    // 사장님의 인사 문장 여부 확인 (문단 맨 앞이 인사로 시작해야 함!)
    const isGreeting = /^(?:안녕하세요|고객님|반갑습니다|사장님)/.test(tp);

    // 중복 리뷰 차단 핵심 로직
    const accumulatedLength = finalParagraphs.join('\n\n').length;
    if (finalParagraphs.length > 0 && accumulatedLength >= 40 && isGreeting) {
      break;
    }

    if (isGreeting || foundGreeting) {
      foundGreeting = true;
      finalParagraphs.push(tp);
    } else {
      const hasKoreanSentences = /[가-힣]{5,}/.test(tp) && (tp.includes('맛있') || tp.includes('정성') || tp.includes('드셔') || tp.includes('찾아'));
      if (hasKoreanSentences) {
        finalParagraphs.push(tp);
      }
    }
  }

  if (finalParagraphs.length === 0) {
    finalParagraphs = rawParagraphs;
  }

  cleanText = finalParagraphs.join('\n\n').trim();

  // 6-3. 불필요한 닉네임 호칭 및 별점 호칭 최종 정제
  cleanText = cleanText.replace(/^(?!고객님)[가-힣a-zA-Z0-9*]{1,15}\s*님(?:[,\s]*고객님)?[,，\s]*/, '');
  cleanText = cleanText.replace(/^별점\s*\d+점님!?[,，\s]*/i, '');
  cleanText = cleanText.trim();

  // 6-4. 첫 문장이 첫인사 없이 시작하는 경우 "안녕하세요 고객님!"으로 자연스럽게 보정
  if (cleanText && !cleanText.startsWith('안녕하세요') && !cleanText.startsWith('고객님') && !cleanText.startsWith('반갑습니다') && !cleanText.startsWith('사장님')) {
    cleanText = '안녕하세요 고객님! ' + cleanText;
  }
  cleanText = cleanText.replace(/^안녕하세요!(?!\s*고객님)/, '안녕하세요 고객님!');
  // 중복된 "안녕하세요 고객님!" 정리
  cleanText = cleanText.replace(/^(?:안녕하세요\s*고객님[!\s.]*){2,}/, '안녕하세요 고객님! ');

  // 6-5. 물음표 끝맺음 감지 및 재주문 환영 확신형 마무리 멘트로 자동 치환 (질문형 종결 원천 차단)
  if (cleanText.endsWith('?') || /[가-힣]+[까|나|가]\?\s*$/.test(cleanText)) {
    cleanText = cleanText.replace(/[^.!?~^]*[가-힣\s]*(?:드셨을까요|맞으셨을까요|어떠셨을까요|좋으셨을까요|드셨나요|맞으셨나요|좋으셨나요|어떠셨나요|\?)\s*$/i, '').trim();
    if (!cleanText.endsWith('.') && !cleanText.endsWith('!') && !cleanText.endsWith('~')) {
      cleanText += '.';
    }
    cleanText += ' 앞으로도 변함없는 맛과 정성으로 보답하겠습니다. 늘 행복한 하루 보내시고, 다음번에도 꼭 재주문 부탁드리겠습니다! 감사합니다 😊';
  }

  // 6-5.5. 고객 리뷰 원문만 단독으로 앵무새처럼 복사한 경우만 안전 방어
  // (본문 내에서 고객 리뷰를 인용하며 칭찬 화답하는 문장은 절대 삭제하지 않음)
  if (hasReviewText && reviewText.length >= 10) {
    const strippedClean = cleanText.replace(/^(?:안녕하세요\s*고객님!?[,\s]*)+/, '').trim();
    if (strippedClean === reviewText || (strippedClean.length <= reviewText.length + 5 && strippedClean.includes(reviewText))) {
      cleanText = `안녕하세요 고객님! 소중한 정성 리뷰 남겨주셔서 진심으로 감사드립니다. 주문해주신 메뉴를 맛있게 드셨다니 사장으로서 큰 보람을 느낍니다. 앞으로도 변함없는 맛과 정성으로 보답하겠습니다. 늘 행복한 하루 보내시고, 다음번에도 꼭 재주문 부탁드리겠습니다! 감사합니다 😊`;
    }
  }

  // 6-5.6. 잔여 인라인 영문 메타 찌꺼기 최종 제거 (예: "(5 stars)", "*Greeting:*" 등)
  cleanText = cleanText.replace(/\(\d+\s*stars?\)/gi, '').trim();
  cleanText = cleanText.replace(/\*[A-Za-z]+\*\s*[:：]?/g, '').trim();
  cleanText = cleanText.replace(/\bNo\s+nickname\.?\s*/gi, '').trim();
  cleanText = cleanText.replace(/\d+\.\s*\*?[A-Za-z]+\*?\s*[:：][^.]*\./g, '').trim();
  cleanText = cleanText.replace(/\s{2,}/g, ' ').trim();

  // 6-6. 끝맺음에 감사/재주문/행복 기원 문장이 누락된 경우 따뜻하게 보강
  if (!cleanText.includes('감사') && !cleanText.includes('재주문') && !cleanText.includes('찾아')) {
    cleanText += ' 앞으로도 정성을 다해 맛있는 음식으로 보답하겠습니다. 다음번에도 꼭 재주문 부탁드리겠습니다! 감사합니다 😊';
  }

  // 7-1. 이모티콘 미사용 모드일 경우 잔여 이모지 완전 제거
  if (emojiLevel === 'NONE') {
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').replace(/\^\^/g, '').trim();
  }

  // 7-2. 글자 수 엄격 상한선 제한 (Coupang Eats 300자 등 플랫폼 제약 준수)
  if (cleanText.length > charLimit) {
    const trimmed = cleanText.substring(0, charLimit);
    const lastPunctuation = Math.max(
      trimmed.lastIndexOf('.'),
      trimmed.lastIndexOf('!'),
      trimmed.lastIndexOf('~'),
      trimmed.lastIndexOf('^')
    );
    if (lastPunctuation > charLimit * 0.7) {
      cleanText = trimmed.substring(0, lastPunctuation + 1).trim();
    } else {
      cleanText = trimmed.trim();
    }
  }

  // 7-3. 문장 미완성(글 쓰다 만 것) 방어:
  // 마지막 문장이 마침표, 느낌표, 물음표, 물결, 이모지 등으로 종결되지 않고
  // 중간에 끊겨 있는 경우, 마지막으로 완성된 종결 부호(또는 이모지) 위치까지만 남기고 찌꺼기 삭제
  const endingRegex = /[.!?~^🥰💖😊👍❤️✨🎉🙏💐😄]/gu;
  let lastValidEndIndex = -1;
  let endMatch;
  while ((endMatch = endingRegex.exec(cleanText)) !== null) {
    lastValidEndIndex = endMatch.index + endMatch[0].length;
  }

  if (lastValidEndIndex > cleanText.length * 0.5 && lastValidEndIndex < cleanText.length) {
    const trailingSnippet = cleanText.substring(lastValidEndIndex).trim();
    if (trailingSnippet.length > 0 && !/[.!?~^]/.test(trailingSnippet)) {
      cleanText = cleanText.substring(0, lastValidEndIndex).trim();
    }
  }

  // 앞뒤 불필요한 따옴표, 별표 및 공백 제거
  cleanText = cleanText.replace(/^[\s*"'`]+|[\s*"'`]+$/g, '').trim();
  return cleanText;
}

// 서비스 워커 부팅 시 캐시된 정상 동작 모델 URL 복원 (초고속 1초 응답 보장)
let cachedWorkingModelUrl = null;
chrome.storage.local.get(['cachedWorkingModelUrl'], (res) => {
  if (res.cachedWorkingModelUrl) {
    cachedWorkingModelUrl = res.cachedWorkingModelUrl;
  }
});

/**
 * 구글 Gemini API 호출기 (초고속 캐싱 & 다중 엔드포인트 자동 탐색)
 */
async function callGeminiApi(apiKey, prompt) {
  const cleanKey = apiKey.trim();
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 600,
    }
  });

  const requestHeaders = { 'Content-Type': 'application/json' };

  // 타임아웃 헬퍼 (지연 무한 대기 방지: 5초)
  async function fetchWithTimeout(url, options, timeoutMs = 5000) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timerId);
      return response;
    } catch (e) {
      clearTimeout(timerId);
      throw e;
    }
  }

  // 0. 캐시된 검증 모델이 있으면 1순위로 즉시 호출 (0.8초~1.5초 내 초고속 완료!)
  if (cachedWorkingModelUrl) {
    const directUrl = cachedWorkingModelUrl.replace(/key=[^&]+/, `key=${cleanKey}`);
    try {
      const res = await fetchWithTimeout(directUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
      }, 5000);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (e) {
      cachedWorkingModelUrl = null;
    }
  }

  // 1차 시도 후보군 (현재 구글 AI 스튜디오 표준인 v1beta 모델 최우선 배치)
  const candidateUrls = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${cleanKey}`
  ];

  let lastError = null;

  for (const url of candidateUrls) {
    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
      }, 4500);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          cachedWorkingModelUrl = url;
          chrome.storage.local.set({ cachedWorkingModelUrl: url });
          return text;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${res.status}`;
        if (res.status === 404 || (lastError && lastError.includes('not found'))) {
          continue;
        }
        if (res.status === 400 && lastError && (lastError.includes('API_KEY_INVALID') || lastError.includes('key not valid'))) {
          throw new Error(`구글 Gemini API 키가 유효하지 않습니다. 확인 후 다시 입력해 주세요.`);
        }
      }
    } catch (e) {
      if (e.message.includes('API 키가 유효하지 않습니다')) throw e;
      lastError = e.message;
    }
  }

  // 2차 시도: 사용자의 API 키로 접근 가능한 모델 목록(ListModels)을 동적 조회하여 실행
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`)
      .then(r => r.ok ? r : fetch(`https://generativelanguage.googleapis.com/v1/models?key=${cleanKey}`));

    if (listRes.ok) {
      const listData = await listRes.json();
      const availableModels = (listData.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent') && !m.name.includes('gemini-pro') && !m.name.includes('gemini-1.0'))
        .map(m => m.name);

      for (const modelName of availableModels) {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${cleanKey}`;
        const res = await fetchWithTimeout(directUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        }, 5000).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            cachedWorkingModelUrl = directUrl;
            chrome.storage.local.set({ cachedWorkingModelUrl: directUrl });
            return text;
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  throw new Error(`Gemini 답변 생성 실패: ${lastError || '사용 가능한 모델을 찾을 수 없습니다.'}`);
}
