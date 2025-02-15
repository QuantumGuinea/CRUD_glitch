import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const API_URL = "https://resilient-grass-equinox.glitch.me"; // 백엔드 서버 주소
let supabase; // 전역 변수

async function loadConfig() {
  try {
    const response = await fetch("/config");
    const config = await response.json();

    // ✅ Supabase 클라이언트 전역 변수에 저장
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    console.log("✅ Supabase 클라이언트 생성 완료:", supabase);
  } catch (error) {
    console.error("🛑 Supabase 환경변수 로딩 실패:", error);
  }
}

// ✅ Supabase 초기화 후 실행할 함수
async function initializeApp() {
  await loadConfig(); // Supabase 설정 로딩 후 실행
  console.log("🔥 Supabase 연결 확인:", supabase);

  if (!supabase) {
    console.error("🛑 Supabase가 초기화되지 않음.");
    return;
  }

  // ✅ 로그인 및 로그아웃 버튼 이벤트 리스너 추가
  document.querySelector("#login-github")?.addEventListener("click", () => {
    if (!supabase) {
      console.error("🛑 Supabase가 아직 초기화되지 않음. 로그인 불가");
      return;
    }
    signInWithProvider("github");
  });

  document.querySelector("#login-google")?.addEventListener("click", () => {
    if (!supabase) {
      console.error("🛑 Supabase가 아직 초기화되지 않음. 로그인 불가");
      return;
    }
    signInWithProvider("google");
  });

  const logoutButton = document.querySelector("#logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", signOutAndClearSession);
  } else {
    console.error("🛑 로그아웃 버튼을 찾을 수 없음.");
  }

  // ✅ Supabase 로그인 상태 변경 감지 (초기화 이후 실행)
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("🔹 인증 상태 변경:", event, session);
    checkLogin(); // ✅ 로그인 상태 자동 업데이트
  });

  // ✅ 로그인 상태 확인
  checkLogin();
}

// 📌 로그인 처리 함수
async function signInWithProvider(provider) {
  
  console.log(`🔹 ${provider} 로그인 시도...`);

  // ✅ Supabase가 초기화되지 않았다면 1초 기다린 후 다시 실행
  while (!supabase) {
    console.warn("🛑 Supabase가 아직 초기화되지 않음. 1초 대기...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`🔹 기존 세션 초기화 중...`);
  await supabase.auth.signOut();

  const redirectUrl = `${window.location.origin}/index.html`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectUrl,
      prompt: "select_account",
    },
  });

  if (error) {
    console.error(`🛑 ${provider} 로그인 오류:`, error.message);
  } else {
    console.log(`✅ ${provider} 로그인 요청 보냄:`, data);
  }
}

// 📌 로그아웃 함수
async function signOutAndClearSession() {
  if (!supabase) {
    console.error("🛑 Supabase가 초기화되지 않음. 로그아웃 불가");
    return;
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("🛑 로그아웃 실패:", error.message);
    } else {
      console.log("✅ 로그아웃 성공");

      // ✅ 로컬 스토리지 및 쿠키 초기화
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });

      // ✅ 현재 화면 새로고침
      window.location.reload();
    }
  } catch (error) {
    console.error("🛑 로그아웃 중 오류 발생:", error);
  }
}

// 📌 로그인 상태 확인 함수
async function checkLogin() {
  if (!supabase) {
    console.error("🛑 Supabase가 초기화되지 않음. 로그인 상태 확인 불가");
    return;
  }

  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    console.log("🔹 Supabase 세션 데이터:", sessionData);

    const loginGit = document.querySelector("#login-github");
    const loginGoogle = document.querySelector("#login-google");
    const logoutButton = document.querySelector("#logout");

    if (error || !sessionData?.session) {
      console.warn("🔹 세션 없음, 로그아웃 상태 유지");
      if (loginGit) loginGit.style.display = "inline";
      if (loginGoogle) loginGoogle.style.display = "inline";
      if (logoutButton) logoutButton.style.display = "none";
      return;
    }

    // ✅ 현재 로그인한 사용자 정보 가져오기
    const { data: userCheck, error: userCheckError } =
      await supabase.auth.getUser();

    // 🛑 Supabase에서 사용자가 삭제된 경우 (user 정보가 없음)
    if (userCheckError || !userCheck?.user) {
      console.warn("🛑 사용자 계정이 삭제됨! 강제 로그아웃 실행...");
      await supabase.auth.signOut();
      window.location.reload(); // ✅ 강제 새로고침하여 세션 초기화
      return;
    }

    if (loginGit) loginGit.style.display = "none";
    if (loginGoogle) loginGoogle.style.display = "none";
    if (logoutButton) logoutButton.style.display = "inline";
  } catch (err) {
    console.error("🛑 checkLogin() 실행 중 오류 발생:", err);
  }
}

// ✅ 앱 초기화 실행 (DOMContentLoaded 시점에서 실행)
document.addEventListener("DOMContentLoaded", initializeApp);

//////////////////////////////////////////////

const postList = document.getElementById("postList");
const postForm = document.getElementById("postForm");

// 📌 서버에서 게시글 불러오기
async function loadPosts() {
  const response = await fetch(`${API_URL}/posts`);
  const posts = await response.json();

  postList.innerHTML = ""; // 기존 게시글 초기화
  posts.forEach((post) => createPostElement(post));
}

// 📌 클라이언트에서 base64 변환 및 업로드
async function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      console.log("✅ Base64 변환 성공:", reader.result.substring(0, 100)); // Base64 앞 100자 확인
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      console.error("🛑 Base64 변환 오류:", error);
      reject(error);
    };
  });
}

// 📌 게시글 저장 (이미지 base64 변환 후 Supabase DB 저장)
async function savePost(title, content, imageFile) {
  let imageUrl = null;

  // ✅ 현재 로그인된 사용자 정보 가져오기
  const { data: sessionData, error } = await supabase.auth.getSession();

  if (error || !sessionData?.session) {
    alert("로그인이 필요합니다!");
    return;
  }

  const access_token = sessionData.session.access_token;
  const user_id = sessionData.session.user.id; // ✅ user_id 가져오기

  if (imageFile) {
    imageUrl = await convertToBase64(imageFile);
  }

  const response = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`, // ✅ Authorization 헤더 추가
    },
    body: JSON.stringify({ title, content, image_url: imageUrl, user_id }),
  });

  const responseData = await response.json();
  console.log("📌 API 응답:", responseData); // ✅ API 응답 확인

  if (response.ok) {
    loadPosts();
  } else {
    alert(`게시글 저장 실패! 오류: ${responseData.error}`);
  }
}

// 📌 서버에서 게시글 수정하기 (updated_at 반영)
async function updatePost(postId) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료

  const title = document.getElementById(`edit-title-${postId}`).value;
  const content = document.getElementById(`edit-content-${postId}`).value;
  const imageFile = document.getElementById(`edit-image-${postId}`).files[0];

  let imageUrl =
    document.getElementById(`current-image-${postId}`)?.src || null;
  if (imageFile) {
    imageUrl = await convertToBase64(imageFile);
  }

  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, image_url: imageUrl }),
  });

  if (response.ok) {
    loadPosts();
  } else {
    alert("게시글 수정 실패!");
  }
}

async function deleteImage(postId) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료

  const confirmDelete = confirm("이미지를 삭제하시겠습니까?");
  if (!confirmDelete) return;

  const response = await fetch(`${API_URL}/posts/${postId}/image`, {
    method: "DELETE",
  });

  if (response.ok) {
    loadPosts();
  } else {
    alert("이미지 삭제 실패!");
  }
}

// 📌 서버에서 게시글 삭제하기
async function deletePost(postId) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료

  const confirmDelete = confirm("정말로 삭제하시겠습니까?");
  if (!confirmDelete) return;

  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: "DELETE",
  });

  if (response.ok) {
    loadPosts();
  } else {
    alert("게시글 삭제 실패!");
  }
}

// 📌 댓글 추가하기
async function addComment(board_id) {
  const user_id = await checkAuth(); // ✅ 로그인 체크
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료

  const commentInput = document.getElementById(`comment-input-${board_id}`);
  const content = commentInput.value.trim();
  if (!content) return;

  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board_id, content }),
  });

  const responseData = await response.json();
  console.log("📌 API 응답:", responseData); // ✅ API 응답 확인

  if (response.ok) {
    loadComments(board_id);
  } else {
    alert(`댓글 작성 실패! 오류: ${responseData.error}`);
  }
}

// 📌 서버에서 댓글 수정하기
async function updateComment(commentId, board_id) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료
  const contentInput = document.getElementById(`edit-comment-${commentId}`);

  const newContent = contentInput.value.trim();
  if (!newContent) return alert("댓글 내용을 입력하세요.");

  await fetch(`${API_URL}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: newContent }),
  });

  loadComments(board_id); // 수정 후 해당 게시글의 댓글 다시 불러오기
}

// 📌 댓글 삭제하기
async function deleteComment(commentId, board_id) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료
  await fetch(`${API_URL}/comments/${commentId}`, { method: "DELETE" });
  loadComments(board_id); // 다시 불러오기
}

// 📌 글 작성 이벤트 (이미지 업로드 추가)
postForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageFile = document.getElementById("image").files[0]; // 파일 선택

  if (!title || !content) return;

  await savePost(title, content, imageFile);

  // 입력 필드 초기화
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("image").value = "";
});

function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.classList.add("post-card");

  const createdDate = new Date(post.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
  const updatedDate = post.updated_at
    ? new Date(post.updated_at).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      })
    : null;
  const isUpdated = post.updated_at && post.updated_at !== post.created_at;

  let dateText = isUpdated
    ? `<div class="post-updated">✏ 수정됨: ${updatedDate}</div>`
    : `<div class="post-date">📅 작성일: ${createdDate}</div>`;

  let imageTag = post.image_url
    ? `<div class="post-image"><img id="current-image-${post.id}" src="${post.image_url}" alt="게시물 이미지"></div>`
    : "";

  postDiv.innerHTML = `
    <div id="view-mode-${post.id}" class="post-content">
        ${imageTag}
        <h3 class="post-title">${post.title}</h3>
        <p class="post-text">${post.content}</p>
        ${dateText}
        <div class="post-actions">
            <button class="edit-btn" onclick="enableEditMode('${post.id}')">✏ 수정</button>
            <button class="delete-btn" onclick="deletePost('${post.id}')">🗑 삭제</button>
        </div>
    </div>

    <!-- 수정 모드 -->
    <div id="edit-mode-${post.id}" class="edit-post" style="display: none;">
        <input type="text" id="edit-title-${post.id}" class="input-field" value="${post.title}">
        <textarea id="edit-content-${post.id}" class="input-field" rows="4">${post.content}</textarea>

        <!-- 기존 이미지 표시 -->
        ${imageTag}

        <!-- 이미지 업로드 -->
        <input type="file" id="edit-image-${post.id}" class="file-upload">
        
        <div class="post-actions">
            <button class="save-btn" onclick="updatePost('${post.id}')">💾 저장</button>
            <button class="cancel-btn" onclick="disableEditMode('${post.id}')">❌ 취소</button>
        </div>
    </div>

    <div class="comments-section">
        <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="댓글을 입력하세요">
        <button class="comment-btn" onclick="addComment('${post.id}')">💬 댓글 작성</button>
        <div class="comments" id="comments-${post.id}"></div>
    </div>
  `;

  postList.appendChild(postDiv);
  loadComments(post.id);
}

// 📌 특정 게시글의 댓글 불러오기 (작성과 수정 날짜 포함)
async function loadComments(board_id) {
  const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
  const comments = await response.json();

  const commentsDiv = document.getElementById(`comments-${board_id}`);
  commentsDiv.innerHTML = ""; // 기존 댓글 초기화

  comments.forEach((comment) => {
    const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });
    const updatedDate = comment.updated_at
      ? new Date(comment.updated_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        })
      : null;
    const isUpdated =
      comment.updated_at && comment.updated_at !== comment.created_at;

    let dateText = isUpdated
      ? `<div class="comment-updated">✏ 수정: ${updatedDate}</div>`
      : `<div class="comment-date">📅 작성: ${createdDate}</div>`;

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

// 📌 로그인하지 않은 사용자는 특정 작업을 할 수 없도록 제한
async function checkAuth() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData?.session) {
    alert("로그인이 필요합니다!");
    return null;
  }
  return sessionData.session.user.id;
}

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

// 📌 댓글 수정 모드 활성화
function enableCommentEditMode(commentId, content) {
  document.getElementById(`view-comment-${commentId}`).style.display = "none";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display =
    "block";
}

// 📌 댓글 수정 모드 취소
function disableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "block";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display =
    "none";
}

// 📌 페이지 로드 시 게시글 불러오기
window.onload = loadPosts;
