import { checkAuth } from "./auth.js";

const API_URL = "https://resilient-grass-equinox.glitch.me"; // API 엔드포인트

// 📌 특정 게시글의 댓글 불러오기
export async function loadComments(board_id) {
  console.log(`🔹 loadComments 실행: board_id=${board_id}`);

  try {
    const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }
    
    const comments = await response.json();
    const commentsDiv = document.getElementById(`comments-${board_id}`);
    
    if (!commentsDiv) {
      console.error(`🛑 오류: comments-${board_id} 요소를 찾을 수 없음!`);
      return;
    }

    commentsDiv.innerHTML = ""; // 기존 댓글 초기화
    comments.forEach((comment) => {
      const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      const updatedDate = comment.updated_at ? new Date(comment.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : null;
      const isUpdated = comment.updated_at && comment.updated_at !== comment.created_at;

      let dateText = isUpdated
        ? `<div class="comment-updated">✏ 수정: ${updatedDate}</div>`
        : `<div class="comment-date">📅 작성: ${createdDate}</div>`;

      const commentElement = document.createElement("div");
      commentElement.classList.add("comment-box");
      commentElement.dataset.commentId = comment.id; // ✅ dataset 추가
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
      commentsDiv.appendChild(commentElement);
    });
  } catch (error) {
    console.error("🛑 loadComments 오류:", error);
  }
}

// 📌 댓글 추가
export async function addComment(board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const commentInput = document.getElementById(`comment-input-${board_id}`);
  if (!commentInput) {
    console.error(`🛑 오류: 댓글 입력란을 찾을 수 없음!`);
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

    console.log("✅ 댓글 추가 완료");
    commentInput.value = ""; // 입력 필드 초기화
    loadComments(board_id);
  } catch (error) {
    console.error("🛑 댓글 추가 오류:", error);
  }
}

// 📌 댓글 삭제
export async function deleteComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const confirmDelete = confirm("정말로 댓글을 삭제하시겠습니까?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 댓글 삭제 완료: commentId=${commentId}`);
    loadComments(board_id);
  } catch (error) {
    console.error("🛑 댓글 삭제 오류:", error);
  }
}

// 📌 댓글 수정
export async function updateComment(commentId, board_id) {
  const user_id = await checkAuth();
  if (!user_id) return;

  const contentInput = document.getElementById(`edit-comment-${commentId}`);
  if (!contentInput) {
    console.error(`🛑 오류: edit-comment-${commentId} 요소를 찾을 수 없음!`);
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
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 댓글 수정 완료: commentId=${commentId}`);
    loadComments(board_id);
  } catch (error) {
    console.error("🛑 댓글 수정 오류:", error);
  }
}

// 📌 댓글 수정 모드 활성화
export function enableCommentEditMode(commentId) {
  const viewComment = document.getElementById(`view-comment-${commentId}`);
  const editMode = document.getElementById(`edit-comment-mode-${commentId}`);

  if (viewComment && editMode) {
    viewComment.style.display = "none";
    editMode.style.display = "block";
  } else {
    console.error(`🛑 오류: 댓글 수정 UI를 찾을 수 없음! commentId=${commentId}`);
  }
}

// 📌 댓글 수정 모드 취소
export function disableCommentEditMode(commentId) {
  const viewComment = document.getElementById(`view-comment-${commentId}`);
  const editMode = document.getElementById(`edit-comment-mode-${commentId}`);

  if (viewComment && editMode) {
    viewComment.style.display = "block";
    editMode.style.display = "none";
  } else {
    console.error(`🛑 오류: 댓글 수정 UI를 찾을 수 없음! commentId=${commentId}`);
  }
}
