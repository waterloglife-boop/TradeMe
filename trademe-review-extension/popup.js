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
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
  const storeName1 = document.getElementById('storeName1');
  const storeName2 = document.getElementById('storeName2');
  const storeName3 = document.getElementById('storeName3');
  const autoDetectStore = document.getElementById('autoDetectStore');
  const emojiLevelSelect = document.getElementById('emojiLevelSelect');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  // ========================================================
  // A. 인증 상태 렌더링 (로그인 화면 vs 메인 화면 전환)
  // ========================================================
  function renderAuthState(tradeMeAuth) {
    if (tradeMeAuth && tradeMeAuth.isLoggedIn) {
      viewAuth.style.display = 'none';
      viewMain.style.display = 'block';

      const sName = tradeMeAuth.storeName || (storeName1 ? storeName1.value : '') || '내 매장';
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
  // C. 설정 관리 (초간결 5대 핵심 설정만 유지)
  // ========================================================

  // 1. API Key 보기/숨기기 토글
  toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.innerText = '🙈';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.innerText = '👁️';
    }
  });

  // 2. 기존 저장된 설정 불러오기
  function loadSettings() {
    chrome.storage.local.get(
      ['tradeMeAuth', 'apiKey', 'storeName', 'storeNames', 'activeStoreIndex', 'autoDetectStore', 'persona', 'emojiLevel', 'autoSubmit'],
      (res) => {
        renderAuthState(res.tradeMeAuth);

        try {
          const appVersionText = document.getElementById('appVersionText');
          if (appVersionText && chrome?.runtime?.getManifest) {
            const manifest = chrome.runtime.getManifest();
            appVersionText.innerText = `v${manifest.version || '1.4.6'} (트레이드미 회원 전용)`;
          }
        } catch (e) {}

        if (res.apiKey) {
          apiKeyInput.value = res.apiKey;
        }

        // 샵인샵 매장명 불러오기
        if (res.storeNames && Array.isArray(res.storeNames)) {
          if (storeName1) storeName1.value = res.storeNames[0] || '';
          if (storeName2) storeName2.value = res.storeNames[1] || '';
          if (storeName3) storeName3.value = res.storeNames[2] || '';
        } else if (res.storeName) {
          if (storeName1) storeName1.value = res.storeName;
        } else if (res.tradeMeAuth && res.tradeMeAuth.storeName) {
          if (storeName1) storeName1.value = res.tradeMeAuth.storeName;
        }

        const activeIdx = res.activeStoreIndex !== undefined ? res.activeStoreIndex : 0;
        const activeRadio = document.querySelector(`input[name="activeStoreIndex"][value="${activeIdx}"]`);
        if (activeRadio) activeRadio.checked = true;

        if (autoDetectStore) {
          autoDetectStore.checked = res.autoDetectStore !== undefined ? !!res.autoDetectStore : true;
        }

        if (res.persona) {
          const radio = document.querySelector(`input[name="persona"][value="${res.persona}"]`);
          if (radio) radio.checked = true;
        }

        if (res.emojiLevel) {
          emojiLevelSelect.value = res.emojiLevel;
        } else {
          emojiLevelSelect.value = 'MEDIUM';
        }
      }
    );
  }
  loadSettings();

  // 3. 설정 저장하기
  saveSettingsBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const s1 = storeName1 ? storeName1.value.trim() : '';
    const s2 = storeName2 ? storeName2.value.trim() : '';
    const s3 = storeName3 ? storeName3.value.trim() : '';
    const storeNames = [s1, s2, s3];
    const activeStoreIndex = Number(document.querySelector('input[name="activeStoreIndex"]:checked')?.value || 0);
    const storeName = storeNames[activeStoreIndex] || s1 || s2 || s3 || '내 매장';
    const isAutoDetect = autoDetectStore ? autoDetectStore.checked : true;

    const persona = document.querySelector('input[name="persona"]:checked')?.value || 'CHEF';
    const charLimit = 300; // 쿠팡이츠·배민 기준 300자 이하 기본 고정
    const emojiLevel = emojiLevelSelect.value || 'MEDIUM';

    chrome.storage.local.set(
      {
        apiKey,
        storeName,
        storeNames,
        activeStoreIndex,
        autoDetectStore: isAutoDetect,
        persona,
        charLimit,
        emojiLevel
      },
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

});
