import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';

const API_URL = "http://127.0.0.1:3000";

export async function loadComments(board_id) {
  const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
  const comments = await response.json();
  const commentsDiv = document.getElementById(`comments-${board_id}`);
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
              <button class="edit-btn" onclick="enableCommentEditMode('${comment.id}', '${comment.content}')">✏ 수정</button>
              <button class="delete-btn" onclick="deleteComment('${comment.id}', '${board_id}')">🗑 삭제</button>
          </div>
      </div>
      <div id="edit-comment-mode-${comment.id}" style="display: none;">
          <input type="text" id="edit-comment-${comment.id}" class="comment-edit-input" value="${comment.content}">
          <button class="save-btn" onclick="updateComment('${comment.id}', '${board_id}')">💾 저장</button>
          <button class="cancel-btn" onclick="disableCommentEditMode('${comment.id}')">❌ 취소</button>
      </div>
    `;
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

export async function updateComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;
  const contentInput = document.getElementById(`edit-comment-${commentId}`);
  const newContent = contentInput.value.trim();
  if (!newContent) return alert("댓글 내용을 입력하세요.");
  await fetch(`${API_URL}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: newContent }),
  });
  loadComments(board_id);
}

export async function deleteComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;
  await fetch(`${API_URL}/comments/${commentId}`, { method: "DELETE" });
  loadComments(board_id);
}