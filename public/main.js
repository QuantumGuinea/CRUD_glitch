import { signInWithProvider, signOutAndClearSession, checkLogin } from './auth.js';
import { loadPosts, savePost, updatePost, deletePost } from './posts.js';
import { addComment, updateComment, deleteComment } from './comments.js';

document.addEventListener("DOMContentLoaded", async () => {
  await checkLogin();
  loadPosts();

  document.querySelector("#login-github").addEventListener("click", () => signInWithProvider("github"));
  document.querySelector("#login-google").addEventListener("click", () => signInWithProvider("google"));
  document.querySelector("#logout").addEventListener("click", () => signOutAndClearSession());

  // ✅ 게시글 작성 이벤트 리스너 추가
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

// ✅ 게시글, 댓글 버튼 이벤트 위임 (게시글이 동적으로 추가되기 때문)
document.addEventListener("click", (event) => {
  const postDiv = event.target.closest(".post-card");
  if (!postDiv) return;

  const postId = postDiv.dataset.postId;

  console.log(`🔹 클릭한 요소: ${event.target.classList}, postId: ${postId}`);

  // 게시글 수정 버튼 클릭
  if (event.target.classList.contains("edit-btn")) {
    enableEditMode(postId);
  }

  // 게시글 삭제 버튼 클릭
  if (event.target.classList.contains("delete-btn")) {
    deletePost(postId);
  }

  // 게시글 저장 버튼 클릭
  if (event.target.classList.contains("save-btn")) {
    updatePost(postId);
  }

  // 수정 취소 버튼 클릭
  if (event.target.classList.contains("cancel-btn")) {
    disableEditMode(postId);
  }

  // 댓글 작성 버튼 클릭
  if (event.target.classList.contains("comment-btn")) {
    const commentInput = postDiv.querySelector(".comment-input");
    if (commentInput) {
      addComment(postId);
    }
  }
});

// 📌 수정 모드 활성화
function enableEditMode(postId, title, content) {
  document.getElementById(`view-mode-${postId}`).style.display = "none";
  document.getElementById(`edit-mode-${postId}`).style.display = "block";
}

// 📌 수정 모드 취소
function disableEditMode(postId) {
  document.getElementById(`view-mode-${postId}`).style.display = "block";
  document.getElementById(`edit-mode-${postId}`).style.display = "none";
}