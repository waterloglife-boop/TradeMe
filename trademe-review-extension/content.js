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

  // =========================================================================
  // 1. 리뷰 데이터 추출 헬퍼
  // =========================================================================
  function extractReviewData(container, textarea) {
    // 0. 답글 입력창 및 툴바 영역을 복제본에서 완벽히 제거
    // (이를 제거하지 않으면 "자주 쓰는 문구 / 취소 / 등록" 같은 버튼 라벨이 고객 리뷰로 오인됨)
    const clone = container.cloneNode(true);
    clone.querySelectorAll('textarea, input, button, select, .trm-ai-toolbar, [class*="reply" i], [class*="comment-form" i], [class*="button" i], [class*="btn" i]').forEach(el => el.remove());

    const cleanFullText = (clone.innerText || '').trim();
    const isNaver = window.location.hostname.includes('smartplace.naver.com');

    // =======================================================================
    // A. 네이버 스마트플레이스 전용 파싱
    // =======================================================================
    if (isNaver) {
      // 1) 포장 여부 파악
      const isTakeout = cleanFullText.includes('포장주문') || cleanFullText.includes('포장');

      // 2) 방문 횟수 파악 (1번째 방문, 2번째 방문 등)
      const visitMatch = cleanFullText.match(/(\d+)\s*번째\s*방문/);
      const visitCount = visitMatch ? parseInt(visitMatch[1], 10) : 0;

      // 3) 별점 (1~5점)
      let rating = 5;
      const starMatch = cleanFullText.match(/★\s*(\d)/) || cleanFullText.match(/별점\s*(\d)/);
      if (starMatch) {
        rating = parseInt(starMatch[1], 10);
      } else {
        const starAria = clone.querySelector('[aria-label*="점"], [aria-label*="star" i], [title*="점"]');
        if (starAria) {
          const match = (starAria.getAttribute('aria-label') || starAria.getAttribute('title') || '').match(/(\d)/);
          if (match) rating = parseInt(match[1], 10);
        }
      }

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
    // textarea에 이미 닉네임이 입력되어 있는 경우 ('숙희님,' 등)
    if (textarea && textarea.value) {
      const match = textarea.value.trim().match(/^([^\s,，\n]+)(?:님)?/);
      if (match && match[1].length <= 15 && !match[1].includes('*') && !match[1].includes('Role') && !match[1].includes('문구')) {
        const candidate = match[1].replace(/님$/, '').trim();
        // '고객', '손님' 등 일반 대명사는 실제 닉네임이 아니므로 제외하고 DOM 탐색 계속
        if (candidate && candidate !== '고객' && candidate !== '손님') {
          customerName = candidate;
        }
      }
    }
    if (!customerName) {
      // 텍스트 줄 중 '알뜰배달 숙희' 등 형태 탐색
      const lines = cleanFullText.split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('배달') || line.includes('포장')) {
          // '알뜰배달 숙희' 처럼 한 줄에 붙어있는 경우
          const stripped = line.replace(/^(알뜰배달|배민배달|가게배달|배민1|포장)\s*/, '').trim();
          if (stripped && stripped.length <= 15 && !stripped.includes('리뷰') && !stripped.includes('주문') && !stripped.includes('문구') && !stripped.includes('고객')) {
            customerName = stripped;
            break;
          }
          // '알뜰배달' 태그 바로 다음 줄에 '숙희' 닉네임이 분리되어 있는 경우
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
    if (!customerName) {
      const nickEl = clone.querySelector('[class*="nick" i], [class*="author" i], [class*="user" i], strong, b, h4, h5');
      if (nickEl) {
        const t = nickEl.innerText.trim();
        if (t && t.length <= 15 && !t.includes('주문') && !t.includes('리뷰') && !t.includes('별점') && !t.includes('고객')) {
          customerName = t.replace(/^(알뜰배달|배민배달|가게배달|배민1)\s*/, '').trim();
        }
      }
    }

    // 2) 별점 추출 (1~5점)
    let rating = 5;
    const starAria = clone.querySelector('[aria-label*="점"], [aria-label*="star" i], [title*="점"]');
    if (starAria) {
      const match = (starAria.getAttribute('aria-label') || starAria.getAttribute('title') || '').match(/(\d)/);
      if (match) rating = parseInt(match[1], 10);
    } else {
      const fullStars = clone.querySelectorAll('.star-fill, svg.fill-current, [class*="star" i][class*="active" i]');
      if (fullStars.length > 0 && fullStars.length <= 5) {
        rating = fullStars.length;
      } else {
        const ratingMatch = cleanFullText.match(/(\d)\s*점/);
        if (ratingMatch) rating = parseInt(ratingMatch[1], 10);
      }
    }

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
        menu = menuLabelEl.innerText.replace(/^주문\s*메뉴\s*/, '').trim();
      }

      // 손님 리뷰 본문 추출: 주문메뉴 바로 이전의 텍스트 요소 탐색
      let prev = menuLabelEl.previousElementSibling;
      while (prev) {
        const pt = prev.innerText.trim();
        // 날짜, 별점, 리뷰번호, 배달리뷰 태그 등 메타데이터가 아닌 실제 고객 텍스트만 추출
        const isMeta = pt.includes('리뷰번호') || pt.includes('주문') || pt.includes('고객') ||
                       pt.includes('알뜰배달') || pt.includes('배민배달') || pt.includes('가게배달') ||
                       pt.includes('배민1') || pt.includes('포장') || pt.includes('★') ||
                       pt.includes('배달리뷰') || pt === '좋아요' || pt === '빨라요' || pt === '아쉬워요' ||
                       (/\d{4}년\s*\d{1,2}월/.test(pt)) || (customerName && pt === customerName);
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
    if (!text) {
      const lines = cleanFullText.split('\n').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('주문메뉴') && i > 0) {
          for (let j = i - 1; j >= 0; j--) {
            const line = lines[j];
            const isMeta = line.includes('리뷰번호') || line.includes('★') || line.includes('배달') ||
                           line.includes('고객') || line.includes('주문') || line.includes('좋아요') ||
                           line.includes('빨라요') || line.includes('아쉬워요') || (/\d{4}년/.test(line)) ||
                           (customerName && line === customerName);
            if (!isMeta && line.length >= 2) {
              text = line;
              break;
            }
          }
          break;
        }
      }
    }

    // 메뉴 정제 (이모지나 좋아요 등 제거)
    if (menu) {
      menu = menu.replace(/[\n\r]+/g, ', ').replace(/👍|좋아요/g, '').trim();
    }

    const platform = window.location.hostname.includes('coupangeats') ? 'COUPANG' : (window.location.hostname.includes('yogiyo') ? 'YOGIYO' : 'BAEMIN');

    return {
      platform,
      customerName: customerName || '고객',
      rating: Math.min(5, Math.max(1, rating)),
      menu: menu || '주문하신 메뉴',
      text: text ? text.trim() : ''
    };
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
          chrome.storage.local.get(['tradeMeAuth', 'apiKey', 'storeName', 'persona', 'charLimit', 'emojiLevel', 'autoSubmit', 'contexts'], resolve);
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
      return;
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
      return;
    }

    const reviewData = extractReviewData(container, textarea);
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
              storeName: settings.storeName,
              persona: settings.persona,
              charLimit: targetCharLimit,
              emojiLevel: settings.emojiLevel || 'MEDIUM',
              contexts: settings.contexts,
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

      statusBadge.innerText = `✨ ${reviewData.rating}점 맞춤 답글 완성! (${generatedReply.length}자)`;
      statusBadge.className = 'trm-status-badge trm-badge-success';

      // 🎯 [옵션] 자동 등록 모드가 켜져 있는 경우 배민·쿠팡이츠·요기요 [등록] 버튼 자동 클릭
      if (settings.autoSubmit) {
        statusBadge.innerText = '🚀 0.7초 후 자동 등록 중...';
        setTimeout(() => {
          const candidateButtons = Array.from(container.querySelectorAll('button, input[type="submit"], a[role="button"]'));
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
          }
        }, 700);
      } else {
        setTimeout(() => {
          statusBadge.style.display = 'none';
        }, 3500);
      }

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
    } finally {
      btn.disabled = false;
      btn.classList.remove('trm-loading');
    }
  }

  // =========================================================================
  // 4. 배민/쿠팡이츠 DOM 스캔 및 버튼 주입
  // =========================================================================
  function injectAiButtons() {
    // 페이지 내의 모든 답글 textarea 탐색
    const textareas = document.querySelectorAll('textarea');

    textareas.forEach((textarea) => {
      // 이미 버튼이 삽입된 경우 스킵
      if (textarea.dataset.trmInjected === 'true') return;

      // textarea를 감싸고 있는 전체 리뷰 컨테이너 정밀 탐색
      let container = null;
      let cur = textarea.parentElement;
      while (cur && cur !== document.body) {
        const t = cur.innerText || '';
        if (t.includes('주문메뉴') || t.includes('리뷰번호') || t.includes('배달리뷰') || t.includes('영수증') || t.includes('방문자') || t.includes('예약') || t.includes('스마트플레이스') || t.includes('네이버')) {
          container = cur;
          break;
        }
        cur = cur.parentElement;
      }
      if (!container) {
        container = textarea.closest('[class*="review" i], [class*="item" i], [class*="card" i], [class*="box" i], li, tr, div[tabindex]') || textarea.parentElement;
      }
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
        generateAndFillReply(textarea, container, btn, statusBadge);
      });

      toolbar.appendChild(btn);
      toolbar.appendChild(statusBadge);

      // textarea 바로 위에 삽입
      textarea.parentNode.insertBefore(toolbar, textarea);
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

  // =========================================================================
  // 5. 플로팅 퀵 헬퍼 위젯 (화면 우측 하단 상시 보조)
  // =========================================================================
  function createFloatingWidget() {
    if (document.getElementById('trm-floating-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'trm-floating-widget';
    widget.className = 'trm-floating-widget';
    widget.innerHTML = `
      <div class="trm-floating-badge" title="트레이드미 AI 리뷰 비서 작동 중">
        <span>🤖 트레이드미 AI</span>
      </div>
    `;

    widget.addEventListener('click', () => {
      // 가장 가까운 textarea에 포커스
      const firstTextarea = document.querySelector('textarea');
      if (firstTextarea) {
        firstTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstTextarea.focus();
      } else {
        alert('💡 현재 화면에서 답글을 달 수 있는 리뷰 입력창을 찾고 있습니다. 리뷰 목록 페이지로 이동해 주세요.');
      }
    });

    document.body.appendChild(widget);
  }

  // 1.5초 후 플로팅 위젯 부착
  setTimeout(createFloatingWidget, 1500);

})();
