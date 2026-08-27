const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ekpitdijyfnsjhdpaqde.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcGl0ZGlqeWZuc2poZHBhcWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDA3MTMsImV4cCI6MjEwMzMxNjcxM30.k4vEtxE5XEY8oBolYYvw9EWANDX3zIu2mjZEscvn6pc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertProfile() {
  const fakeUserId = '00000000-0000-0000-0000-' + Date.now().toString().slice(-12);
  const email = `test_owner_${Date.now().toString().slice(-4)}@trademe.kr`;
  const ownerName = '김동욱 사장님 (테스트)';
  const storeName = '마라위크 (양산 북정점)';

  console.log(`\n🚀 [Supabase profiles 테이블 직접 레코드 입력 시도]`);

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: fakeUserId,
      email,
      owner_name: ownerName,
      store_name: storeName,
      business_number: '4074913710',
      phone: '01048548777',
    })
    .select();

  if (error) {
    console.log(`❌ profiles insert 결과: ${error.message}`);
  } else {
    console.log(`🎉 [테스트 성공!] profiles 테이블에 신규 사장님 레코드가 성공적으로 꽂혔습니다!`);
    console.log(`📊 저장된 프로필 데이터:`, data);
  }
}

testInsertProfile();
