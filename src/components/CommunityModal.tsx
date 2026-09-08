import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  Heart,
  Share2,
  Trash2,
  Loader2,
  Send,
  Camera,
  ArrowRight,
  Handshake,
  MessageCircle,
  HelpCircle,
  Zap,
  Filter,
  RefreshCw,
  Store as StoreIcon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { CommunityCategory, CommunityPost, CommunityComment, Store } from '../types/trade';
import {
  fetchCommunityPosts,
  fetchPostComments,
  createPostComment,
  likeCommunityPost,
  deleteCommunityPost,
  subscribeToCommunity,
} from '../lib/supabase';
import { CreateCommunityPostModal } from './CreateCommunityPostModal';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: Store;
  userOwnerName: string;
  stores: Store[];
  onOpenProposalForStore?: (targetStore: Store, urgentItem?: string) => void;
  onOpenChatForStore?: (targetStore: Store) => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  myStore,
  userOwnerName,
  stores,
  onOpenProposalForStore,
  onOpenChatForStore,
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | CommunityCategory>('ALL');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active comments drawer/accordion map: { [postId: string]: boolean }
  const [openCommentsMap, setOpenCommentsMap] = useState<{ [postId: string]: boolean }>({});
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: CommunityComment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentAnonymous, setCommentAnonymous] = useState<{ [postId: string]: boolean }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [postId: string]: boolean }>({});

  // Fetch posts
  const loadPosts = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const fetched = await fetchCommunityPosts(activeCategory === 'ALL' ? undefined : activeCategory);
    setPosts(fetched);
    if (showLoading) setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadPosts(true);
      const unsubscribe = subscribeToCommunity(() => {
        loadPosts(false);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, activeCategory]);

  if (!isOpen) return null;

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);
      if (diffSec < 60) return '방금 전';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}분 전`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}시간 전`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay}일 전`;
    } catch (e) {
      return '최근';
    }
  };

  // Toggle comments
  const handleToggleComments = async (postId: string) => {
    const isNowOpen = !openCommentsMap[postId];
    setOpenCommentsMap((prev) => ({ ...prev, [postId]: isNowOpen }));

    if (isNowOpen && !commentsMap[postId]) {
      const comments = await fetchPostComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
    }
  };

  // Like post
  const handleLike = async (post: CommunityPost) => {
    const newLikes = await likeCommunityPost(post.id, post.likesCount);
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likesCount: newLikes } : p))
    );
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    const ok = await deleteCommunityPost(postId);
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  // Submit comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    const isAnon = !!commentAnonymous[postId];
    const author = isAnon ? '익명의 사장님' : `${userOwnerName || '김동욱'} 사장님`;
    const store = isAnon ? '북정동 이웃 매장' : (myStore.storeName || '마라위크');

    const res = await createPostComment({
      postId,
      storeId: myStore.id,
      authorName: author,
      storeName: store,
      isAnonymous: isAnon,
      content: text,
    });

    setSubmittingComment((prev) => ({ ...prev, [postId]: false }));

    if (res.success && res.data) {
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data!],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      // Update post comment count
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
    }
  };

  // Find target store for action
  const findStoreByPost = (post: CommunityPost): Store | undefined => {
    if (post.storeId) {
      return stores.find((s) => s.id === post.storeId);
    }
    return undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-orange-100 flex flex-col h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner">
              ☕
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">사장님 사랑방</h2>
                <span className="bg-white/20 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full backdrop-blur">
                  양산 북정동 & 인근 상권
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium">
                오늘 장사 넋두리, 마감 로스 제로 번개교환, 실시간 정보 교류
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-white text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>글쓰기</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 py-2.5 bg-amber-50/50 border-b border-orange-100 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                activeCategory === 'ALL'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              전체
            </button>

            <button
              onClick={() => setActiveCategory('DAILY_TALK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                activeCategory === 'DAILY_TALK'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>💬</span>
              <span>오늘 장사 톡</span>
            </button>

            <button
              onClick={() => setActiveCategory('URGENT_TRADE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                activeCategory === 'URGENT_TRADE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>🚨</span>
              <span>마감 번개교환</span>
            </button>

            <button
              onClick={() => setActiveCategory('TIPS_QNA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                activeCategory === 'TIPS_QNA'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>💡</span>
              <span>동네 꿀팁·질문</span>
            </button>
          </div>

          <button
            onClick={() => {
              setIsRefreshing(true);
              loadPosts(false).then(() => setIsRefreshing(false));
            }}
            title="새로고침"
            className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-100/50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        </div>

        {/* Posts Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-50/50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="text-xs font-bold">사랑방 소식을 불러오는 중...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 px-4 bg-white rounded-3xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-3xl mb-3 shadow-inner">
                ☕
              </div>
              <h3 className="text-base font-black text-gray-800 mb-1">
                아직 등록된 이야기가 없습니다
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-5 leading-relaxed">
                오늘 하루 장사 어떠셨나요? 마감 전 남은 재고가 있으신가요?
                이웃 사장님들과 첫 번째 소통을 시작해 보세요!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>첫 번째 이야기 남기기</span>
              </button>
            </div>
          ) : (
            posts.map((post) => {
              const targetStore = findStoreByPost(post);
              const isMine = post.storeId === myStore.id;
              const isCommentsOpen = !!openCommentsMap[post.id];
              const comments = commentsMap[post.id] || [];

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                          post.isAnonymous
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        }`}
                      >
                        {post.isAnonymous ? '🤫' : '🏬'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-gray-900">
                            {post.isAnonymous ? '익명의 사장님' : post.storeName}
                          </span>
                          {!post.isAnonymous && (
                            <span className="text-[11px] text-gray-500 font-medium">
                              ({post.authorName})
                            </span>
                          )}
                          {isMine && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-1.5 py-0.5 rounded-full">
                              내 글
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span>{formatTimeAgo(post.createdAt)}</span>
                          <span>·</span>
                          <span
                            className={`font-bold ${
                              post.category === 'DAILY_TALK'
                                ? 'text-emerald-600'
                                : post.category === 'URGENT_TRADE'
                                ? 'text-rose-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {post.category === 'DAILY_TALK'
                              ? '💬 오늘장사 톡'
                              : post.category === 'URGENT_TRADE'
                              ? '🚨 마감 번개교환'
                              : '💡 동네 꿀팁·질문'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isMine && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition"
                        title="게시글 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="px-4 pb-3 space-y-2">
                    <h4 className="text-sm font-black text-gray-900 leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {post.content}
                    </p>

                    {/* Attached Image */}
                    {post.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 max-h-64 bg-gray-50 flex items-center justify-center">
                        <img
                          src={post.imageUrl}
                          alt="첨부 이미지"
                          className="max-h-64 w-auto object-cover"
                        />
                      </div>
                    )}

                    {/* 🚨 Special Box for URGENT_TRADE */}
                    {post.category === 'URGENT_TRADE' && post.urgentExchangeItem && (
                      <div className="mt-3 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-black text-rose-700 flex items-center gap-1">
                            <span>🚨</span>
                            <span>마감 번개교환 희망 품목 (로스 제로)</span>
                          </div>
                          <div className="text-xs font-black text-gray-900">
                            {post.urgentExchangeItem}
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-2">
                          {targetStore && !isMine && (
                            <>
                              <button
                                onClick={() => {
                                  if (onOpenProposalForStore) {
                                    onOpenProposalForStore(targetStore, post.urgentExchangeItem);
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-sm flex items-center gap-1 transition"
                              >
                                <Handshake className="w-3.5 h-3.5" />
                                <span>즉시 교환 제안</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (onOpenChatForStore) {
                                    onOpenChatForStore(targetStore);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-orange-500" />
                                <span>1:1 톡</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions (Like & Comment) */}
                  <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post)}
                        className="flex items-center gap-1.5 font-bold hover:text-rose-600 transition active:scale-110"
                      >
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-50" />
                        <span>토닥임 {post.likesCount}</span>
                      </button>

                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1.5 font-bold hover:text-orange-600 transition"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span>댓글 {post.commentsCount}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="text-[11px] font-extrabold text-orange-600 hover:underline"
                    >
                      {isCommentsOpen ? '댓글 닫기 ▲' : '댓글 쓰기 ▼'}
                    </button>
                  </div>

                  {/* Comments Section (Expandable) */}
                  {isCommentsOpen && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3 animate-fade-in">
                      {/* Comments List */}
                      {comments.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {comments.map((cmt) => (
                            <div
                              key={cmt.id}
                              className="p-2.5 bg-white rounded-xl border border-gray-200/70 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-black text-gray-800">
                                  {cmt.isAnonymous ? '🤫 익명의 사장님' : `🏬 ${cmt.storeName}`}
                                </span>
                                <span className="text-gray-400">{formatTimeAgo(cmt.createdAt)}</span>
                              </div>
                              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                {cmt.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs text-gray-400">
                          첫 번째 따뜻한 응원 댓글을 남겨보세요!
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!commentAnonymous[post.id]}
                              onChange={(e) =>
                                setCommentAnonymous((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.checked,
                                }))
                              }
                              className="rounded text-orange-500 focus:ring-orange-400"
                            />
                            <span>익명으로 댓글 남기기</span>
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id);
                              }
                            }}
                            placeholder="따뜻한 한마디를 남겨주세요..."
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center"
                          >
                            {submittingComment[post.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreateCommunityPostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        myStore={myStore}
        userOwnerName={userOwnerName}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
        }}
      />
    </div>
  );
};
