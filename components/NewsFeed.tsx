'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: string;
  createdAt: any;
  likesCount: number;
}

interface Comment {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  createdAt: any;
}

export default function NewsFeed() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  
  // State for commenting
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  
  // Track liked posts in local storage to prevent multi-liking
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load liked posts from local storage
    const savedLikes = localStorage.getItem('tbs_liked_posts');
    if (savedLikes) {
      setLikedPosts(JSON.parse(savedLikes));
    }

    // Real-time listener for posts
    const q = query(collection(db, 'news_posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData: NewsPost[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as NewsPost);
      });
      setPosts(postsData);
      setLoading(false);
    });

    // Real-time listener for all comments (can be optimized to fetch per post in production)
    const qComments = query(collection(db, 'news_comments'), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const commentsData: Record<string, Comment[]> = {};
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Comment;
        if (!commentsData[data.postId]) {
          commentsData[data.postId] = [];
        }
        commentsData[data.postId].push(data);
      });
      setComments(commentsData);
    });

    return () => {
      unsubscribePosts();
      unsubscribeComments();
    };
  }, []);

  const handleLike = async (postId: string) => {
    if (likedPosts[postId]) return; // Đã like rồi

    try {
      const postRef = doc(db, 'news_posts', postId);
      await updateDoc(postRef, {
        likesCount: increment(1)
      });
      
      const newLikedPosts = { ...likedPosts, [postId]: true };
      setLikedPosts(newLikedPosts);
      localStorage.setItem('tbs_liked_posts', JSON.stringify(newLikedPosts));
    } catch (error) {
      console.error("Lỗi khi thả tim:", error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentName.trim() || !commentText.trim()) {
      alert("Vui lòng nhập tên và nội dung bình luận!");
      return;
    }

    try {
      await addDoc(collection(db, 'news_comments'), {
        postId,
        authorName: commentName,
        content: commentText,
        createdAt: serverTimestamp()
      });
      setCommentText(''); // Clear text, keep name
      // Optionally save name to local storage
      localStorage.setItem('tbs_guest_name', commentName);
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error);
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem('tbs_guest_name');
    if (savedName) setCommentName(savedName);
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Vừa xong';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
        <span className="text-4xl block mb-4">📰</span>
        <h3 className="text-xl font-bold text-slate-700">Chưa có bản tin nào</h3>
        <p className="text-slate-500 mt-2">Ban quản trị sẽ sớm cập nhật thông tin mới nhất tại đây.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-xl shadow-inner">
              👑
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{post.author || 'Admin'}</h4>
              <p className="text-xs text-slate-400 font-medium">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#0284C7] mb-2">{post.title}</h3>
            <div className="text-slate-600 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: post.content }}></div>
          </div>

          {/* Image (if any) */}
          {post.imageUrl && (
            <div className="mb-4 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
              <img src={post.imageUrl} alt="Post image" className="w-full h-auto object-cover max-h-[400px]" />
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-between items-center py-2 border-b border-slate-50 text-sm text-slate-500 font-medium mb-2">
            <span>{post.likesCount || 0} lượt thích</span>
            <span>{(comments[post.id] || []).length} bình luận</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button 
              onClick={() => handleLike(post.id)}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                likedPosts[post.id] 
                  ? 'bg-pink-50 text-pink-600 border border-pink-100' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className={`fa-${likedPosts[post.id] ? 'solid text-pink-500' : 'regular'} fa-heart text-lg`}></i> 
              {likedPosts[post.id] ? 'Đã Thích' : 'Thích'}
            </button>
            <button 
              onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <i className="fa-regular fa-comment text-lg"></i> Bình luận
            </button>
          </div>

          {/* Comments Section */}
          {activeCommentPostId === post.id && (
            <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
              {/* List comments */}
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {comments[post.id]?.length > 0 ? (
                  comments[post.id].map(c => (
                    <div key={c.id} className="bg-slate-50 p-3 rounded-2xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-slate-800">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-slate-600 text-sm">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-400 py-2">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                )}
              </div>
              
              {/* Comment Input */}
              <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <input 
                  type="text"
                  placeholder="Tên của bạn (Học sinh/Phụ huynh)..."
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Viết bình luận..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                  <button 
                    onClick={() => handleComment(post.id)}
                    className="px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-sm transition-colors"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ))}
    </div>
  );
}
