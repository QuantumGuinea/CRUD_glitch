import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';

const API_URL = "https://resilient-grass-equinox.glitch.me";

// 📌 댓글 불러오기
export async function loadComments(board_id) {
  console.log(`🔹 loadComments 실행: board_id=${board_id}`);

  try {
    const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    const comments = await response.json();
    console.log("✅ 받아온 댓글:", comments);

    const commentsDiv = document.getElementById(`comments-${board_id}`);
    if (!commentsDiv) {
      console.error(`🛑 오류: comments-${board_id} 요소를 찾을 수 없음!`);
      return;
    }

    commentsDiv.innerHTML = ""; // 기존 댓글 지우기

    comments.forEach((comment) => {
      const commentElement = document.createElement("div");
      commentElement.classList.add("comment-box");
      commentElement.dataset.commentId = comment.id; // ✅ 댓글 ID 추가
      commentElement.innerHTML = `
        <div id="view-comment-${comment.id}">
          <p class="comment-content">${comment.content}</p>
          <div class="comment-actions">
            <button class="edit-btn" data-comment-id="${comment.id}" data-board-id="${board_id}">✏ 수정</button>
            <button class="delete-btn" data-comment-id="${comment.id}" data-board-id="${board_id}">🗑 삭제</button>
          </div>
        </div>
        <div id="edit-comment-mode-${comment.id}" style="display: none;">
          <input type="text" id="edit-comment-${comment.id}" class="comment-edit-input" value="${comment.content}">
          <button class="save-btn" data-comment-id="${comment.id}" data-board-id="${board_id}">💾 저장</button>
          <button class="cancel-btn" data-comment-id="${comment.id}">❌ 취소</button>
        </div>
      `;

      commentsDiv.appendChild(commentElement);
    });

  } catch (error) {
    console.error("🛑 loadComments() 오류:", error);
  }
}

// 📌 댓글 삭제 (삭제 버튼을 두 번 눌러야 하는 문제 해결 + 게시물 삭제되지 않도록 수정)
export async function deleteComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const confirmDelete = confirm("정말로 댓글을 삭제하시겠습니까?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`댓글 삭제 실패! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 댓글 삭제 완료: commentId=${commentId}`);

    // ✅ 1. 서버에서 삭제된 후, DOM에서도 즉시 삭제 (버튼 두 번 눌러야 하는 문제 해결)
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
      commentElement.remove();
    }

    // ✅ 2. 전체 댓글 목록 새로고침 (보드 ID 유지)
    loadComments(board_id);
  } catch (error) {
    console.error("🛑 댓글 삭제 실패:", error);
    alert(`댓글 삭제 실패! 오류: ${error.message}`);
  }
}

// 📌 댓글 추가
export async function addComment(board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  console.log(`🔹 addComment 실행: board_id=${board_id}`);

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

    console.log("📌 API 응답 상태 코드:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("📌 API 응답 데이터:", responseData);
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

  const contentInput = document.getElementById(`edit-comment-${commentId}`);
  if (!contentInput) {
    console.error(`🛑 오류: id="edit-comment-${commentId}" 요소를 찾을 수 없음.`);
    return;
  }

  const newContent = contentInput.value.trim();
  if (!newContent) {
    alert("댓글 내용을 입력하세요.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });

    if (!response.ok) {
      throw new Error(`댓글 수정 실패! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 댓글 수정 완료: commentId=${commentId}`);
    loadComments(board_id);
  } catch (error) {
    console.error("🛑 댓글 수정 실패:", error);
    alert(`댓글 수정 실패! 오류: ${error.message}`);
  }
}

// 📌 댓글 수정 모드 활성화
export function enableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "none";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display = "block";
}

// 📌 댓글 수정 모드 취소
export function disableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "block";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display = "none";
}
