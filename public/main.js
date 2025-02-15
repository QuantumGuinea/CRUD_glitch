import { signInWithProvider, signOutAndClearSession, checkLogin } from './auth.js';
import { loadPosts, savePost, updatePost, deletePost } from './posts.js';
import { addComment, updateComment, deleteComment } from './comments.js';

document.addEventListener("DOMContentLoaded", async () => {
  await checkLogin();
  loadPosts();

  document.querySelector("#login-github").addEventListener("click", () => signInWithProvider("github"));
  document.querySelector("#login-google").addEventListener("click", () => signInWithProvider("google"));
  document.querySelector("#logout").addEventListener("click", () => signOutAndClearSession());

  // ✅ 게시글 작성 이벤트 리스너
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

// ✅ 댓글 버튼(`comment-btn`)을 클릭했을 때 `addComment(postId)` 호출
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("comment-btn")) {
    const postId = event.target.previousElementSibling.id.replace("comment-input-", "");
    addComment(postId);
  }
});
