import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';
import { loadComments } from './comments.js';

const API_URL =  "https://resilient-grass-equinox.glitch.me";

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

    postList.innerHTML = ""; // 기존 내용 지우기
    posts.forEach((post) => createPostElement(post));
  } catch (error) {
    console.error("🛑 loadPosts() 오류:", error);
  }
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
  console.log(`📌 createPostElement() 실행됨: postId=${post.id}`);

  const postDiv = document.createElement("div");
  postDiv.classList.add("post-card");
  postDiv.dataset.postId = post.id;

  let imageTag = post.image_url
    ? `<div class="post-image"><img src="${post.image_url}" alt="게시물 이미지"></div>`
    : "";

  postDiv.innerHTML = `
    <div class="post-content">
        ${imageTag}
        <h3 class="post-title">${post.title}</h3>
        <p class="post-text">${post.content}</p>
        <div class="post-actions">
            <button class="edit-btn">✏ 수정</button>
            <button class="delete-btn">🗑 삭제</button>
        </div>
    </div>
    <div class="comments-section">
        <input type="text" class="comment-input" placeholder="댓글을 입력하세요">
        <button class="comment-btn">💬 댓글 작성</button>
        <div class="comments" id="comments-${post.id}"></div>
    </div>
  `;

  document.getElementById("postList").appendChild(postDiv);
  loadComments(post.id);
}



