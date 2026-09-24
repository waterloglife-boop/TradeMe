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
  const hasReviewText = reviewText.length > 0;
  const isNaver = payload.platform === 'NAVER' || reviewData.platform === 'NAVER';
  const isTakeout = Boolean(reviewData.isTakeout);
  const visitCount = Number(reviewData.visitCount) || 0;
  const orderedMenu = reviewData.menu || (isNaver ? (isTakeout ? '포장 주문' : '매장 방문') : '주문하신 메뉴');
  const customerName = (reviewData.customerName && !isNaver) ? `${reviewData.customerName}님` : '고객님';
  const charLimit = Number(payload.charLimit) || 300;
  const emojiLevel = payload.emojiLevel || 'MEDIUM';

  // 이모티콘 사용 강도 지침
  const emojiGuideMap = {
    NONE: '이모티콘(이모지, 하트 등)은 일절 쓰지 말고 100% 텍스트로만 깔끔하고 정중하게 작성해.',
    LOW: '이모티콘은 전체 답글을 통틀어 딱 1~2개만 은은하게 포인트로만 사용해.',
    MEDIUM: '이모티콘은 2~3개 내외로 문맥에 맞게 자연스럽게 사용해.',
    HIGH: '하트와 이모티콘(🥰, 💖, ^^ 등)을 다정하고 풍성하게 듬뿍 사용해.'
  };
  const selectedEmojiGuide = emojiGuideMap[emojiLevel] || emojiGuideMap.MEDIUM;

  // 4. 프롬프트 구성 (네이버 스마트플레이스 vs 배달 3사)
  let prompt = '';

  if (isNaver) {
    // A. 네이버 스마트플레이스 맞춤형 프롬프트
    let serviceTypeGuide = '';
    if (isTakeout) {
      serviceTypeGuide = `- 이용 방식: [포장 주문] 고객님께서 매장에 직접 들러 포장(테이크아웃)해 가셨습니다. 포장해 가신 음식을 집에서도 식지 않고 맛있고 편안하게 드셨기를 바란다는 정성 어린 포장 감사 인사를 꼭 자연스럽게 담아주세요.`;
    } else {
      serviceTypeGuide = `- 이용 방식: [매장 식사 / 방문] 매장에 직접 방문해 주신 고객님입니다. 매장에서 편안하고 기분 좋은 식사 시간이 되셨기를 바란다는 인사를 담아주세요.`;
    }

    let visitCountGuide = '';
    if (visitCount === 1) {
      visitCountGuide = `- 방문 횟수: [1번째 방문 (첫 방문/소중한 첫 인연)] 저희 매장을 처음 찾아주신 귀한 첫 손님입니다! 첫 방문 첫 인연에 진심으로 감사드리며, 첫인상이 기분 좋고 맛있으셨기를 바란다는 반가운 첫인사를 전하세요.`;
    } else if (visitCount >= 2) {
      visitCountGuide = `- 방문 횟수: [${visitCount}번째 방문 (단골 고객님)] 잊지 않고 벌써 ${visitCount}번째나 저희 매장을 다시 찾아주신 찐 단골 고객님입니다! 변함없이 꾸준히 사랑해 주시고 재방문해 주심에 깊은 감사와 감동의 인사를 특별히 전해 주세요.`;
    }

    let reviewSituationGuide = '';
    if (!hasReviewText) {
      if (starScore >= 4) {
        reviewSituationGuide = `[상황: 네이버 스마트플레이스 별점 ${starScore}점 (영수증/포장 인증, 글 내용 없이 별점만 등록해주신 손님)]
- 손님께서 리뷰 글은 따로 적지 않으셨지만, 소중한 별점(${starScore}점)과 방문 인증을 잊지 않고 등록해 주셨습니다.
- 바쁘신 일상 속에서도 잊지 않고 별점 평가를 남겨주셔서 진심으로 감사하다는 인사를 전해주세요.
- 주문해주신 메뉴(${orderedMenu})를 맛있게 즐기셨기를 바라며, 다음에도 변함없이 정성을 다하겠다는 다정한 감사 답글을 작성하세요.`;
      } else {
        reviewSituationGuide = `[상황: 네이버 스마트플레이스 별점 ${starScore}점 (방문 후 사유 없이 낮은 별점만 남겨진 안타까운 상황)]
- 손님께서 매장 이용 후 아쉬운 별점(${starScore}점)만 남기신 안타까운 상황입니다.
- 만족스러운 경험을 드리지 못해 마음이 무겁고 유감스럽다는 솔직하고 정중한 사과를 전하세요.
- "혹시 매장 이용이나 음식, 서비스에 어떤 문제가 있으셨나요? 아무런 말씀 없이 아쉬운 별점을 받게 되어 사장으로서 너무나 안타깝고 염려스럽습니다"라는 솔직한 심정을 전하세요.
- 음식 맛, 친절도, 청결, 포장 등 불편하셨던 점이 있으셨다면 매장으로 편하게 알려주시면 귀담아듣고 즉시 확인하여 철저히 개선하겠다는 진심 어린 사과와 확인 요청을 작성하세요.`;
      }
    } else {
      if (starScore >= 4) {
        reviewSituationGuide = `[상황: 네이버 스마트플레이스 방문 만족 칭찬 리뷰 (별점 ${starScore}점)]
- 손님 방문자 리뷰 내용: "${reviewText}"
- 손님이 직접 남겨주신 리뷰 내용(메뉴의 맛, 맵기, 아이와의 식사, 칭찬 포인트 등)에 대해 깊이 공감하고 감사와 기쁨을 표하세요.
- 다음 방문 때도 한결같이 정성을 다해 모시겠다는 환영 인사를 건네세요.`;
      } else {
        reviewSituationGuide = `[상황: 네이버 스마트플레이스 불만/클레임 리뷰 (별점 ${starScore}점)]
- 손님 방문자 리뷰 내용: "${reviewText}"
- 핑계를 대지 않고 손님이 지적하신 구체적인 불편 사항에 대해 정중히 사과하고, 재발 방지와 즉각적인 개선 조치를 약속하세요.`;
      }
    }

    prompt = `당신은 네이버 스마트플레이스에서 매장을 운영하는 친절한 사장님입니다.
손님이 매장을 직접 이용하신 후 남겨주신 소중한 방문자 리뷰를 읽고, 사장님이 손님에게 직접 보내는 따뜻한 답글을 작성하세요.

[이용 정보]
${serviceTypeGuide}
${visitCountGuide ? visitCountGuide + '\n' : ''}- 주문 메뉴 / 방문 키워드: ${orderedMenu}
${reviewSituationGuide}

[답글 작성 규칙]
1. "안녕하세요 고객님!"으로 시작하세요. 특정 닉네임이나 별점 호칭을 앞에 붙이지 마세요.
2. 손님이 작성한 리뷰 내용을 구체적으로 짚어서 공감하고 감사를 전하세요.
3. 직접 찾아와 주신 정성에 감사드리고 다음에도 정성을 다하겠다는 인사로 마무리하세요.
4. 마지막 문장을 물음표(?)로 끝내지 마세요.
5. 별점 점수 숫자를 직접 언급하지 마세요.
6. 답글은 딱 1개만 작성하세요.
- 사장님 말투: ${selectedPersonaGuide}
${contextNotes.length > 0 ? '- 상황 반영: ' + contextNotes.join(', ') : ''}
- 이모티콘: ${selectedEmojiGuide}
- 분량: 공백 포함 최대 ${charLimit}자 이내

아래에 오직 한국어 답글 본문만 바로 작성하세요.`;
  } else {
    // B. 배달 3사 (배민 / 쿠팡이츠 / 요기요) 프롬프트
    let reviewSituationGuide = '';
    if (!hasReviewText) {
      if (starScore >= 4) {
        reviewSituationGuide = `[상황: 별점 ${starScore}점 (리뷰 글 없이 별점 평가만 남겨주신 손님)]
- 손님께서 바쁜 일상 속에서도 잊지 않고 소중한 별점을 남겨주셨습니다.
- 바쁘신 와중에도 별점으로 따뜻한 응원을 보내주셔서 진심으로 감사하다는 마음을 전하세요.
- 주문해주신 메뉴(${orderedMenu})를 맛있고 편안하게 즐기셨기를 바라며, 보내주신 별점에 큰 힘을 얻었다는 화답을 전하세요.
- [끝맺음 주의]: 절대로 질문(예: "맛있게 드셨을까요?", "입맛에 맞으셨나요?")으로 묻지 마세요! "앞으로도 변함없이 푸짐하고 맛있는 음식으로 보답하겠습니다. 늘 행복한 하루 보내시고, 다음번에도 꼭 재주문 부탁드리겠습니다! 감사합니다 😊"처럼 재주문 환영과 감사로 확실하게 마무리하세요.`;
      } else {
        reviewSituationGuide = `[상황: 별점 ${starScore}점 (글 내용 없이 낮은 별점만 남겨진 안타까운 상황)]
- 손님께서 리뷰 글(이유/불만 내용) 없이 낮은 별점(${starScore}점)만 남기신 안타까운 상황입니다.
- 만족스러운 식사를 드리지 못해 마음이 무겁고 유감스럽다는 솔직하고 정중한 사과를 전하세요.
- "혹시 식사나 배달에 어떤 문제가 있으셨나요? 아무런 말씀 없이 아쉬운 별점을 받게 되어 사장으로서 너무나 안타깝고 염려스럽습니다"라는 솔직한 심정을 전하세요.
- 음식의 맛, 간, 양, 포장, 혹은 배달 과정에서 불편하셨던 점이 있으셨다면 매장으로 편하게 연락 주시면 귀담아듣고 즉시 확인하여 철저히 개선하겠다는 진심 어린 확인 요청 및 재발 방지 멘트를 작성하세요.`;
      }
    } else {
      if (starScore >= 4) {
        reviewSituationGuide = `[상황: 별점 ${starScore}점 손님 칭찬/만족 리뷰]
- 손님께서 직접 남겨주신 리뷰 내용: "${reviewText}"
- 주문하신 메뉴: "${orderedMenu}"
- [핵심 작성 지침]:
  1. 손님이 남겨주신 리뷰 내용의 구체적인 포인트(예: 맛, 맵기 조절, 양, 서비스 음료/반찬, 식사 상황 등)를 빠짐없이 직접 언급하며 진심으로 감사와 기쁨을 표하세요.
  2. 상투적이거나 뻔한 1~2줄 답변을 절대 쓰지 마세요. 사장님이 손님의 리뷰를 꼼꼼히 정독하고 쓴 정성 어린 답글이어야 합니다.
  3. [끝맺음 주의]: 절대로 물음표("~하셨을까요?", "~하셨나요?", "~어떠셨나요?")로 끝내지 마세요! "앞으로도 변함없이 푸짐하고 맛있는 음식으로 보답하겠습니다. 늘 건강하고 행복한 하루 보내시고, 다음번에도 꼭 다시 찾아주세요! 감사합니다 😊"처럼 재주문 환영과 감사로 확실하고 따뜻하게 맺으세요.`;
      } else {
        reviewSituationGuide = `[상황: 별점 ${starScore}점 불만/클레임 리뷰]
- 손님 리뷰 내용: "${reviewText}"
- 핑계를 대지 않고 손님이 지적하신 구체적인 불편 사항에 대해 정중히 사과하고, 재발 방지와 즉각적인 개선 조치를 약속하세요.`;
      }
    }

    prompt = `당신은 배달앱(배달의민족, 쿠팡이츠, 요기요)에서 매장을 운영하는 친절하고 음식에 진심인 사장님입니다.
손님이 남겨주신 소중한 리뷰를 정독하고, 사장님이 손님에게 직접 보내는 따뜻한 답글을 작성하세요.

[손님 리뷰 정보]
- 매장 상호명: ${storeName || '저희 매장'}
- 주문 메뉴: ${orderedMenu}
- 손님 작성 리뷰: ${reviewText ? '"' + reviewText + '"' : '(별점만 등록, 글 없음)'}
${reviewSituationGuide}

[답글 작성 규칙]
1. "안녕하세요 고객님!"으로 시작하세요. 손님 닉네임은 이미 화면에 표시되므로 본문에 다시 적지 마세요.
2. 손님이 작성한 리뷰 내용(맵기, 맛, 서비스, 메뉴 등)을 구체적으로 짚어서 공감하고 감사를 전하세요.
3. "앞으로도 변함없이 정성을 다하겠습니다. 다음번에도 꼭 재주문 부탁드리겠습니다! 감사합니다"와 같이 재주문 환영과 감사로 확실하게 마무리하세요.
4. 마지막 문장을 물음표(?)로 끝내지 마세요. 반드시 마침표(.) 또는 느낌표(!)로 끝내세요.
5. 별점 점수 숫자를 직접 언급하지 마세요.
6. 답글은 딱 1개만 작성하세요.
- 사장님 말투: ${selectedPersonaGuide}
${contextNotes.length > 0 ? '- 추가 전달사항: ' + contextNotes.join(', ') : ''}
- 이모티콘: ${selectedEmojiGuide}
- 분량: 공백 포함 약 180~250자 (최대 ${charLimit}자)

아래에 오직 한국어 답글 본문만 바로 작성하세요.`;
  }

  // 5. Google Gemini API 호출 (다중 모델 폴백 및 자동 탐색)
  const rawText = await callGeminiApi(apiKey, prompt);

  // 6. 응답 정제: 메타데이터 에코 라인, 영문 번역 찌꺼기 전면 제거 및 진짜 답글 추출
  let cleanText = rawText.trim();
  cleanText = cleanText.replace(/^["'“”`]+|["'“”`]+$/g, '').trim();

  // 6-1. 라인별 메타데이터 / 영문 번역 라인 필터링
  const lines = cleanText.split('\n');
  const filteredLines = [];

  const metaLabelRegex = /^[\s*•\-]*\b(Customer|Client|User|Ordered\s*Menu|Menu|Review\s*Content|Review|Rating|Score|Address(\s*the\s*customer)?|Tone|Persona|Analysis|Note|Notes|Translation|Context|Situation|Response|Reply|Task)\b\s*[:：]/i;

  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) {
      filteredLines.push('');
      continue;
    }

    // 앞머리에 닉네임과 불릿 또는 번호가 결합된 오염 방어 (예: "yeseo486님, * Customer: ...", "문*성님, 2. Start...")
    trimmed = trimmed.replace(/^[^\s,，\n]+님[,，\s]*[*•\-]/, '*');
    trimmed = trimmed.replace(/^[^\s,，\n]+님[,，\s]*\d+[.)]\s*/, '');

    // (A) 영문 번역/메타 괄호 제거 — 숫자 포함 (예: "(5 stars)", "(Generous portion)", "(Oishii-ye)")
    trimmed = trimmed.replace(/\([a-zA-Z0-9\s/,\-'.*:!?~]{3,}\)/g, '').trim();

    // (A-2) 인라인 영문 프롬프트 지침 잔여물 제거 (예: "4. *Greeting:* No nickname. Use '안녕하세요 고객님!'")
    trimmed = trimmed.replace(/\d+\.\s*\*?[A-Za-z]+\*?\s*[:：].*$/g, '').trim();
    trimmed = trimmed.replace(/\bNo\s+nickname\.?\s*/gi, '').trim();
    trimmed = trimmed.replace(/\bUse\s+[""\u201C][^""\u201D]*[""\u201D](\s*(or|and)\s+[""\u201C][^""\u201D]*[""\u201D])*\.?\s*/gi, '').trim();

    // (A-3) 마크다운 불릿/별표 접두사 제거 ("* 앞으로도..." → "앞으로도...")
    trimmed = trimmed.replace(/^\*\s+/, '').trim();

    // 정제 후 빈 줄이면 스킵
    if (!trimmed) continue;

    // (B) 프롬프트 에코 라인 제거 (예: "2. Start immediately with...", "Output:", "Rule 1:", "Instruction:")
    if (/^\d+[.)]\s*(Start|Output|Rule|Write|Please|Customer|Response|Reply|Instruction|Translate|Greeting|Address)/i.test(trimmed)) {
      continue;
    }
    if (/\bStart immediately with\b/i.test(trimmed)) {
      continue;
    }

    // (C) 영문 메타 라벨 제거
    if (metaLabelRegex.test(trimmed)) {
      continue;
    }

    // (D) 영문 위주의 번역/지침 라인 제거 또는 한글만 추출
    const words = trimmed.match(/[a-zA-Z]{2,}/g) || [];
    const nonNickWords = words.filter(w => !customerName || !customerName.toLowerCase().includes(w.toLowerCase()));
    if (nonNickWords.length >= 4) {
      // 영단어가 4개 이상이면 지침 찌꺼기 → 한글 부분만 추출 시도
      const koreanOnly = trimmed.replace(/[a-zA-Z*"'`:;.,?!(){}\[\]]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (koreanOnly.length >= 10 && /[가-힣]{5,}/.test(koreanOnly)) {
        trimmed = koreanOnly;
      } else {
        continue;
      }
    } else if (nonNickWords.length >= 2 && !trimmed.includes('안녕') && !trimmed.includes('감사')) {
      continue;
    }

    // (E) 별점 메타 라인 제거 (예: "5 stars, ...", "5/5", "5점")
    if (/^\d+\s*stars?\b/i.test(trimmed) || /^[\s*•\-]*(\d+\s*[\/／]\s*\d+|\d+\s*점|별점\s*[:：]?\s*\d+)\s*$/.test(trimmed)) {
      continue;
    }

    // (F) 고객 리뷰 복붙 인용 단독 라인 제거 (예: '"양도 많고 맛도 있어요~"')
    if (/^["'“”][^"'“”]+["'“”][.]?$/.test(trimmed) && !trimmed.includes('안녕') && !trimmed.includes('감사')) {
      continue;
    }

    // (G) 상호명 단독 라인 제거
    if (storeName && (trimmed === storeName || (trimmed.includes(storeName) && trimmed.length <= storeName.length + 15 && !trimmed.includes('안녕') && !trimmed.includes('감사')))) {
      continue;
    }

    // (H) 손님 닉네임만 단독으로 적힌 라인 제거
    if (trimmed === customerName || trimmed === customerName.replace(/님$/, '') || (/^[^\s,，\n]+님\s*$/.test(trimmed) && trimmed.length <= 8 && !trimmed.includes('안녕') && !trimmed.includes('감사'))) {
      continue;
    }

    // (I) 한글 프롬프트 라벨 형태 제거
    if (/^[\s*•\-]*(\d+\s*[\/／]\s*\d+|\d+\s*점|별점|가게\s*상호|손님\s*닉네임|주문\s*메뉴|손님\s*리뷰|답글|말투|상호명)\s*[:：]/i.test(trimmed)) {
      continue;
    }

    // (J) 불릿으로 시작하면서 영문이 포함된 라인 제거
    const englishCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (/^[\s*•\-]/.test(trimmed) && englishCount >= 3) {
      continue;
    }

    // (K) 순수 영문 메타 라인 제거
    if (!/[가-힣]/.test(trimmed) && englishCount >= 4) {
      continue;
    }

    filteredLines.push(trimmed);
  }

  cleanText = filteredLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  // 6-2. 단락 분리 및 진짜 답글(사장님 본문) 정밀 추출 (앞쪽 찌꺼기 단락 스킵 및 중복 버전 2 차단)
  const rawParagraphs = cleanText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  let finalParagraphs = [];
  let foundGreeting = false;

  for (let p of rawParagraphs) {
    let tp = p.replace(/^["'“”`]+|["'“”`]+$/g, '').trim();
    if (!tp) continue;

    // 프롬프트 에코 잔여물 필터링
    if (/^(Start immediately|Please write|Option \d|Version \d|답글 \d|버전 \d)/i.test(tp)) {
      continue;
    }
    if (/^\d+[.)]\s*(Start|Output|Rule|Write|Please)/i.test(tp)) {
      continue;
    }

    // 단락 내 잔여 영문 번역 괄호 제거
    tp = tp.replace(/\([a-zA-Z\s/,\-']{3,}\)/g, '').trim();

    // 앞머리에 손님 닉네임이 달려있다면 제거 (예: "문*성님, 안녕하세요!" -> "안녕하세요!", "in꽃님, " -> "")
    // 단, "고객님"은 사장님의 정중한 일반 호칭이므로 유지
    tp = tp.replace(/^(?!고객님)[가-힣a-zA-Z0-9*]{2,10}님[,，\s]*/, '');

    // 혹시 닉네임 제거 후 "2. Start immediately with..." 같은 잔여물이 드러났다면 제거
    tp = tp.replace(/^\d+[.)]\s*(Start immediately with.*?[.!]?|Output.*?[.!]?)\s*/i, '').trim();
    if (!tp) continue;

    // 기존 단락과의 중복 비교
    const isDuplicate = finalParagraphs.some(existing => {
      const exStripped = existing.replace(/^["'“”`]+|["'“”`]+$/g, '').trim();
      return exStripped === tp || (tp.length >= 15 && exStripped.includes(tp.substring(0, 15)));
    });
    if (isDuplicate) continue;

    // 사장님의 인사 문장 여부 확인
    const isGreeting = /^(고객님|[^\s,，\n]+님|어머나|안녕하세요|반갑습니다|사장님)/.test(tp) || tp.startsWith('안녕하세요') || tp.includes('안녕하세요');

    // 🎯 [중복 리뷰 차단 핵심 로직]:
    // 이미 앞선 단락들이 존재하고, 앞선 단락의 총 길이가 일정 이상(40자 이상)이며,
    // 현재 단락이 또 다시 "안녕하세요", "고객님", "반갑습니다" 같은 새로운 첫인사로 시작한다면
    // 이는 AI가 2번째 옵션/버전의 답글을 연달아 작성한 것이므로 여기서 즉시 중단(break)!
    const accumulatedLength = finalParagraphs.join('\n\n').length;
    if (finalParagraphs.length > 0 && accumulatedLength >= 40 && isGreeting) {
      break;
    }

    if (isGreeting || foundGreeting) {
      foundGreeting = true;
      finalParagraphs.push(tp);
    } else {
      // 인사가 나오기 전 단락인데, 실제 한글 감사/칭찬 화답 문장인 경우만 포함
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
  cleanText = cleanText.replace(/^(?!고객님)[가-힣a-zA-Z0-9*]{2,10}님[,，\s]*/, '');
  cleanText = cleanText.replace(/^별점\s*\d+점님!?[,，\s]*/i, '');
  cleanText = cleanText.trim();

  // 6-4. 첫 문장이 첫인사 없이 시작하는 경우 "안녕하세요 고객님!"으로 자연스럽게 보정
  if (cleanText && !cleanText.startsWith('안녕하세요') && !cleanText.startsWith('고객님') && !cleanText.startsWith('반갑습니다') && !cleanText.startsWith('사장님')) {
    cleanText = '안녕하세요 고객님! ' + cleanText;
  }

  // 6-5. 물음표 끝맺음 감지 및 재주문 환영 확신형 마무리 멘트로 자동 치환 (질문형 종결 원천 차단)
  if (cleanText.endsWith('?') || /[가-힣]+[까|나|가]\?\s*$/.test(cleanText)) {
    cleanText = cleanText.replace(/[^.!?~^]*[가-힣\s]*(?:드셨을까요|맞으셨을까요|어떠셨을까요|좋으셨을까요|드셨나요|맞으셨나요|좋으셨나요|어떠셨나요|\?)\s*$/i, '').trim();
    if (!cleanText.endsWith('.') && !cleanText.endsWith('!') && !cleanText.endsWith('~')) {
      cleanText += '.';
    }
    cleanText += ' 앞으로도 변함없는 맛과 정성으로 보답하겠습니다. 늘 행복한 하루 보내시고, 다음번에도 꼭 재주문 부탁드리겠습니다! 감사합니다 😊';
  }

  // 6-5.5. 고객 리뷰 원문 에코(그대로 복사) 감지 및 제거
  // AI가 고객의 리뷰를 답글에 그대로 인용/복사한 경우 제거
  if (hasReviewText && reviewText.length >= 10) {
    const reviewSnippet = reviewText.substring(0, Math.min(30, reviewText.length));
    if (cleanText.includes(reviewSnippet)) {
      cleanText = cleanText.replace(reviewText, '').trim();
      cleanText = cleanText.replace(/^[,.\s!?"']+/, '').trim();
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

/**
 * 구글 Gemini API 호출기
 * 계정/리전별 모델 지원 차이를 극복하기 위해 다중 엔드포인트 폴백 및 ListModels 자동 탐색을 수행합니다.
 */
async function callGeminiApi(apiKey, prompt) {
  const cleanKey = apiKey.trim();
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600,
    }
  });

  const requestHeaders = { 'Content-Type': 'application/json' };

  // 1차 시도 후보군 (안정적인 v1 및 최신 v1beta 엔드포인트)
  const candidateUrls = [
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${cleanKey}`
  ];

  let lastError = null;

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${res.status}`;
        // 404/Not Found는 다음 모델로 즉시 전환
        if (res.status === 404 || (lastError && lastError.includes('not found'))) {
          continue;
        }
        // 잘못된 API 키나 권한 문제는 즉시 사용자에게 고지
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
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${cleanKey}`)
      .then(r => r.ok ? r : fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`));

    if (listRes.ok) {
      const listData = await listRes.json();
      const availableModels = (listData.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name);

      for (const modelName of availableModels) {
        // 이미 'models/gemini-...' 형식
        const directUrl = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${cleanKey}`;
        const res = await fetch(directUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        }).then(r => r.ok ? r : fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${cleanKey}`, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        }));

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) return text;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  throw new Error(`Gemini 답변 생성 실패: ${lastError || '사용 가능한 모델을 찾을 수 없습니다.'}`);
}
