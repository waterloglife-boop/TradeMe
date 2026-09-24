// 🤖 트레이드미 배민·쿠팡이츠·요기요 AI 리뷰 비서 - Content Script
// 배민(ceo.baemin.com), 쿠팡이츠(store.coupangeats.com), 요기요(owner.yogiyo.co.kr, ceo.yogiyo.co.kr)
// 3대 배달앱 리뷰 관리 페이지의 DOM을 감지하여 각 답글 입력창 바로 위에 [🤖 AI 맞춤 답글 자동입력] 버튼을 삽입합니다.

(function () {
  'use strict';

  console.log('[TradeMe Review AI] Content script active on:', window.location.hostname);

  // 설정값 캐시
  let settings = {
    tradeMeAuth: null,
    apiKey: '',
    storeName: '',
    persona: 'CHEF',
    charLimit: 300,
    emojiLevel: 'MEDIUM',
    autoSubmit: false,
    contexts: {
      weather: false,
      weatherText: '환절기 감기 조심하세요',
      newMenu: false,
      newMenuText: '',
      monthlyReorder: false,
      monthlyReorderText: '이번 달에도 언제든 생각나실 때 찾아주세요, 첫 주문처럼 정성껏 모시겠습니다!',
      delayApology: false,
      reviewEvent: false
    }
  };

  // 저장된 설정 로드
  function loadSettings() {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['tradeMeAuth', 'apiKey', 'storeName', 'persona', 'charLimit', 'emojiLevel', 'autoSubmit', 'contexts'], (res) => {
        if (res) {
          settings = { ...settings, ...res };
        }
      });
    }
  }
  loadSettings();

  // 스토리지 변경 실시간 반영
  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      for (const key in changes) {
        settings[key] = changes[key].newValue;
      }
    });
  }

  // 라이브 DOM 기반 별점 정밀 감지 (1~5점 정확 판별)
  function extractRatingFromLiveContainer(container, cleanFullText) {
    if (!container) return 5;

    // 1. 텍스트 내 직접 표기 검사 (예: "4점", "5점", "별점 4", "별점: 4")
    const starScoreMatch = (cleanFullText || '').match(/(?:별점|평점)\s*[:：]?\s*([1-5])(?:\.0)?/i) ||
                           (cleanFullText || '').match(/([1-5])(?:\.0)?\s*점\b/);
    if (starScoreMatch) {
      const s = parseInt(starScoreMatch[1], 10);
      if (s >= 1 && s <= 5) return s;
    }

    // 2. ★ 유니코드 문자열 카운트 (예: "★★★★☆" = 4점, "★★★★" = 4점)
    const filledStars = (cleanFullText || '').match(/★+/);
    if (filledStars && filledStars[0].length >= 1 && filledStars[0].length <= 5) {
      return filledStars[0].length;
    }

    // 3. live container 내부의 aria-label, title, data-rating 등 속성 정밀 검사
    const ratingAttrs = container.querySelectorAll(
      '[aria-label*="점"], [aria-label*="star" i], [title*="점"], [title*="star" i], [data-rating], [data-score], [data-value]'
    );
    for (const el of ratingAttrs) {
      const str = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('data-rating') || el.getAttribute('data-score') || el.getAttribute('data-value') || '';
      const m = str.match(/([1-5])(?:\.0)?/);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val >= 1 && val <= 5) return val;
      }
    }

    // 4. 별점 게이지 너비 (width: 80% = 4점, width: 100% = 5점, width: 60% = 3점)
    const widthElements = container.querySelectorAll('[style*="width"]');
    for (const el of widthElements) {
      const styleWidth = el.style.width || '';
      const widthMatch = styleWidth.match(/(\d+)%/);
      if (widthMatch) {
        const percent = parseInt(widthMatch[1], 10);
        if (percent >= 10 && percent <= 100) {
          const starCalc = Math.round(percent / 20);
          if (starCalc >= 1 && starCalc <= 5) return starCalc;
        }
      }
    }

    // 5. live SVG 별 아이콘 검사 (배민/쿠팡이츠 등 5개 SVG 중 채워진 별 vs 빈 별)
    try {
      const svgs = Array.from(container.querySelectorAll('svg'));
      const starSvgs = svgs.filter(svg => {
        const cls = (svg.getAttribute('class') || '') + ' ' + (svg.parentElement ? (svg.parentElement.getAttribute('class') || '') : '');
        const aria = (svg.getAttribute('aria-label') || '') + ' ' + (svg.getAttribute('name') || '');
        return /star|별|rating|score/i.test(cls) || /star|별/i.test(aria) || (svg.querySelector('path[d*="M"]') && svg.parentElement && /star|rating|review/i.test(svg.parentElement.className));
      });

      if (starSvgs.length >= 1 && starSvgs.length <= 5) {
        let filledCount = 0;
        for (const svg of starSvgs) {
          const fillAttr = (svg.getAttribute('fill') || '').toLowerCase();
          const cls = (svg.getAttribute('class') || '').toLowerCase();
          const parentCls = (svg.parentElement ? svg.parentElement.getAttribute('class') || '' : '').toLowerCase();
          const compColor = (window.getComputedStyle(svg).fill || window.getComputedStyle(svg).color || '').toLowerCase();

          const isFilledClass = /fill|active|on|selected|yellow|gold/.test(cls) || /fill|active|on|selected|yellow|gold/.test(parentCls);
          const isGrayClass = /empty|inactive|off|gray|disabled|blank/.test(cls) || /empty|inactive|off|gray|disabled|blank/.test(parentCls);

          if (isGrayClass) continue;
          if (isFilledClass) {
            filledCount++;
            continue;
          }

          if (fillAttr && fillAttr !== 'none' && !fillAttr.includes('e0e0e0') && !fillAttr.includes('ddd') && !fillAttr.includes('ccc') && !fillAttr.includes('transparent')) {
            filledCount++;
          } else if (compColor && !compColor.includes('rgba(0, 0, 0, 0)') && !compColor.includes('none')) {
            if (/rgb\(25[0-5]|rgb\(24\d|#ff|#fe|#f5/i.test(compColor)) {
              filledCount++;
            }
          }
        }
        if (filledCount >= 1 && filledCount <= 5) {
          return filledCount;
        }
      }
    } catch (e) {
      // ignore
    }

    return 5;
  }

  // =========================================================================
  // 1. 리뷰 데이터 추출 헬퍼
  // =========================================================================
  function extractReviewData(container, textarea) {
    // 0. 답글 입력창 및 툴바 영역을 복제본에서 완벽히 제거
    // (이를 제거하지 않으면 "자주 쓰는 문구 / 취소 / 등록" 같은 버튼 라벨이 고객 리뷰로 오인됨)
    const clone = container.cloneNode(true);
    clone.querySelectorAll('textarea, input, button, select, .trm-ai-toolbar, [class*="comment-form" i], [class*="reply-form" i], [class*="reply-box" i], [class*="reply-input" i], [class*="reply_form" i], [class*="reply_box" i]').forEach(el => el.remove());

    const cleanFullText = (clone.innerText || '').trim();
    const isNaver = window.location.hostname.includes('smartplace.naver.com');

    // =======================================================================
    // A. 네이버 스마트플레이스 전용 파싱
    // =======================================================================
    if (isNaver) {
      // 1) 포장 여부 파악
      const isTakeout = cleanFullText.includes('포장주문') || cleanFullText.includes('포장');

      // 2) 방문 횟수 파악 (DOM 요소 단위 직접 탐색 우선)
      let visitCount = 0;
      const allEls = container.querySelectorAll('span, em, p, div, a');
      for (const el of allEls) {
        const t = (el.innerText || el.textContent || '').trim();
        const m = t.match(/^(\d{1,2})\s*번째\s*방문$/);
        if (m) {
          visitCount = parseInt(m[1], 10);
          break;
        }
      }

      // fallback: 전체 텍스트에서 '사진 15', '리뷰 43' 등을 확실히 제거한 후 매칭
      if (!visitCount) {
        const textWithoutPhotos = cleanFullText
          .replace(/사진\s*\d+/g, ' ')
          .replace(/리뷰\s*\d+/g, ' ');
        const visitMatch = textWithoutPhotos.match(/(?:^|[^\d])(\d{1,2})\s*번째\s*방문/);
        if (visitMatch) {
          visitCount = parseInt(visitMatch[1], 10);
        }
      }

      // 30회 초과는 HTML 인라인 결합 오류(예: 15 + 1 = 151번째)이므로 안전하게 1회로 보정
      if (visitCount > 30) {
        visitCount = 1;
      }

      // 3) 별점 (1~5점 정밀 추출)
      const rating = extractRatingFromLiveContainer(container, cleanFullText);

      // 4) 메뉴 (예: "★5 · 셀프마라탕" -> "셀프마라탕")
      let menu = '';
      const starMenuMatch = cleanFullText.match(/★\s*\d+\s*[·•\-]\s*([^\n\r]+)/);
      if (starMenuMatch && starMenuMatch[1]) {
        const candidateMenu = starMenuMatch[1].trim();
        if (!candidateMenu.includes('방문') && !candidateMenu.includes('리뷰') && !candidateMenu.includes('인증') && !candidateMenu.includes('주문자') && !candidateMenu.includes('접기')) {
          menu = candidateMenu;
        }
      }

      // 5) 네이버 방문자 키워드 태그 파악 (예: "음식이 맛있어요", "친절해요", "가성비가 좋아요")
      const keywordList = [
        '음식이 맛있어요', '가성비가 좋아요', '친절해요', '매장이 청결해요',
        '재료가 신선해요', '양이 많아요', '혼밥하기 좋아요', '특별한 메뉴가 있어요',
        '인테리어가 멋져요', '주차하기 편해요'
      ];
      const foundKeywords = keywordList.filter(k => cleanFullText.includes(k));
      if (foundKeywords.length > 0) {
        if (!menu) {
          menu = foundKeywords.slice(0, 2).join(', ');
        } else {
          menu += ` (${foundKeywords.slice(0, 2).join(', ')})`;
        }
      }

      // 6) 손님 작성 본문 추출
      const lines = cleanFullText.split('\n').map(s => s.trim()).filter(Boolean);
      const contentCandidates = [];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        // 첫 줄은 대개 손님 닉네임이므로 건너뜀
        if (i === 0 && (l.includes('*') || l.length <= 15)) {
          continue;
        }
        const isMeta = l.includes('방문일') || l.includes('작성일') || l.includes('주문자') ||
                       l.includes('리뷰') || l.includes('사진') || l.includes('방문') ||
                       l.includes('영수증') || l.includes('포장주문') || l.includes('결제 정보') ||
                       l === '접기' || l === '더보기' || l.startsWith('★') ||
                       l.includes('완료') || l.endsWith('>') ||
                       foundKeywords.some(k => l.includes(k)) ||
                       (menu && l.includes(menu)) || l.length <= 2;
        if (!isMeta) {
          contentCandidates.push(l);
        }
      }
      const text = contentCandidates.join(' ').trim();

      return {
        platform: 'NAVER',
        customerName: '', // 네이버 플레이스는 특정 닉네임 없이 '안녕하세요!'로 바로 시작
        rating: Math.min(5, Math.max(1, rating)),
        isTakeout,
        visitCount,
        menu: menu || (isTakeout ? '포장 주문' : '매장 방문'),
        text
      };
    }

    // =======================================================================
    // B. 배달 3사 (배민 / 쿠팡이츠 / 요기요) 파싱
    // =======================================================================
    // 1) 고객 닉네임 추출
    let customerName = '';

    // 1-1) 쿠팡이츠 닉네임 패턴: "조*우 | 1회 주문", "하*부 2회 주문", "이*미 15회 주문" 등
    const coupangNickMatch = cleanFullText.match(/([가-힣a-zA-Z0-9*]{2,12})\s*[|•·/]?\s*(\d+\s*회\s*주문|\d+\s*번째\s*주문)/);
    if (coupangNickMatch && coupangNickMatch[1]) {
      const candidate = coupangNickMatch[1].trim();
      if (!candidate.includes('배달') && !candidate.includes('포장') && !candidate.includes('수령') && candidate !== '고객') {
        customerName = candidate;
      }
    }

    // 1-2) 배민 닉네임 패턴: "알뜰배달 yeseo486", "배민배달 숙희" 등
    if (!customerName) {
      const baeminNickMatch = cleanFullText.match(/(?:알뜰배달|배민배달|가게배달|배민1|포장)\s*([a-zA-Z0-9가-힣*]{2,15})/);
      if (baeminNickMatch && baeminNickMatch[1]) {
        const candidate = baeminNickMatch[1].trim();
        if (!candidate.includes('주문') && !candidate.includes('리뷰') && candidate !== '고객') {
          customerName = candidate;
        }
      }
    }

    // 1-3) textarea에 이미 닉네임이 입력되어 있는 경우 ('숙희님,' 등)
    if (!customerName && textarea && textarea.value) {
      const match = textarea.value.trim().match(/^([^\s,，\n]+)(?:님)?/);
      if (match && match[1].length <= 15 && !match[1].includes('*') && !match[1].includes('Role') && !match[1].includes('문구')) {
        const candidate = match[1].replace(/님$/, '').trim();
        if (candidate && candidate !== '고객' && candidate !== '손님') {
          customerName = candidate;
        }
      }
    }

    // 1-4) 텍스트 줄 단위 탐색
    if (!customerName) {
      const lines = cleanFullText.split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('배달') || line.includes('포장')) {
          const stripped = line.replace(/^(알뜰배달|배민배달|가게배달|배민1|포장)\s*/, '').trim();
          if (stripped && stripped.length <= 15 && !stripped.includes('리뷰') && !stripped.includes('주문') && !stripped.includes('문구') && !stripped.includes('고객')) {
            customerName = stripped;
            break;
          }
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine && nextLine.length <= 15 && !nextLine.includes('리뷰') && !nextLine.includes('주문') && !nextLine.includes('별점') && !nextLine.includes('★') && !nextLine.includes('년') && !nextLine.includes('월') && !nextLine.includes('고객')) {
              customerName = nextLine;
              break;
            }
          }
        }
      }
    }

    // 1-5) 닉네임 DOM 셀렉터 탐색
    if (!customerName) {
      const nickEl = clone.querySelector('[class*="nick" i], [class*="author" i], [class*="user" i], strong, b, h4, h5');
      if (nickEl) {
        const t = nickEl.innerText.trim();
        if (t && t.length <= 15 && !t.includes('리뷰') && !t.includes('별점') && !t.includes('고객')) {
          const stripped = t.replace(/^(알뜰배달|배민배달|가게배달|배민1)\s*/, '').replace(/\s*\d+\s*회\s*주문.*$/, '').trim();
          if (stripped && stripped !== '주문') {
            customerName = stripped;
          }
        }
      }
    }

    // 2) 별점 추출 (1~5점)
    // 2) 별점 정밀 추출 (1~5점)
    const rating = extractRatingFromLiveContainer(container, cleanFullText);

    // 3) 주문 메뉴 & 손님 리뷰 본문 정밀 추출 (DOM 구조 기반)
    let menu = '';
    let text = '';

    // '주문메뉴' 요소 탐색 (배민/요기요/쿠팡)
    const allEls = Array.from(clone.querySelectorAll('*'));
    const menuLabelEl = allEls.find(el => {
      const t = (el.innerText || '').trim();
      return t === '주문메뉴' || t.startsWith('주문메뉴') || t === '주문 내역';
    });

    if (menuLabelEl) {
      // 메뉴명 추출: 바로 다음 형제 요소 또는 내부 텍스트
      const nextEl = menuLabelEl.nextElementSibling;
      if (nextEl && nextEl.innerText.trim()) {
        menu = nextEl.innerText.trim();
      } else {
        menu = menuLabelEl.innerText.replace(/^주문\s*메뉴\s*[:：]?\s*/, '').trim();
      }

      // 손님 리뷰 본문 추출: 주문메뉴 바로 이전의 텍스트 요소 탐색
      let prev = menuLabelEl.previousElementSibling;
      while (prev) {
        const pt = prev.innerText.trim();
        const isMeta = pt.includes('리뷰번호') || pt.includes('주문번호') || pt.includes('수령방식') ||
                       pt.includes('알뜰배달') || pt.includes('배민배달') || pt.includes('가게배달') ||
                       pt.includes('배민1') || pt.includes('포장') || pt.includes('★') ||
                       pt.includes('배달리뷰') || pt === '좋아요' || pt === '빨라요' || pt === '아쉬워요' ||
                       (/\d{4}[.\-년]\s*\d{1,2}/.test(pt)) || (customerName && pt === customerName);
        if (pt && !isMeta && pt.length >= 2) {
          text = pt;
          break;
        }
        prev = prev.previousElementSibling;
      }
    }

    // 보조 탐색: 정규식 및 텍스트 줄 탐색
    if (!menu) {
      const mMatch = cleanFullText.match(/주문\s*메뉴\s*[:：]?\s*([^\n\r]+)/);
      if (mMatch) menu = mMatch[1].replace(/^(주문\s*메뉴|메뉴)\s*[:：]?\s*/, '').trim();
    }
    if (!menu) {
      const lines = cleanFullText.split('\n').map(s => s.trim()).filter(Boolean);
      const menuIdx = lines.findIndex(l => l.includes('주문메뉴') || l.includes('주문 내역'));
      if (menuIdx !== -1) {
        const line = lines[menuIdx].replace(/주문\s*메뉴\s*[:：]?\s*/, '').trim();
        if (line) {
          menu = line;
        } else if (menuIdx + 1 < lines.length) {
          menu = lines[menuIdx + 1].trim();
        }
      }
    }

    if (!text) {
      const lines = cleanFullText.split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        if ((lines[i].includes('주문메뉴') || lines[i].includes('주문 내역')) && i > 0) {
          const contentLines = [];
          for (let j = i - 1; j >= 0; j--) {
            const line = lines[j];
            const isMeta = line.includes('리뷰번호') || line.includes('주문번호') || line.includes('★') ||
                           line.includes('수령방식') || line.includes('알뜰배달') || line.includes('배민배달') ||
                           line.includes('배민1') || (/\d{4}[.\-년]/.test(line)) ||
                           (/\d+\s*회\s*주문/.test(line)) || (customerName && line.includes(customerName));
            if (isMeta) {
              if (contentLines.length > 0) break;
              continue;
            }
            if (line.length >= 2) {
              contentLines.unshift(line);
            }
          }
          if (contentLines.length > 0) {
            text = contentLines.join(' ').trim();
          }
          break;
        }
      }
    }

    // 텍스트 최종 Fallback: 남아있는 유의미한 첫 고객 문장 찾기
    if (!text) {
      const lines = cleanFullText.split('\n').map(s => s.trim()).filter(Boolean);
      for (const line of lines) {
        const isMeta = line.includes('리뷰번호') || line.includes('주문번호') || line.includes('★') ||
                       line.includes('알뜰배달') || line.includes('배민배달') || line.includes('배민1') ||
                       line.includes('수령방식') || line.includes('주문메뉴') || line.includes('주문내역') ||
                       line.includes('접기') || line.includes('더보기') || (/\d{4}[.\-년]/.test(line)) ||
                       (/\d+\s*회\s*주문/.test(line)) || (customerName && line.includes(customerName)) ||
                       (menu && line.includes(menu)) || line.length <= 1;
        if (!isMeta) {
          text = line;
          break;
        }
      }
    }

    // 메뉴 정제 (이모지나 좋아요 등 제거)
    if (menu) {
      menu = menu.replace(/[\n\r]+/g, ', ').replace(/👍|좋아요/g, '').trim();
    }

    // 누적 주문 횟수 파악 (예: 1회 주문 고객, 8회 주문 등)
    const orderMatch = cleanFullText.match(/(\d+)\s*회\s*주문/);
    const orderCount = orderMatch ? parseInt(orderMatch[1], 10) : 0;

    const platform = window.location.hostname.includes('coupangeats') ? 'COUPANG' : (window.location.hostname.includes('yogiyo') ? 'YOGIYO' : 'BAEMIN');

    return {
      platform,
      customerName: customerName || '고객',
      rating: Math.min(5, Math.max(1, rating)),
      menu: menu || '주문하신 메뉴',
      text: text ? text.trim() : (cleanFullText || ''),
      rawText: cleanFullText || '',
      orderCount: orderCount || 0
    };
  }

  // =========================================================================
  // 1-1. 샵인샵(Shop-in-Shop) 다중 매장명 자동 매칭 헬퍼
  // =========================================================================
  function resolveStoreName(reviewData, settings) {
    let list = (settings.storeNames || []).map(s => (s || '').trim()).filter(Boolean);
    if (list.length === 0 && settings.storeName) {
      list = [settings.storeName.trim()];
    }
    if (list.length === 0) {
      return settings.storeName || '저희 매장';
    }

    const activeIdx = (typeof settings.activeStoreIndex === 'number' && settings.activeStoreIndex >= 0 && settings.activeStoreIndex < list.length)
      ? settings.activeStoreIndex
      : 0;
    const defaultStore = list[activeIdx] || list[0];

    // 자동 감지 옵션이 꺼져있으면 선택된 매장명 반환
    if (settings.autoDetectStore === false) {
      return defaultStore;
    }

    // 리뷰 본문 및 주문 메뉴 텍스트 수집
    const combinedText = `${reviewData.menu || ''} ${reviewData.text || ''} ${reviewData.rawText || ''}`.toLowerCase();

    // 각 매장명과 연관 키워드 매칭
    for (const name of list) {
      const lowerName = name.toLowerCase();

      // 1. 매장명 원본이 그대로 포함되어 있는 경우
      if (combinedText.includes(lowerName)) {
        return name;
      }

      // 2. 매장명을 공백 등으로 나눈 단어 중 2글자 이상 키워드 포함 검사 (예: "국민반찬 제육" -> "국민반찬", "제육")
      const words = lowerName.split(/[\s·,_\-/]+/).filter(w => w.length >= 2);
      for (const w of words) {
        if (combinedText.includes(w)) {
          return name;
        }
      }

      // 3. 특수 업종/메뉴 키워드 확장 매칭
      if (lowerName.includes('콩불') && (combinedText.includes('콩불') || combinedText.includes('콩나물'))) {
        return name;
      }
      if (lowerName.includes('마라') && (combinedText.includes('마라') || combinedText.includes('샹궈') || combinedText.includes('꿔바로우'))) {
        return name;
      }
      if (lowerName.includes('제육') && combinedText.includes('제육')) {
        return name;
      }
      if ((lowerName.includes('카츠') || lowerName.includes('돈까스')) && (combinedText.includes('돈까스') || combinedText.includes('돈카츠') || combinedText.includes('카츠'))) {
        return name;
      }
      if ((lowerName.includes('치킨') || lowerName.includes('닭')) && (combinedText.includes('치킨') || combinedText.includes('닭강정') || combinedText.includes('통닭'))) {
        return name;
      }
      if (lowerName.includes('버거') && (combinedText.includes('버거') || combinedText.includes('수제버거'))) {
        return name;
      }
      if (lowerName.includes('피자') && combinedText.includes('피자')) {
        return name;
      }
      if (lowerName.includes('떡볶이') && (combinedText.includes('떡볶이') || combinedText.includes('분식') || combinedText.includes('순대'))) {
        return name;
      }
    }

    // 일치하는 메뉴가 없으면 현재 활성화된 기본 매장명 반환
    return defaultStore;
  }

  // =========================================================================
  // 2. React / Vue 호환 네이티브 텍스트 입력 헬퍼
  // =========================================================================
  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // React/Vue 상태 감지를 위한 이벤트 발송
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // =========================================================================
  // 3. AI 답글 생성 및 자동 타이핑 실행
  // =========================================================================
  async function generateAndFillReply(textarea, container, btn, statusBadge) {
    // 0. 확장 프로그램 런타임 연결 상태 확인
    // (확장 프로그램을 재로드했을 때 열려있던 탭은 런타임 연결이 끊기므로 새로고침 안내)
    if (!window.chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      statusBadge.innerText = '🔄 페이지 새로고침(F5) 필요!';
      statusBadge.className = 'trm-status-badge trm-badge-error';
      statusBadge.style.display = 'inline-flex';
      alert(
        '⚠️ [트레이드미 AI 리뷰 비서 안내]\n\n' +
        '확장 프로그램이 새로 설치되거나 업데이트되었습니다.\n' +
        '현재 열려 있는 페이지를 새로고침(F5 키)하신 후 다시 [트레이드미 AI 답글 자동입력] 버튼을 눌러주세요! 😊'
      );
      return;
    }

    // 최신 설정 동기화
    try {
      if (chrome.storage && chrome.storage.local) {
        const res = await new Promise(resolve => {
          chrome.storage.local.get(
            ['tradeMeAuth', 'apiKey', 'storeName', 'storeNames', 'activeStoreIndex', 'autoDetectStore', 'persona', 'charLimit', 'emojiLevel', 'autoSubmit'],
            resolve
          );
        });
        if (res) settings = { ...settings, ...res };
      }
    } catch (e) {
      // ignore
    }

    // 0-1. 트레이드미 회원 로그인 인증 여부 확인 (락인)
    if (!settings.tradeMeAuth || !settings.tradeMeAuth.isLoggedIn) {
      statusBadge.innerText = '🔒 트레이드미 로그인 필요!';
      statusBadge.className = 'trm-status-badge trm-badge-error';
      statusBadge.style.display = 'inline-flex';
      const goTradeMe = confirm(
        '🔒 [트레이드미(TradeMe) 사장님 회원 전용 안내]\n\n' +
        '배민·쿠팡·요기요·네이버 1초 맞춤 리뷰 AI는 트레이드미 회원 사장님께 평생 무료로 제공됩니다!\n\n' +
        '크롬 우측 상단 [🧩 퍼즐 아이콘] ➔ [트레이드미 AI 리뷰 비서]를 눌러 로그인하시거나,\n' +
        '아직 회원이 아니시라면 트레이드미 웹사이트에서 무료 회원가입 후 이용해 주세요.\n\n' +
        '지금 트레이드미 웹사이트로 이동하시겠습니까? 😊'
      );
      if (goTradeMe) {
        window.open('https://trade-me-seven.vercel.app', '_blank');
      }
      return false;
    }

    // 사장님 매장 상호명 자동 동기화 (설정값이 비어있을 경우 트레이드미 등록 매장명 사용)
    if (!settings.storeName && settings.tradeMeAuth.storeName) {
      settings.storeName = settings.tradeMeAuth.storeName;
    }

    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      statusBadge.innerText = '⚠️ API 키 등록 필요!';
      statusBadge.className = 'trm-status-badge trm-badge-error';
      statusBadge.style.display = 'inline-flex';
      alert(
        '⚠️ [구글 Gemini 무료 API 키 등록 필요]\n\n' +
        '크롬 우측 상단 [🧩 퍼즐 아이콘] ➔ [트레이드미 AI 리뷰 비서]를 클릭하여\n' +
        '무료 API 키를 입력하고 [설정 저장하기]를 먼저 눌러주세요!'
      );
      return false;
    }

    const reviewData = extractReviewData(container, textarea);
    const activeStoreName = resolveStoreName(reviewData, settings);

    btn.disabled = true;
    btn.classList.add('trm-loading');
    statusBadge.innerText = '⚡ AI 분석 및 답글 작성 중...';
    statusBadge.style.display = 'inline-flex';

    // 쿠팡이츠는 300자 제한을 엄격히 적용
    let targetCharLimit = Number(settings.charLimit) || 300;
    if (window.location.hostname.includes('coupangeats')) {
      targetCharLimit = Math.min(targetCharLimit, 300);
    }

    try {
      // 백그라운드 서비스 워커에 생성 요청 (CSP 우회)
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: 'GENERATE_REVIEW_REPLY',
            payload: {
              apiKey: settings.apiKey,
              storeName: activeStoreName,
              persona: settings.persona,
              charLimit: targetCharLimit,
              emojiLevel: settings.emojiLevel || 'MEDIUM',
              contexts: {},
              reviewData
            }
          },
          (res) => {
            if (chrome.runtime.lastError) {
              return reject(new Error(chrome.runtime.lastError.message));
            }
            resolve(res);
          }
        );
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const generatedReply = response.reply;

      // 텍스트 영역에 자동 입력
      textarea.focus();
      setNativeValue(textarea, generatedReply);

      statusBadge.innerText = `✨ 맞춤 답글 완성! (${generatedReply.length}자)`;
      statusBadge.className = 'trm-status-badge trm-badge-success';

      // 🎯 [옵션] 자동 등록 모드가 켜져 있는 경우 배민·쿠팡이츠·요기요 [등록] 버튼 자동 클릭
      if (settings.autoSubmit) {
        statusBadge.innerText = '🚀 0.7초 후 자동 등록 중...';
        await new Promise(r => setTimeout(r, 700));
        const searchScope = textarea.closest('form, tr, [class*="reply" i]') || textarea.parentElement || container;
        const candidateButtons = Array.from(searchScope.querySelectorAll('button, input[type="submit"], a[role="button"]'));
        const submitBtn = candidateButtons.find(b => {
          const txt = (b.innerText || b.value || '').trim();
          return (
            txt.includes('등록') ||
            txt.includes('작성') ||
            txt.includes('저장') ||
            txt.includes('완료') ||
            b.type === 'submit' ||
            b.classList.contains('btn-register') ||
            b.classList.contains('submit')
          );
        });
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          statusBadge.innerText = '✅ 답글 등록 완료!';
          // 모달 확인창이 뜰 경우를 대비한 자동 확인 클릭
          await new Promise(r => setTimeout(r, 500));
          const confirmBtns = Array.from(document.querySelectorAll('button')).filter(b => {
            const t = (b.innerText || '').trim();
            return t === '확인' || t === '등록' || t === '예';
          });
          if (confirmBtns.length > 0 && confirmBtns[confirmBtns.length - 1].offsetParent !== null) {
            confirmBtns[confirmBtns.length - 1].click();
          }
        }
      } else {
        setTimeout(() => {
          statusBadge.style.display = 'none';
        }, 3500);
      }

      return true;

    } catch (err) {
      console.error('[TradeMe Review AI Error]:', err);
      const isContextError = (err.message || '').includes('Extension context invalidated') ||
                             (err.message || '').includes('sendMessage') ||
                             (err.message || '').includes('disconnected');
      if (isContextError) {
        statusBadge.innerText = '🔄 페이지 새로고침(F5) 필요!';
        alert('⚠️ [트레이드미 AI 리뷰 비서]\n\n확장 프로그램이 업데이트되었습니다. 현재 페이지를 새로고침(F5) 후 다시 시도해 주세요!');
      } else {
        statusBadge.innerText = `❌ 오류: ${err.message || '답변 생성 실패'}`;
      }
      statusBadge.className = 'trm-status-badge trm-badge-error';
      return false;
    } finally {
      btn.disabled = false;
      btn.classList.remove('trm-loading');
    }
  }

  // =========================================================================
  // 4. 배민/쿠팡이츠/네이버 DOM 스캔 및 버튼 주입
  // =========================================================================

  // 특정 textarea에 정확히 매칭되는 단일 리뷰 컨테이너 정밀 탐색
  function findReviewContainerForTextarea(textarea) {
    if (!textarea) return null;

    // 헬퍼: 해당 요소가 실제 '고객 리뷰 본문 및 주문 정보'를 포함하는 단일 리뷰인지 정밀 판별
    function isSingleReviewContainer(el) {
      if (!el || el === document.body || el === document.documentElement) return false;
      const t = el.innerText || '';

      // [핵심 검증 1]: 배달앱(배민/쿠팡이츠/요기요)의 단일 리뷰 카드에는 '주문번호' 또는 '리뷰번호'가 정확히 1개 존재!
      const orderMatches = t.match(/주문\s*번호|리뷰\s*번호/g) || [];
      if (orderMatches.length === 1) {
        return true;
      }

      // [핵심 검증 2]: 주문번호가 없는 경우(네이버 등) 메뉴/방문 마커가 1~3개 있고 textarea가 1개 이하
      const coreMarkers = t.match(/(?:주문\s*메뉴|주문\s*내역|\d+\s*회\s*주문|\d+\s*번째\s*방문)/g) || [];
      const textareaCount = el.querySelectorAll ? el.querySelectorAll('textarea').length : 0;
      if (orderMatches.length === 0 && coreMarkers.length >= 1 && coreMarkers.length <= 4 && textareaCount <= 1) {
        return true;
      }

      return false;
    }

    // 1) textarea의 부모 계층을 1단계씩 거슬러 올라가며 실제 고객 리뷰가 포함된 단일 카드 탐색
    let cur = textarea.parentElement;
    while (cur && cur !== document.body) {
      if (isSingleReviewContainer(cur)) {
        return cur;
      }
      // 이미 여러 리뷰를 포함하는 대형 컨테이너 레벨로 올라간 경우 중단
      const curText = cur.innerText || '';
      const orderCount = (curText.match(/(?:주문\s*번호|리뷰\s*번호|주문\s*메뉴|\d+\s*회\s*주문)/g) || []).length;
      if (orderCount > 3) {
        break;
      }
      cur = cur.parentElement;
    }

    // 2) 쿠팡이츠 등 답글 입력창이 리뷰 바로 아래 행(tr)이나 별도 블록으로 분리된 경우:
    // textarea를 감싸고 있는 행/블록의 이전 형제(previousElementSibling)들을 순차 역탐색!
    let directRow = textarea.closest('tr, li, [class*="reply" i]') || textarea.parentElement;
    while (directRow && directRow !== document.body) {
      let prev = directRow.previousElementSibling;
      let steps = 0;
      while (prev && steps < 6) {
        if (isSingleReviewContainer(prev)) {
          return prev;
        }
        prev = prev.previousElementSibling;
        steps++;
      }
      directRow = directRow.parentElement;
    }

    // 3) 특정 클래스명 기반 탐색 (단, 단일 리뷰여야 함)
    const candidates = [
      textarea.closest('tr'),
      textarea.closest('li'),
      textarea.closest('[class*="review-item" i]'),
      textarea.closest('[class*="review_item" i]'),
      textarea.closest('[class*="review-card" i]'),
      textarea.closest('[class*="reviewCard" i]'),
      textarea.closest('[data-review-id]')
    ];
    for (const c of candidates) {
      if (c && isSingleReviewContainer(c)) return c;
    }

    // 4) 최종 안전 fallback: textarea의 직계 부모 또는 행
    return textarea.closest('tr, li, form') || textarea.parentElement || textarea;
  }

  function injectAiButtons() {
    // 페이지 내의 모든 답글 textarea 탐색
    const textareas = document.querySelectorAll('textarea');

    textareas.forEach((textarea) => {
      // 이미 버튼이 삽입된 경우 스킵
      if (textarea.dataset.trmInjected === 'true') return;

      const container = findReviewContainerForTextarea(textarea);
      if (!container) return;

      textarea.dataset.trmInjected = 'true';

      // 트레이드미 AI 툴바 생성
      const toolbar = document.createElement('div');
      toolbar.className = 'trm-ai-toolbar';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'trm-ai-btn';
      btn.innerHTML = `
        <span class="trm-sparkle">🤖</span>
        <span class="trm-btn-text">트레이드미 AI 답글 자동입력</span>
      `;

      const statusBadge = document.createElement('span');
      statusBadge.className = 'trm-status-badge';
      statusBadge.style.display = 'none';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 클릭 시점에 최신 리뷰 컨테이너를 다시 한 번 동적으로 확인하여 정확도 100% 보장
        const currentContainer = findReviewContainerForTextarea(textarea) || container;
        generateAndFillReply(textarea, currentContainer, btn, statusBadge);
      });

      toolbar.appendChild(btn);
      toolbar.appendChild(statusBadge);

      // 🎯 [프레임 이탈 방지]:
      // textarea의 부모가 작은 글자수 카운터 래퍼인 경우 그 래퍼 바로 위에,
      // 그 외에는 textarea 바로 위에 툴바를 삽입하여 프레임 이탈 방지
      let targetInsert = textarea;
      const p = textarea.parentElement;
      if (p && p !== container && p !== document.body && !['TR', 'TD', 'TH', 'BODY'].includes(p.tagName)) {
        const hasCounterOnly = p.children.length <= 4 && /\d+\s*[\/／]\s*\d+/.test(p.innerText);
        const isImmediateInputWrap = p.children.length <= 3 && p.classList && /(textarea|input-wrap|editor|field)/i.test(p.className);
        if (hasCounterOnly || isImmediateInputWrap) {
          targetInsert = p;
        }
      }

      targetInsert.parentNode.insertBefore(toolbar, targetInsert);
    });
  }

  // 초기 실행 및 동적 렌더링 감지 (MutationObserver)
  injectAiButtons();

  const observer = new MutationObserver(() => {
    injectAiButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
