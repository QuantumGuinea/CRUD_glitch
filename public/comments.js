import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';

const API_URL =  "https://resilient-grass-equinox.glitch.me";

export async function loadComments(board_id) {
  console.log(`🔹 loadComments 실행: board_id=${board_id}`);
  
  const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
  const comments = await response.json();
  
  const commentsDiv = document.getElementById(`comments-${board_id}`);
  if (!commentsDiv) {
    console.error(`🛑 오류: comments-${board_id} 요소를 찾을 수 없음!`);
    return; // 🚨 오류 발생 시 더 이상 실행하지 않음
  }

  commentsDiv.innerHTML = "";
  comments.forEach((comment) => {
    const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const updatedDate = comment.updated_at ? new Date(comment.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : null;
    const isUpdated = comment.updated_at && comment.updated_at !== comment.created_at;
    let dateText = isUpdated ? `<div class="comment-updated">✏ 수정: ${updatedDate}</div>` : `<div class="comment-date">📅 작성: ${createdDate}</div>`;
    
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment-box");
    commentElement.innerHTML = `
      <div id="view-comment-${comment.id}">
          <p class="comment-content">${comment.content}</p>
          ${dateText}
          <div class="comment-actions">
              <button class="edit-btn">✏ 수정</button>
              <button class="delete-btn">🗑 삭제</button>
          </div>
      </div>
      <div id="edit-comment-mode-${comment.id}" style="display: none;">
          <input type="text" id="edit-comment-${comment.id}" class="comment-edit-input" value="${comment.content}">
          <button class="save-btn">💾 저장</button>
          <button class="cancel-btn">❌ 취소</button>
      </div>
    `;

    // ✅ 이벤트 리스너 추가
    commentElement.querySelector(".edit-btn").addEventListener("click", () => enableCommentEditMode(comment.id, comment.content));
    commentElement.querySelector(".delete-btn").addEventListener("click", () => deleteComment(comment.id, board_id));
    commentElement.querySelector(".save-btn").addEventListener("click", () => updateComment(comment.id, board_id));
    commentElement.querySelector(".cancel-btn").addEventListener("click", () => disableCommentEditMode(comment.id));

    commentsDiv.appendChild(commentElement);
  });
}


export async function addComment(board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;
  const commentInput = document.getElementById(`comment-input-${board_id}`);
  const content = commentInput.value.trim();
  if (!content) return;
  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board_id, content }),
  });
  const responseData = await response.json();
  console.log("📌 API 응답:", responseData);
  if (response.ok) {
    loadComments(board_id);
  } else {
    alert(`댓글 작성 실패! 오류: ${responseData.error}`);
  }
}

// 📌 댓글 수정 모드 활성화
export function enableCommentEditMode(commentId, content) {
  document.getElementById(`view-comment-${commentId}`).style.display = "none";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display = "block";
}

// 📌 댓글 수정 모드 취소
export function disableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "block";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display = "none";
}

// 📌 댓글 수정
export async function updateComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const contentInput = document.getElementById(`edit-comment-${commentId}`);
  const newContent = contentInput.value.trim();
  if (!newContent) {
    alert("댓글 내용을 입력하세요.");
    return;
  }

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: newContent }),
  });

  if (response.ok) {
    loadComments(board_id);
  } else {
    alert("댓글 수정 실패!");
  }
}

// 📌 댓글 삭제
export async function deleteComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const confirmDelete = confirm("정말로 삭제하시겠습니까?");
  if (!confirmDelete) return;

  const response = await fetch(`${API_URL}/comments/${commentId}`, { method: "DELETE" });

  if (response.ok) {
    loadComments(board_id);
  } else {
    alert("댓글 삭제 실패!");
  }
}