import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';
import { loadComments } from './comments.js';

const API_URL = "http://127.0.0.1:3000";

export async function loadPosts() {
  const response = await fetch(`${API_URL}/posts`);
  const posts = await response.json();
  const postList = document.getElementById("postList");
  postList.innerHTML = "";
  posts.forEach((post) => createPostElement(post));
}

export async function savePost(title, content, imageFile) {
  let imageUrl = null;
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData?.session) {
    alert("로그인이 필요합니다!");
    return;
  }
  const access_token = sessionData.session.access_token;
  const user_id = sessionData.session.user.id;
  if (imageFile) {
    imageUrl = await convertToBase64(imageFile);
  }
  const response = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ title, content, image_url: imageUrl, user_id }),
  });
  const responseData = await response.json();
  console.log("📌 API 응답:", responseData);
  if (response.ok) {
    loadPosts();
  } else {
    alert(`게시글 저장 실패! 오류: ${responseData.error}`);
  }
}

export async function updatePost(postId) {
  const user_id = await checkAuth();
  if (!user_id) return;
  const title = document.getElementById(`edit-title-${postId}`).value;
  const content = document.getElementById(`edit-content-${postId}`).value;
  const imageFile = document.getElementById(`edit-image-${postId}`).files[0];
  let imageUrl = document.getElementById(`current-image-${postId}`)?.src || null;
  if (imageFile) {
    imageUrl = await convertToBase64(imageFile);
  }
  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, image_url: imageUrl }),
  });
  if (response.ok) {
    loadPosts();
  } else {
    alert("게시글 수정 실패!");
  }
}

export async function deletePost(postId) {
  const user_id = await checkAuth();
  if (!user_id) return;
  const confirmDelete = confirm("정말로 삭제하시겠습니까?");
  if (!confirmDelete) return;
  const response = await fetch(`${API_URL}/posts/${postId}`, { method: "DELETE" });
  if (response.ok) {
    loadPosts();
  } else {
    alert("게시글 삭제 실패!");
  }
}

export async function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      console.log("✅ Base64 변환 성공:", reader.result.substring(0, 100));
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      console.error("🛑 Base64 변환 오류:", error);
      reject(error);
    };
  });
}

function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.classList.add("post-card");
  const createdDate = new Date(post.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const updatedDate = post.updated_at ? new Date(post.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : null;
  const isUpdated = post.updated_at && post.updated_at !== post.created_at;
  let dateText = isUpdated ? `<div class="post-updated">✏ 수정됨: ${updatedDate}</div>` : `<div class="post-date">📅 작성일: ${createdDate}</div>`;
  let imageTag = post.image_url ? `<div class="post-image"><img id="current-image-${post.id}" src="${post.image_url}" alt="게시물 이미지"></div>` : "";
  postDiv.innerHTML = `
    <div id="view-mode-${post.id}" class="post-content">
        ${imageTag}
        <h3 class="post-title">${post.title}</h3>
        <p class="post-text">${post.content}</p>
        ${dateText}
        <div class="post-actions">
            <button class="edit-btn" onclick="enableEditMode('${post.id}')">✏ 수정</button>
            <button class="delete-btn" onclick="deletePost('${post.id}')">🗑 삭제</button>
        </div>
    </div>
    <div id="edit-mode-${post.id}" class="edit-post" style="display: none;">
        <input type="text" id="edit-title-${post.id}" class="input-field" value="${post.title}">
        <textarea id="edit-content-${post.id}" class="input-field" rows="4">${post.content}</textarea>
        ${imageTag}
        <input type="file" id="edit-image-${post.id}" class="file-upload">
        <div class="post-actions">
            <button class="save-btn" onclick="updatePost('${post.id}')">💾 저장</button>
            <button class="cancel-btn" onclick="disableEditMode('${post.id}')">❌ 취소</button>
        </div>
    </div>
    <div class="comments-section">
        <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="댓글을 입력하세요">
        <button class="comment-btn" onclick="addComment('${post.id}')">💬 댓글 작성</button>
        <div class="comments" id="comments-${post.id}"></div>
    </div>
  `;
  document.getElementById("postList").appendChild(postDiv);
  loadComments(post.id);
}