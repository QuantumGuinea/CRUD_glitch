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