-- ==========================================
-- 📦 TradeMe Supabase Full Database Backup
-- Timestamp: 2026-09-14T08:53:08.735Z
-- ==========================================

-- ------------------------------------------
-- Table: stores (3 rows)
-- ------------------------------------------
INSERT INTO stores (id, owner_name, store_name, category, category_name, address, lat, lng, phone, is_verified, is_exchange_active, operating_hours, store_image_url, rating, review_count, created_at, user_id, is_menu_testing, menu_test_title, menu_test_reward, menu_test_quota, menu_test_applicant_count, menu_test_feedback_type, menu_test_description, break_time_hours, menu_test_image_url, trade_count) VALUES ('store-1789105430382', '권영민', '돈돈돈', 'PUB', '소상공인', '백호로54', 35.31886, 129.0008849, '01012345678', TRUE, TRUE, '17:00 - 익일 01:00', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105463292_g572u7.jpg', 5, 0, '2026-09-11T05:43:50.102999+00:00', '5fa383c4-c87d-4ca3-b1ac-912061179f83', TRUE, '4만원 이용권', '4만원권사용 가능하면 남은 금액은 현금으로 돌려드리지않습니다', 5, 1, 'BLOG_SNS', NULL, '17:00 - 익일 01:00', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105463292_g572u7.jpg', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO stores (id, owner_name, store_name, category, category_name, address, lat, lng, phone, is_verified, is_exchange_active, operating_hours, store_image_url, rating, review_count, created_at, user_id, is_menu_testing, menu_test_title, menu_test_reward, menu_test_quota, menu_test_applicant_count, menu_test_feedback_type, menu_test_description, break_time_hours, menu_test_image_url, trade_count) VALUES ('store-1789047644774', '김영인', '지안뷰티', 'BEAUTY', '소상공인', '양산시 물금읍 백호로 60', 35.3184631, 129.0013583, '01093978773', TRUE, TRUE, '10:00 - 22:00', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', 5, 0, '2026-09-10T13:40:44.947777+00:00', 'ba2edd88-2867-4d9d-bb9b-ebcb3681acc2', FALSE, NULL, NULL, 3, 0, 'BOTH', NULL, '10:00 - 22:00', NULL, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO stores (id, owner_name, store_name, category, category_name, address, lat, lng, phone, is_verified, is_exchange_active, operating_hours, store_image_url, rating, review_count, created_at, user_id, is_menu_testing, menu_test_title, menu_test_reward, menu_test_quota, menu_test_applicant_count, menu_test_feedback_type, menu_test_description, break_time_hours, menu_test_image_url, trade_count) VALUES ('store-1788929684138', '김동욱', '마라위크', 'FOOD', '외식업', '북정서길25 101호', 35.3594181, 129.0418871, '01048548777', TRUE, TRUE, '11:00 - 23:00', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1788932170131_qrizzi.jpg', 5, 0, '2026-09-09T04:54:42.499269+00:00', '2ed96d41-75f8-4033-8f0a-447d5c5d0171', TRUE, '마라소고기국밥', '신메뉴 2인 무료 시식 (음료 포함)', 5, 0, 'BLOG_SNS', NULL, '11:00 - 23:00', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789346953194_arl76r.jpg', 0) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: items (5 rows)
-- ------------------------------------------
INSERT INTO items (id, store_id, title, estimated_price, description, image_url, item_type, is_available, created_at) VALUES ('item-1788956160242-r4yt', 'store-1788929684138', '마라탕& 꿔바로우 1인세트', 18000, '<!--fm:PICKUP,DELIVERY,ON_SITE-->사장님들도 혜택 누리자구요!', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'FOOD', TRUE, '2026-09-10T23:53:56.351673+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, store_id, title, estimated_price, description, image_url, item_type, is_available, created_at) VALUES ('voucher-store-1788929684138', 'store-1788929684138', '마라위크 30,000원 상생 이용권', 30000, '<!--fm:PICKUP,ON_SITE-->전 메뉴 및 서비스 자유 선택 이용 (차액 결제 가능)', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1788932170131_qrizzi.jpg', 'VOUCHER', TRUE, '2026-09-10T23:53:56.351673+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, store_id, title, estimated_price, description, image_url, item_type, is_available, created_at) VALUES ('item-1789105962007-3zp2', 'store-1789105430382', '새우튀김', 35000, '<!--fm:PICKUP,ON_SITE-->생새우튀김', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105925467_uyamtb.jpg', 'FOOD', TRUE, '2026-09-11T05:54:11.377742+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, store_id, title, estimated_price, description, image_url, item_type, is_available, created_at) VALUES ('item-1789106039652-rt4e', 'store-1789105430382', '육전', 30000, '<!--fm:PICKUP,ON_SITE-->육전', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789106012585_zocm1i.jpg', 'FOOD', TRUE, '2026-09-11T05:54:11.377742+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, store_id, title, estimated_price, description, image_url, item_type, is_available, created_at) VALUES ('voucher-store-1789105430382', 'store-1789105430382', '돈돈돈 30,000원 상생 이용권', 30000, '<!--fm:PICKUP,ON_SITE,DELIVERY-->전 메뉴 및 서비스 자유 선택 이용 (차액 결제 가능)', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105463292_g572u7.jpg', 'VOUCHER', TRUE, '2026-09-11T05:54:11.377742+00:00') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: trades (1 rows)
-- ------------------------------------------
INSERT INTO trades (id, requester_store_id, target_store_id, requester_item_id, target_item_id, price_difference, pickup_time, status, created_at, is_poke, message, trade_type, trade_fulfillment, requester_store_name, requester_owner_name, requester_item_title, requester_item_image_url, requester_item_price, target_store_name, target_owner_name, target_item_title, target_item_image_url, target_item_price, updated_at) VALUES ('trade-1789107786490', 'store-1788929684138', 'store-1789105430382', 'voucher-store-1788929684138', 'voucher-store-1789105430382', 0, '언제든 여유 생기실 때 (찔러보기 맞춤)', 'PENDING', '2026-09-11T06:23:05.921091+00:00', TRUE, '사장님 생각있으시면 거래해요~~', 'VOUCHER', '🛍️ 직접 방문 픽업 교환', '마라위크', '김동욱', '마라위크 30,000원 상생 이용권', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1788932170131_qrizzi.jpg', 30000, '돈돈돈', '권영민', '돈돈돈 30,000원 상생 이용권', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105463292_g572u7.jpg', 30000, '2026-09-11T06:23:05.921091+00:00') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: profiles (3 rows)
-- ------------------------------------------
INSERT INTO profiles (id, email, owner_name, store_name, business_number, phone, created_at, store_image_url, address) VALUES ('2ed96d41-75f8-4033-8f0a-447d5c5d0171', 'hanmaner@naver.com', '김동욱', '마라위크', '4074913710', '01048548777', '2026-09-09T04:54:41.220758+00:00', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1788932170131_qrizzi.jpg', '북정서길25 101호') ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, email, owner_name, store_name, business_number, phone, created_at, store_image_url, address) VALUES ('ba2edd88-2867-4d9d-bb9b-ebcb3681acc2', 't01093978773@gmail.com', '김영인', '지안뷰티', '7527200277', '01093978773', '2026-09-10T13:40:43.637073+00:00', NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, email, owner_name, store_name, business_number, phone, created_at, store_image_url, address) VALUES ('5fa383c4-c87d-4ca3-b1ac-912061179f83', 'hanmaners@gmail.com', '권영민', '돈돈돈', '1088178306', '01012345678', '2026-09-11T05:43:48.727482+00:00', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105463292_g572u7.jpg', '백호로54') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: menu_test_campaigns (2 rows)
-- ------------------------------------------
INSERT INTO menu_test_campaigns (id, store_id, title, reward, quota, feedback_type, image_url, description, status, created_at) VALUES ('campaign-1789106260869-uu0r', 'store-1789105430382', '4만원 이용권', '4만원권사용 가능하면 남은 금액은 현금으로 돌려드리지않습니다', 5, 'BLOG_SNS', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105463292_g572u7.jpg', '', 'RECRUITING', '2026-09-11T05:57:40.572549+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_test_campaigns (id, store_id, title, reward, quota, feedback_type, image_url, description, status, created_at) VALUES ('campaign-1789346982067-sic1', 'store-1788929684138', '마라소고기국밥', '신메뉴 2인 무료 시식 (음료 포함)', 5, 'BLOG_SNS', 'https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789346953194_arl76r.jpg', '', 'RECRUITING', '2026-09-14T00:49:42.061611+00:00') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: menu_test_applications (1 rows)
-- ------------------------------------------
INSERT INTO menu_test_applications (id, store_id, applicant_user_id, applicant_store_name, applicant_owner_name, applicant_phone, sns_url, message, feedback_type, status, created_at, campaign_id, campaign_title) VALUES ('app-1789106399626', 'store-1789105430382', NULL, '마라위크', '김동욱', '01048548777', 'https://blog/naver.com/waterlife', '체험 후 빠른 후기 올리겠습니다!!', 'BLOG_SNS', 'ACCEPTED', '2026-09-11T05:59:59.048216+00:00', 'campaign-1789106260869-uu0r', '4만원 이용권') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: chat_messages (11 rows)
-- ------------------------------------------
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048432354', 'store-1789047644774', 'store-1788929684138', '김동욱', 'cp===채팅오나?', TRUE, '2026-09-10T13:53:53.754732+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048504177', 'store-1788929684138', 'store-1789047644774', '김영인', '오네 ㅋㅋ', TRUE, '2026-09-10T13:55:04.393424+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048516262', 'store-1789047644774', 'store-1788929684138', '김동욱', '오 이건 잘되네', TRUE, '2026-09-10T13:55:17.654456+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048534710', 'store-1788929684138', 'store-1789047644774', '김영인', 'ㅋㅋㅋ 우째 만드노', TRUE, '2026-09-10T13:55:34.829907+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048540103', 'store-1788929684138', 'store-1789047644774', '김영인', '재주도 젛다', TRUE, '2026-09-10T13:55:40.214049+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048550626', 'store-1789047644774', 'store-1788929684138', '김동욱', '바이브코딩', TRUE, '2026-09-10T13:55:52.015328+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048554325', 'store-1789047644774', 'store-1788929684138', '김동욱', '어제 얘기한거지', TRUE, '2026-09-10T13:55:55.708422+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048629454', 'store-1789047644774', 'store-1788929684138', '김동욱', '누나도 서비스물품 등록 해놔라', TRUE, '2026-09-10T13:57:10.84565+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789048647254', 'store-1788929684138', 'store-1789047644774', '김영인', '웅 알게따', TRUE, '2026-09-10T13:57:27.382219+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789107786596', 'store-1789105430382', 'store-1788929684138', '김동욱', '<!--TRADE_DATA:{"tradeId":"trade-1789107786490","myStoreId":"store-1788929684138","targetStoreId":"store-1789105430382","myStoreName":"마라위크","myOwnerName":"김동욱","targetStoreName":"돈돈돈","targetOwnerName":"권영민","myItemTitle":"마라위크 30,000원 상생 이용권","myItemPrice":30000,"myItemImageUrl":"https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1788932170131_qrizzi.jpg","targetItemTitle":"돈돈돈 30,000원 상생 이용권","targetItemPrice":30000,"targetItemImageUrl":"https://ekpitdijyfnsjhdpaqde.supabase.co/storage/v1/object/public/store-images/stores/store_1789105463292_g572u7.jpg","diffText":"차액 0원 (동일가 교환)","tradeFulfillment":"🛍️ 직접 방문 픽업 교환","pickupTime":"언제든 여유 생기실 때 (찔러보기 맞춤)","memoMessage":"사장님 생각있으시면 거래해요~~","tradeType":"VOUCHER","isPoke":true}-->[1:1 물물교환 제안]
제공 품목: 마라위크 30,000원 상생 이용권 (30,000원)
희망 품목: 돈돈돈 30,000원 상생 이용권 (30,000원)
이용 방식: 🛍️ 직접 방문 픽업 교환
정산: 차액 0원 (동일가 교환)
희망 시각: 언제든 여유 생기실 때 (찔러보기 맞춤)
메모: 사장님 생각있으시면 거래해요~~', TRUE, '2026-09-11T06:23:06.008548+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO chat_messages (id, trade_id, sender_store_id, sender_name, message, is_me, created_at) VALUES ('msg-1789108003951', 'store-1788929684138', 'store-1789105430382', '권영민', '🎉 축하합니다! [4만원 이용권] 1호 시식단으로 최종 선정되셨습니다! 편하신 방문 일시와 동반 인원을 조율해 주세요.', TRUE, '2026-09-11T06:26:43.639391+00:00') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: community_posts (1 rows)
-- ------------------------------------------
INSERT INTO community_posts (id, store_id, author_name, store_name, is_anonymous, category, title, content, image_url, urgent_exchange_item, likes_count, comments_count, created_at) VALUES ('post_1789047547360_xtyjx', 'store-1788929684138', '김동욱 사장님', '마라위크', FALSE, 'DAILY_TALK', '대목전인가요?', '오늘은 많이 조용하네요', NULL, NULL, 2, 2, '2026-09-10T13:39:08.78977+00:00') ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Table: community_comments (2 rows)
-- ------------------------------------------
INSERT INTO community_comments (id, post_id, store_id, author_name, store_name, is_anonymous, content, created_at) VALUES ('cmt_1789047627988_z2u1j', 'post_1789047547360_xtyjx', 'store-1788929684138', '김동욱 사장님', '마라위크', FALSE, '흠..', '2026-09-10T13:40:29.407431+00:00') ON CONFLICT (id) DO NOTHING;
INSERT INTO community_comments (id, post_id, store_id, author_name, store_name, is_anonymous, content, created_at) VALUES ('cmt_1789339279175_1a6za', 'post_1789047547360_xtyjx', 'store-1789105430382', '권영민 사장님', '돈돈돈', FALSE, '좀 빠른듯해요', '2026-09-13T22:41:19.420791+00:00') ON CONFLICT (id) DO NOTHING;

