import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';

const API_URL = "https://resilient-grass-equinox.glitch.me";

export async function loadComments(board_id) {
  console.log(`🔹 loadComments 실행: board_id=${board_id}`);

  const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
  const comments = await response.json();

  const commentsDiv = document.getElementById(`comments-${board_id}`);
  if (!commentsDiv) {
    console.error(`🛑 오류: comments-${board_id} 요소를 찾을 수 없음!`);
    return;
  }

  commentsDiv.innerHTML = "";
  comments.forEach((comment) => {
    const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const updatedDate = comment.updated_at ? new Date(comment.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : null;
    const isUpdated = comment.updated_at && comment.updated_at !== comment.created_at;
    let dateText = isUpdated ? `<div class="comment-updated">✏ 수정: ${updatedDate}</div>` : `<div class="comment-date">📅 작성: ${createdDate}</div>`;

    const commentElement = document.createElement("div");
    commentElement.classList.add("comment-box");
    commentElement.setAttribute("data-comment-id", comment.id); // ✅ 특정 댓글을 식별할 수 있도록 추가

    commentElement.innerHTML = `
      <div class="view-comment">
          <p class="comment-content">${comment.content}</p>
          ${dateText}
          <div class="comment-actions">
              <button class="edit-btn">✏ 수정</button>
              <button class="delete-btn">🗑 삭제</button>
          </div>
      </div>
      <div class="edit-comment-mode" style="display: none;">
          <input type="text" class="comment-edit-input" value="${comment.content}">
          <button class="save-btn">💾 저장</button>
          <button class="cancel-btn">❌ 취소</button>
      </div>
    `;

    // ✅ 이벤트 리스너 추가
    commentElement.querySelector(".edit-btn").addEventListener("click", (event) => {
      event.stopPropagation(); // ✅ 중복 실행 방지
      enableCommentEditMode(comment.id);
    });

    commentElement.querySelector(".delete-btn").addEventListener("click", (event) => {
      event.stopPropagation(); // ✅ 중복 실행 방지
      deleteComment(comment.id, board_id);
    });

    commentElement.querySelector(".save-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      updateComment(comment.id, board_id);
    });

    commentElement.querySelector(".cancel-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      disableCommentEditMode(comment.id);
    });

    commentsDiv.appendChild(commentElement);
  });
}

// 📌 댓글 추가
export async function addComment(board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const commentInput = document.getElementById(`comment-input-${board_id}`);
  if (!commentInput) {
    console.error(`🛑 오류: id="comment-input-${board_id}" 요소를 찾을 수 없음.`);
    return;
  }

  const content = commentInput.value.trim();
  if (!content) {
    alert("댓글 내용을 입력하세요.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board_id, content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    commentInput.value = ""; // 입력창 초기화
    loadComments(board_id);
  } catch (error) {
    console.error("🛑 댓글 작성 실패:", error);
    alert(`댓글 작성 실패! 오류: ${error.message}`);
  }
}

// 📌 댓글 수정
export async function updateComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (!commentElement) {
    console.error(`🛑 오류: 댓글 요소를 찾을 수 없음! commentId=${commentId}`);
    return;
  }

  const contentInput = commentElement.querySelector(".comment-edit-input");
  const newContent = contentInput.value.trim();
  if (!newContent) {
    alert("댓글 내용을 입력하세요.");
    return;
  }

  // 기존 이미지 유지 (만약 댓글이 이미지 업로드를 지원할 경우 추가)
  let imageUrl = commentElement.querySelector(".comment-image")?.src || null;
  const imageFile = commentElement.querySelector(".comment-image-upload")?.files[0];

  if (imageFile) {
    imageUrl = await convertToBase64(imageFile);
  }

  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent, image_url: imageUrl }),
    });

    if (response.ok) {
      loadComments(board_id);
    } else {
      alert("댓글 수정 실패!");
    }
  } catch (error) {
    console.error("🛑 댓글 수정 실패:", error);
    alert("댓글 수정 실패!");
  }
}

// 📌 댓글 삭제
export async function deleteComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const confirmDelete = confirm("정말로 삭제하시겠습니까?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, { method: "DELETE" });

    if (response.ok) {
      loadComments(board_id);
    } else {
      alert("댓글 삭제 실패!");
    }
  } catch (error) {
    console.error("🛑 댓글 삭제 실패:", error);
    alert("댓글 삭제 실패!");
  }
}

// 📌 댓글 수정 모드 활성화
function enableCommentEditMode(commentId) {
  console.log(`🔹 enableCommentEditMode 실행: commentId=${commentId}`);

  const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (!commentElement) {
    console.error(`🛑 오류: 댓글 요소를 찾을 수 없음! commentId=${commentId}`);
    return;
  }

  commentElement.querySelector(".view-comment").style.display = "none";
  commentElement.querySelector(".edit-comment-mode").style.display = "block";
}

// 📌 댓글 수정 모드 취소
function disableCommentEditMode(commentId) {
  console.log(`🔹 disableCommentEditMode 실행: commentId=${commentId}`);

  const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (!commentElement) {
    console.error(`🛑 오류: 댓글 요소를 찾을 수 없음! commentId=${commentId}`);
    return;
  }

  commentElement.querySelector(".view-comment").style.display = "block";
  commentElement.querySelector(".edit-comment-mode").style.display = "none";
}
