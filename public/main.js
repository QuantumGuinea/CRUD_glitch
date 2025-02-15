import { signInWithProvider, signOutAndClearSession, checkLogin } from './auth.js';
import { loadPosts, savePost, updatePost, deletePost } from './posts.js';
import { addComment, updateComment, deleteComment } from './comments.js';

document.addEventListener("DOMContentLoaded", async () => {
  await checkLogin();
  loadPosts();

  document.querySelector("#login-github").addEventListener("click", () => signInWithProvider("github"));
  document.querySelector("#login-google").addEventListener("click", () => signInWithProvider("google"));
  document.querySelector("#logout").addEventListener("click", () => signOutAndClearSession());

  document.getElementById("postForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const imageFile = document.getElementById("image").files[0];
    if (!title || !content) return;
    await savePost(title, content, imageFile);
    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    document.getElementById("image").value = "";
  });
});

// ✅ 모든 클릭 이벤트를 하나의 리스너에서 처리
document.addEventListener("click", (event) => {
  const postDiv = event.target.closest(".post-card");
  const commentBox = event.target.closest(".comment-box");

  // 📌 게시글 관련 버튼 처리
  if (postDiv) {
    const postId = postDiv.dataset.postId;

    if (event.target.classList.contains("edit-btn")) {
      enableEditMode(postId);
    }

    if (event.target.classList.contains("delete-btn")) {
      deletePost(postId);
    }

    if (event.target.classList.contains("save-btn")) {
      updatePost(postId);
    }

    if (event.target.classList.contains("cancel-btn")) {
      disableEditMode(postId);
    }

    if (event.target.classList.contains("comment-btn")) {
      const commentInput = document.getElementById(`comment-input-${postId}`);
      if (!commentInput) {
        console.error(`🛑 오류: 댓글 입력란을 찾을 수 없음! comment-input-${postId}`);
        return;
      }
      addComment(postId);
    }
  }

  // 📌 댓글 관련 버튼 처리
  if (commentBox) {
    const commentId = commentBox.dataset.commentId;
    const postId = commentBox.closest(".post-card").dataset.postId;

    if (event.target.classList.contains("edit-btn")) {
      enableCommentEditMode(commentId);
    }

    if (event.target.classList.contains("delete-btn")) {
      deleteComment(commentId, postId);
    }

    if (event.target.classList.contains("save-btn")) {
      updateComment(commentId, postId);
    }

    if (event.target.classList.contains("cancel-btn")) {
      disableCommentEditMode(commentId);
    }
  }
});

// 📌 게시글 수정 모드 활성화
function enableEditMode(postId) {
  document.getElementById(`view-mode-${postId}`).style.display = "none";
  document.getElementById(`edit-mode-${postId}`).style.display = "block";
}

// 📌 게시글 수정 모드 취소
function disableEditMode(postId) {
  document.getElementById(`view-mode-${postId}`).style.display = "block";
  document.getElementById(`edit-mode-${postId}`).style.display = "none";
}

// 📌 댓글 수정 모드 활성화
function enableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "none";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display = "block";
}

// 📌 댓글 수정 모드 취소
function disableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "block";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display = "none";
}
