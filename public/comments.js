import { supabase } from './supabaseClient.js';
import { checkAuth } from './auth.js';

const API_URL = "https://resilient-grass-equinox.glitch.me";

export async function loadComments(board_id) {
  console.log(`🔹 loadComments 실행: board_id=${board_id}`);

  // ✅ 댓글 창이 존재하는지 확인
  const commentsDiv = document.getElementById(`comments-${board_id}`);
  if (!commentsDiv) {
    console.error(`🛑 오류: comments-${board_id} 요소를 찾을 수 없음!`);
    return; // 🚨 오류 발생 시 더 이상 실행하지 않음
  }

  try {
    const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }
    const comments = await response.json();

    // ✅ 기존 댓글 리스트 초기화
    commentsDiv.innerHTML = "";

    comments.forEach((comment) => {
      const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      let commentElement = document.createElement("div");
      commentElement.classList.add("comment-box");
      commentElement.dataset.commentId = comment.id;

      commentElement.innerHTML = `
        <div id="view-comment-${comment.id}">
            <p class="comment-content">${comment.content}</p>
            <div class="comment-date">📅 작성: ${createdDate}</div>
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
      commentElement.querySelector(".edit-btn").addEventListener("click", () => enableCommentEditMode(comment.id));
      commentElement.querySelector(".delete-btn").addEventListener("click", () => deleteComment(comment.id, board_id));
      commentElement.querySelector(".save-btn").addEventListener("click", () => updateComment(comment.id, board_id));
      commentElement.querySelector(".cancel-btn").addEventListener("click", () => disableCommentEditMode(comment.id));

      commentsDiv.appendChild(commentElement);
    });

  } catch (error) {
    console.error("🛑 loadComments() 오류:", error);
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

  console.log(`🗑 댓글 삭제 요청: commentId=${commentId}, board_id=${board_id}`);

  // ✅ 삭제 확인창 한 번만 뜨도록 수정
  const confirmDelete = confirm("정말로 댓글을 삭제하시겠습니까?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_URL}/comments/${commentId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    console.log(`✅ 댓글 삭제 완료: commentId=${commentId}`);
    
    // ✅ 게시글이 삭제되지 않도록, 댓글만 다시 불러오기
    loadComments(board_id);
  } catch (error) {
    console.error("🛑 댓글 삭제 실패:", error);
    alert(`댓글 삭제 실패! 오류: ${error.message}`);
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
