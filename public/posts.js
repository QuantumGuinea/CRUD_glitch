import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';
import { addComment, loadComments } from './comments.js';

const API_URL = "https://resilient-grass-equinox.glitch.me";

// 📌 모든 게시글 불러오기
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

// 📌 게시글 저장
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
      Authorization: `Bearer ${access_token}`, // ✅ 백틱으로 수정
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

// 📌 게시글 수정
export async function updatePost(postId) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const title = document.getElementById(`edit-title-${postId}`).value;
  const content = document.getElementById(`edit-content-${postId}`).value;
  const imageFile = document.getElementById(`edit-image-${postId}`).files[0];

  // 기존 이미지 유지 (기존 URL 가져오기)
  let imageUrl = document.getElementById(`current-image-${postId}`)?.src || null;

  // 새로운 파일이 있으면 Base64 변환
  if (imageFile) {
    imageUrl = await convertToBase64(imageFile);
  }

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, image_url: imageUrl }),
    });

    if (response.ok) {
      loadPosts(); // 수정 후 게시글 다시 불러오기
    } else {
      alert("게시글 수정 실패!");
    }
  } catch (error) {
    console.error("🛑 게시글 수정 실패:", error);
    alert("게시글 수정 실패!");
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

// 📌 게시글 삭제 (확인 창 두 번 뜨는 문제 해결)
export async function deletePost(postId) {
  console.log(`🔹 deletePost 실행: postId=${postId}`);

  const user_id = await checkAuth();
  if (!user_id) return;

  // ✅ 확인 창이 두 번 뜨는 문제 해결
  if (!window.deleteConfirmFlag) {
    const confirmDelete = confirm("정말로 게시글을 삭제하시겠습니까?");
    if (!confirmDelete) return;
    window.deleteConfirmFlag = true;
  }

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`게시글 삭제 실패! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 게시글 삭제 완료: postId=${postId}`);
    loadPosts(); // ✅ 삭제 후 전체 게시글 새로고침
  } catch (error) {
    console.error("🛑 게시글 삭제 실패:", error);
    alert(`게시글 삭제 실패! 오류: ${error.message}`);
  } finally {
    window.deleteConfirmFlag = false;
  }
}

// 📌 게시글 요소 생성
function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.classList.add("post-card");
  postDiv.dataset.postId = post.id; // ✅ 게시글 ID 추가

  // ✅ 기존 이미지 유지
  let imageTag = post.image_url
    ? `<div class="post-image"><img id="current-image-${post.id}" src="${post.image_url}" alt="게시물 이미지"></div>`
    : "";

  postDiv.innerHTML = `
    <div id="view-mode-${post.id}" class="post-content">
        ${imageTag}
        <h3 class="post-title">${post.title}</h3>
        <p class="post-text">${post.content}</p>
        <div class="post-actions">
            <button class="edit-btn">✏ 수정</button>
            <button class="delete-btn">🗑 삭제</button>
        </div>
    </div>
    <div id="edit-mode-${post.id}" class="edit-post" style="display: none;">
        <input type="text" id="edit-title-${post.id}" class="input-field" value="${post.title}">
        <textarea id="edit-content-${post.id}" class="input-field" rows="4">${post.content}</textarea>
        <div class="post-image">${imageTag}</div>
        <input type="file" id="edit-image-${post.id}" class="file-upload">
        <div class="post-actions">
            <button class="save-btn">💾 저장</button>
            <button class="cancel-btn">❌ 취소</button>
        </div>
    </div>
    <!-- ✅ 댓글 입력창 및 댓글 리스트 추가 -->
    <div class="comments-section">
        <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="댓글을 입력하세요">
        <button class="comment-btn">💬 댓글 작성</button>
        <div class="comments" id="comments-${post.id}"></div>
    </div>
  `;

  // ✅ 이벤트 리스너 추가 (게시글 관련 버튼)
  postDiv.querySelector(".edit-btn").addEventListener("click", () => enableEditMode(post.id));
  postDiv.querySelector(".delete-btn").addEventListener("click", () => deletePost(post.id));
  postDiv.querySelector(".save-btn").addEventListener("click", () => updatePost(post.id));
  postDiv.querySelector(".cancel-btn").addEventListener("click", () => disableEditMode(post.id));

  // ✅ 댓글 작성 버튼 리스너 추가
  postDiv.querySelector(".comment-btn").addEventListener("click", () => addComment(post.id));

  // ✅ 게시글 목록에 추가
  document.getElementById("postList").appendChild(postDiv);

  // ✅ 댓글 불러오기 실행 (댓글 창이 안 사라지도록 유지)
  loadComments(post.id);
}




// 📌 수정 모드 활성화
function enableEditMode(postId) {
  document.getElementById(`view-mode-${postId}`).style.display = "none";
  document.getElementById(`edit-mode-${postId}`).style.display = "block";
}

// 📌 수정 모드 취소
function disableEditMode(postId) {
  document.getElementById(`view-mode-${postId}`).style.display = "block";
  document.getElementById(`edit-mode-${postId}`).style.display = "none";
}
