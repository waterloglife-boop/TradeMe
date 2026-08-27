const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ekpitdijyfnsjhdpaqde.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcGl0ZGlqeWZuc2poZHBhcWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDA3MTMsImV4cCI6MjEwMzMxNjcxM30.k4vEtxE5XEY8oBolYYvw9EWANDX3zIu2mjZEscvn6pc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixExistingNullStores() {
  const profileId = '26111ad6-a495-4d85-ab2e-0455de9e9284';
  
  console.log(`\n🔧 [기존 stores 테이블의 user_id = NULL 행 100% 자동 복구 시작]`);
  console.log(`- 대입할 김동욱 사장님 Profile UUID: ${profileId}`);

  const { data, error } = await supabase
    .from('stores')
    .update({ user_id: profileId })
    .is('user_id', null)
    .select();

  if (error) {
    console.error('❌ stores user_id 업데이트 실패:', error.message);
  } else {
    console.log(`🎉 [수정 완료!] 기존 user_id = NULL 이었던 ${data?.length || 0}개 매장이 김동욱 사장님 UUID (${profileId}) 로 100% 연결되었습니다!`);
    console.log(`📊 수정된 매장 목록:`, data);
  }
}

fixExistingNullStores();
