// 🤖 트레이드미 배민·쿠팡이츠·네이버플레이스 AI 리뷰 비서 - Popup Controller
// 트레이드미(TradeMe) 회원 인증 및 락인(Lock-In) 시스템 탑재

document.addEventListener('DOMContentLoaded', () => {
  const TRADEME_SITE_URL = 'https://trade-me-seven.vercel.app';
  const SUPABASE_URL = 'https://ekpitdijyfnsjhdpaqde.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcGl0ZGlqeWZuc2poZHBhcWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDA3MTMsImV4cCI6MjEwMzMxNjcxM30.k4vEtxE5XEY8oBolYYvw9EWANDX3zIu2mjZEscvn6pc';

  // 1. Auth 관련 DOM 요소
  const viewAuth = document.getElementById('viewAuth');
  const viewMain = document.getElementById('viewMain');
  const apiStatusBadge = document.getElementById('apiStatusBadge');
  const tradeMeLoginForm = document.getElementById('tradeMeLoginForm');
  const tradeMeEmailInput = document.getElementById('tradeMeEmailInput');
  const tradeMePassInput = document.getElementById('tradeMePassInput');
  const tradeMeLoginBtn = document.getElementById('tradeMeLoginBtn');
  const tradeMeAuthMsg = document.getElementById('tradeMeAuthMsg');
  const tradeMeRegisterBtn = document.getElementById('tradeMeRegisterBtn');
  const bannerStoreName = document.getElementById('bannerStoreName');
  const tradeMeSiteBtn = document.getElementById('tradeMeSiteBtn');
  const tradeMeLogoutBtn = document.getElementById('tradeMeLogoutBtn');

  // 2. 메인 설정 DOM 요소
  const tabBtnSettings = document.getElementById('tabBtnSettings');
  const tabBtnTest = document.getElementById('tabBtnTest');
  const tabSettings = document.getElementById('tabSettings');
  const tabTest = document.getElementById('tabTest');

  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
  const storeNameInput = document.getElementById('storeNameInput');

  const ctxWeather = document.getElementById('ctxWeather');
  const ctxWeatherText = document.getElementById('ctxWeatherText');
  const ctxNewMenu = document.getElementById('ctxNewMenu');
  const ctxNewMenuText = document.getElementById('ctxNewMenuText');
  const ctxMonthlyReorder = document.getElementById('ctxMonthlyReorder');
  const ctxMonthlyReorderText = document.getElementById('ctxMonthlyReorderText');
  const ctxDelay = document.getElementById('ctxDelay');
  const ctxReviewEvent = document.getElementById('ctxReviewEvent');
  const charLimitSelect = document.getElementById('charLimitSelect');
  const emojiLevelSelect = document.getElementById('emojiLevelSelect');

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  // 3. Test Playground Elements
  const sampleSelect = document.getElementById('sampleSelect');
  const sampleReviewText = document.getElementById('sampleReviewText');
  const runTestBtn = document.getElementById('runTestBtn');
  const testResultCard = document.getElementById('testResultCard');
  const testResultText = document.getElementById('testResultText');
  const testTimeTaken = document.getElementById('testTimeTaken');
  const copyResultBtn = document.getElementById('copyResultBtn');

  // 샘플 리뷰 프리셋
  const samplePresets = {
    '5_PRAISE': {
      rating: 5,
      menu: '수제 치즈돈까스 세트 + 미니우동',
      text: '치즈가 진짜 폭포처럼 늘어나고 고기도 두툼해서 너무 맛있어요! 배달도 빠르고 따뜻하게 와서 온 가족이 감탄하면서 먹었습니다. 벌써 3번째 주문인데 다음 주에 또 시킬게요~ 사장님 대박나세요!!'
    },
    '1_CLAIM': {
      rating: 1,
      menu: '특 로스카츠 정식 + 사이다',
      text: '배달 예정 시간보다 40분이나 늦게 와서 튀김옷이 눅눅하게 다 젖어있네요. 게다가 주문했던 사이다 음료도 누락되어서 안 왔습니다. 점심시간 다 놓치고 기분만 상했네요. 다시는 안 시킵니다.'
    },
    '3_NORMAL': {
      rating: 3,
      menu: '안심돈까스 도시락',
      text: '고기 양도 푸짐하고 포장도 깔끔해서 좋았는데, 소스 간이 제 입맛에는 조금 많이 짰어요. 국물도 약간 미지근해서 아쉬웠습니다. 그래도 고기 자체는 부드럽고 괜찮았습니다.'
    },
    '5_NO_TEXT': {
      customerName: '영희',
      rating: 5,
      menu: '통모짜 치즈카츠 단품',
      text: ''
    },
    '1_NO_TEXT': {
      customerName: '익명고객',
      rating: 1,
      menu: '옛날 왕돈까스 도시락',
      text: ''
    },
    'NAVER_TAKEOUT': {
      platform: 'NAVER',
      customerName: '',
      isTakeout: true,
      visitCount: 1,
      rating: 5,
      menu: '셀프마라탕 (음식이 맛있어요)',
      text: ''
    },
    'NAVER_RECEIPT': {
      platform: 'NAVER',
      customerName: '',
      isTakeout: false,
      visitCount: 1,
      rating: 5,
      menu: '셀프마라탕, 백탕',
      text: '처음 시켜먹었는데 너무 맛있어서 다음에 또 올 것 같아요! 백탕으로 약간 얼얼맛 선택했는데 아이도 정말 잘 먹네요.'
    },
    'NAVER_REGULAR': {
      platform: 'NAVER',
      customerName: '',
      isTakeout: false,
      visitCount: 3,
      rating: 5,
      menu: '매장 방문 (영수증 인증)',
      text: '벌써 세 번째 방문인데 올 때마다 사장님도 너무 친절하시고 국물 맛도 깊어서 늘 감탄합니다. 최고예요!'
    }
  };

  // ========================================================
  // A. 인증 상태 렌더링 (로그인 화면 vs 메인 화면 전환)
  // ========================================================
  function renderAuthState(tradeMeAuth) {
    if (tradeMeAuth && tradeMeAuth.isLoggedIn) {
      viewAuth.style.display = 'none';
      viewMain.style.display = 'block';

      const sName = tradeMeAuth.storeName || storeNameInput.value || '내 매장';
      bannerStoreName.innerText = sName;

      if (apiStatusBadge) {
        if (apiKeyInput.value.trim()) {
          apiStatusBadge.className = 'status-badge badge-success';
          apiStatusBadge.innerText = '인증 완료';
        } else {
          apiStatusBadge.className = 'status-badge badge-warning';
          apiStatusBadge.innerText = '키 등록 필요';
        }
      }
    } else {
      viewAuth.style.display = 'block';
      viewMain.style.display = 'none';

      if (apiStatusBadge) {
        apiStatusBadge.className = 'status-badge badge-warning';
        apiStatusBadge.innerText = '로그인 필요';
      }
    }
  }

  // ========================================================
  // B. 트레이드미 로그인 처리 (Supabase Auth REST API)
  // ========================================================
  tradeMeLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = tradeMeEmailInput.value.trim().toLowerCase();
    const password = tradeMePassInput.value.trim();

    if (!email || !password) return;

    tradeMeLoginBtn.disabled = true;
    tradeMeLoginBtn.innerHTML = '<span>⚡ 트레이드미 계정 확인 중...</span>';
    tradeMeAuthMsg.style.display = 'none';

    try {
      // 1. Supabase Auth REST 로그인 요청 (Vercel 거치지 않고 직접 통신)
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      let isEmailNotConfirmed = false;
      if (!res.ok) {
        // Supabase에서 비밀번호는 맞았으나 이메일 인증 메일 링크를 안 누른 상태인 경우
        const rawMsg = data.msg || data.error_description || data.error_code || '';
        if (
          rawMsg === 'Email not confirmed' ||
          data.error_code === 'email_not_confirmed' ||
          rawMsg.toLowerCase().includes('email not confirmed')
        ) {
          isEmailNotConfirmed = true;
        } else {
          let errorMsg = '이메일 또는 비밀번호가 올바르지 않습니다.';
          if (data.msg === 'Invalid login credentials' || data.error_description === 'Invalid login credentials') {
            errorMsg = '이메일 또는 비밀번호가 일치하지 않습니다.';
          } else if (data.msg) {
            errorMsg = data.msg;
          }
          throw new Error(errorMsg);
        }
      }

      // 2. 사장님 프로필 및 매장 정보 조회
      let userId = '';
      let userEmail = email;
      let storeName = '';
      let ownerName = '사장님';
      let category = '';
      let address = '';
      let accessToken = data.access_token || '';

      if (isEmailNotConfirmed) {
        // 이메일 미인증 상태이지만 비밀번호는 검증되었으므로 public.profiles에서 조회
        try {
          const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=*`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY
            }
          });
          if (profRes.ok) {
            const profiles = await profRes.json();
            if (profiles && profiles.length > 0) {
              const p = profiles[0];
              userId = p.id;
              userEmail = p.email || email;
              storeName = p.store_name || '';
              ownerName = p.owner_name || '사장님';
              address = p.address || '';
            }
          }
        } catch (profErr) {
          console.warn('[TradeMe Profile fetch warn]:', profErr);
        }
      } else if (data.user) {
        userId = data.user.id;
        userEmail = data.user.email || email;
        storeName = data.user.user_metadata?.store_name || '';
        ownerName = data.user.user_metadata?.owner_name || '사장님';
      }

      // stores 테이블에서 매장 상호명 및 상세 정보 추가 조회
      if (userId) {
        try {
          const storeRes = await fetch(`${SUPABASE_URL}/rest/v1/stores?user_id=eq.${userId}&select=*`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
            }
          });
          if (storeRes.ok) {
            const stores = await storeRes.json();
            if (stores && stores.length > 0) {
              const s = stores[0];
              storeName = s.store_name || storeName;
              ownerName = s.owner_name || ownerName;
              category = s.category || '';
              address = s.address || address;
            }
          }
        } catch (err) {
          console.warn('[TradeMe Store fetch warn]:', err);
        }
      }

      if (!storeName) storeName = '내 매장';

      const tradeMeAuth = {
        isLoggedIn: true,
        email: userEmail,
        userId: userId || ('tm-user-' + Date.now()),
        accessToken: accessToken || 'session-email-verified',
        storeName,
        ownerName,
        category,
        address,
        loggedInAt: Date.now()
      };

      // 3. 로컬 스토리지에 저장 및 매장 상호명 자동 동기화
      await new Promise((resolve) => {
        chrome.storage.local.set({ tradeMeAuth, storeName }, resolve);
      });

      storeNameInput.value = storeName;
      renderAuthState(tradeMeAuth);

      // 4. 🚀 [락인 핵심] 로그인 성공 시 트레이드미 웹사이트 새 탭으로 시원하게 오픈!
      chrome.tabs.create({ url: TRADEME_SITE_URL });

    } catch (err) {
      tradeMeAuthMsg.className = 'auth-msg auth-msg-error';
      tradeMeAuthMsg.innerText = `❌ ${err.message || '로그인에 실패했습니다.'}`;
      tradeMeAuthMsg.style.display = 'block';
    } finally {
      tradeMeLoginBtn.disabled = false;
      tradeMeLoginBtn.innerHTML = '<span>🚀 트레이드미 로그인하고 시작하기</span>';
    }
  });

  // 회원가입 버튼 (트레이드미 웹사이트 열기)
  tradeMeRegisterBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: TRADEME_SITE_URL });
  });

  // 상단 배너 웹사이트 이동 버튼
  tradeMeSiteBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: TRADEME_SITE_URL });
  });

  // 로그아웃 버튼
  tradeMeLogoutBtn.addEventListener('click', () => {
    if (confirm('트레이드미 계정에서 로그아웃하시겠습니까?')) {
      chrome.storage.local.remove(['tradeMeAuth'], () => {
        renderAuthState(null);
      });
    }
  });

  // ========================================================
  // C. 탭 전환 및 일반 설정 관리
  // ========================================================
  tabBtnSettings.addEventListener('click', () => {
    tabBtnSettings.classList.add('active');
    tabBtnTest.classList.remove('active');
    tabSettings.classList.add('active');
    tabTest.classList.remove('active');
  });

  tabBtnTest.addEventListener('click', () => {
    tabBtnTest.classList.add('active');
    tabBtnSettings.classList.remove('active');
    tabTest.classList.add('active');
    tabSettings.classList.remove('active');
    updateSamplePreview();
  });

  // 2. API Key 보기/숨기기 토글
  toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.innerText = '🙈';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.innerText = '👁️';
    }
  });

  // 3. 기존 저장된 설정 불러오기
  function loadSettings() {
    chrome.storage.local.get(
      ['tradeMeAuth', 'apiKey', 'storeName', 'persona', 'charLimit', 'emojiLevel', 'autoSubmit', 'contexts'],
      (res) => {
        renderAuthState(res.tradeMeAuth);

        try {
          const appVersionText = document.getElementById('appVersionText');
          if (appVersionText && chrome?.runtime?.getManifest) {
            const manifest = chrome.runtime.getManifest();
            appVersionText.innerText = `v${manifest.version || '1.3.1'} (트레이드미 회원 전용)`;
          }
        } catch (e) {}

        if (res.apiKey) {
          apiKeyInput.value = res.apiKey;
        }

        if (res.tradeMeAuth && res.tradeMeAuth.storeName) {
          storeNameInput.value = res.tradeMeAuth.storeName;
        } else if (res.storeName) {
          storeNameInput.value = res.storeName;
        }

        if (res.persona) {
          const radio = document.querySelector(`input[name="persona"][value="${res.persona}"]`);
          if (radio) radio.checked = true;
        }

        if (res.autoSubmit !== undefined) {
          const autoRadio = document.querySelector(`input[name="autoSubmit"][value="${res.autoSubmit}"]`);
          if (autoRadio) autoRadio.checked = true;
        }

        if (res.charLimit) {
          charLimitSelect.value = String(res.charLimit);
        } else {
          charLimitSelect.value = '300';
        }

        if (res.emojiLevel) {
          emojiLevelSelect.value = res.emojiLevel;
        } else {
          emojiLevelSelect.value = 'MEDIUM';
        }

        if (res.contexts) {
          ctxWeather.checked = !!res.contexts.weather;
          ctxWeatherText.value = res.contexts.weatherText || '환절기 감기 조심하세요';
          ctxNewMenu.checked = !!res.contexts.newMenu;
          ctxNewMenuText.value = res.contexts.newMenuText || '';
          ctxMonthlyReorder.checked = !!res.contexts.monthlyReorder;
          ctxMonthlyReorderText.value = res.contexts.monthlyReorderText || '이번 달에도 언제든 생각나실 때 찾아주세요, 첫 주문처럼 정성껏 모시겠습니다!';
          ctxDelay.checked = !!res.contexts.delayApology;
          ctxReviewEvent.checked = !!res.contexts.reviewEvent;
        }
      }
    );
  }
  loadSettings();

  // 4. 설정 저장하기
  saveSettingsBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const storeName = storeNameInput.value.trim();
    const persona = document.querySelector('input[name="persona"]:checked')?.value || 'CHEF';
    const charLimit = Number(charLimitSelect.value) || 300;
    const emojiLevel = emojiLevelSelect.value || 'MEDIUM';
    const autoSubmit = document.querySelector('input[name="autoSubmit"]:checked')?.value === 'true';

    const contexts = {
      weather: ctxWeather.checked,
      weatherText: ctxWeatherText.value.trim(),
      newMenu: ctxNewMenu.checked,
      newMenuText: ctxNewMenuText.value.trim(),
      monthlyReorder: ctxMonthlyReorder.checked,
      monthlyReorderText: ctxMonthlyReorderText.value.trim(),
      delayApology: ctxDelay.checked,
      reviewEvent: ctxReviewEvent.checked
    };

    chrome.storage.local.set(
      { apiKey, storeName, persona, charLimit, emojiLevel, autoSubmit, contexts },
      () => {
        saveSettingsBtn.innerText = '✅ 저장 완료!';
        saveSettingsBtn.style.background = '#16a34a';

        if (apiKey) {
          apiStatusBadge.className = 'status-badge badge-success';
          apiStatusBadge.innerText = '연동 완료';
        } else {
          apiStatusBadge.className = 'status-badge badge-warning';
          apiStatusBadge.innerText = '키 등록 필요';
        }

        setTimeout(() => {
          saveSettingsBtn.innerText = '💾 설정 저장하기';
          saveSettingsBtn.style.background = '';
        }, 1500);
      }
    );
  });

  // 5. 테스트존 샘플 프리뷰 업데이트
  function updateSamplePreview() {
    const selectedKey = sampleSelect.value;
    const sample = samplePresets[selectedKey];
    if (sample) {
      const extraTags = [];
      if (sample.platform === 'NAVER') {
        if (sample.isTakeout) extraTags.push('포장주문');
        else extraTags.push('매장방문');
        if (sample.visitCount) extraTags.push(`${sample.visitCount}번째 방문`);
      }
      const tagStr = extraTags.length > 0 ? ` [${extraTags.join(' · ')}]` : '';
      if (!sample.text) {
        sampleReviewText.innerText = `[별점: ${sample.rating}점 / 주문: ${sample.menu}]${tagStr}\n(※ 손님이 리뷰 글 없이 별점만 등록함)`;
      } else {
        sampleReviewText.innerText = `[별점: ${sample.rating}점 / 주문: ${sample.menu}]${tagStr}\n"${sample.text}"`;
      }
    }
  }

  sampleSelect.addEventListener('change', updateSamplePreview);
  updateSamplePreview();

  // 6. 테스트존 즉석 답글 생성 실행
  runTestBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('⚠️ 먼저 [답글 맞춤 설정] 탭에서 구글 Gemini API 키를 입력하고 저장해 주세요!');
      tabBtnSettings.click();
      apiKeyInput.focus();
      return;
    }

    const storeName = storeNameInput.value.trim() || '우리 동네 맛집';
    const persona = document.querySelector('input[name="persona"]:checked')?.value || 'CHEF';
    const contexts = {
      weather: ctxWeather.checked,
      weatherText: ctxWeatherText.value.trim(),
      newMenu: ctxNewMenu.checked,
      newMenuText: ctxNewMenuText.value.trim(),
      monthlyReorder: ctxMonthlyReorder.checked,
      monthlyReorderText: ctxMonthlyReorderText.value.trim(),
      delayApology: ctxDelay.checked,
      reviewEvent: ctxReviewEvent.checked
    };

    const charLimit = Number(charLimitSelect.value) || 300;
    const emojiLevel = emojiLevelSelect.value || 'MEDIUM';
    const selectedSample = samplePresets[sampleSelect.value];

    runTestBtn.disabled = true;
    runTestBtn.innerText = '⚡ AI 분석 & 답글 작성 중...';
    testResultCard.style.display = 'none';

    const startTime = Date.now();

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: 'GENERATE_REVIEW_REPLY',
            payload: {
              apiKey,
              storeName,
              persona,
              charLimit,
              emojiLevel,
              contexts,
              reviewData: selectedSample
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

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      testResultText.innerText = response.reply;
      testTimeTaken.innerText = `⚡ ${elapsed}초 만에 초고속 생성 완료 (공백 포함 ${response.reply.length}자 / 최대 ${charLimit}자 제한)`;
      testResultCard.style.display = 'block';

    } catch (err) {
      alert(`❌ 테스트 오류:\n${err.message}`);
    } finally {
      runTestBtn.disabled = false;
      runTestBtn.innerText = '✨ AI 맞춤 답글 생성하기';
    }
  });

  // 7. 결과 복사 버튼
  copyResultBtn.addEventListener('click', () => {
    const textToCopy = testResultText.innerText;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      copyResultBtn.innerText = '✅ 복사됨!';
      setTimeout(() => {
        copyResultBtn.innerText = '📋 복사하기';
      }, 1500);
    });
  });

});
