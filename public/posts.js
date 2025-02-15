import { checkAuth } from "./auth.js";
import { loadComments } from "./comments.js";

const API_URL = "https://resilient-grass-equinox.glitch.me"; // API 엔드포인트

// 📌 게시글 목록 불러오기
export async function loadPosts() {
  console.log("🔹 loadPosts() 실행됨");

  try {
    const response = await fetch(`${API_URL}/posts`);
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    const posts = await response.json();
    console.log("✅ 받아온 게시글:", posts);

    const postList = document.getElementById("postList");
    if (!postList) {
      console.error("🛑 오류: postList 요소를 찾을 수 없음!");
      return;
    }

    postList.innerHTML = ""; // 기존 내용 초기화
    posts.forEach((post) => createPostElement(post));
  } catch (error) {
    console.error("🛑 loadPosts() 오류:", error);
  }
}

// 📌 게시글 생성
export async function savePost(title, content, imageFile) {
  const user_id = await checkAuth();
  if (!user_id) return;

  let imageUrl = null;
  if (imageFile) {
    imageUrl = await convertToBase64(imageFile);
  }

  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, image_url: imageUrl, user_id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    console.log("✅ 게시글 추가 완료");
    loadPosts();
  } catch (error) {
    console.error("🛑 게시글 추가 오류:", error);
  }
}

// 📌 게시글 삭제
export async function deletePost(postId) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const confirmDelete = confirm("정말로 게시글을 삭제하시겠습니까?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 게시글 삭제 완료: postId=${postId}`);
    loadPosts();
  } catch (error) {
    console.error("🛑 게시글 삭제 오류:", error);
  }
}

// 📌 게시글 수정
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

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, image_url: imageUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 게시글 수정 완료: postId=${postId}`);
    loadPosts();
  } catch (error) {
    console.error("🛑 게시글 수정 오류:", error);
  }
}

// 📌 Base64 변환 함수 (이미지 업로드 처리)
async function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// 📌 게시글 HTML 요소 생성
function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.classList.add("post-card");
  postDiv.dataset.postId = post.id; // ✅ dataset 추가

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
            <button class="edit-btn">✏ 수정</button>
            <button class="delete-btn">🗑 삭제</button>
        </div>
    </div>
    <div id="edit-mode-${post.id}" class="edit-post" style="display: none;">
        <input type="text" id="edit-title-${post.id}" class="input-field" value="${post.title}">
        <textarea id="edit-content-${post.id}" class="input-field" rows="4">${post.content}</textarea>
        ${imageTag}
        <input type="file" id="edit-image-${post.id}" class="file-upload">
        <div class="post-actions">
            <button class="save-btn">💾 저장</button>
            <button class="cancel-btn">❌ 취소</button>
        </div>
    </div>
    <div class="comments-section">
        <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="댓글을 입력하세요">
        <button class="comment-btn">💬 댓글 작성</button>
        <div class="comments" id="comments-${post.id}"></div>
    </div>
  `;

  document.getElementById("postList").appendChild(postDiv);
  loadComments(post.id);
}
