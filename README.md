# 🐾 CRUD Glitch 프로젝트 (반려동물 커뮤니티 게시판)

이 프로젝트는 **Glitch에서 개발된 반려동물 커뮤니티 웹 애플리케이션**입니다.  
Supabase를 사용하여 **소셜 로그인(GitHub, Google)** 및 **CRUD(게시글, 댓글) 기능**을 제공합니다.  

📌 **핵심 기능**  
- **회원가입 & 로그인**: Supabase OAuth(GitHub, Google) 기반 인증  
- **게시글 CRUD**: 게시글 작성, 수정, 삭제 가능  
- **댓글 CRUD**: 댓글 작성, 수정, 삭제 가능  
- **이미지 업로드**: Base64로 변환하여 Supabase에 저장  

---

```
## 📂 프로젝트 구조

CRUD_glitch/
│── public/             # 클라이언트 코드 (프론트엔드)
│   ├── auth.js         # Supabase 로그인 & 로그아웃 관리
│   ├── comments.js     # 댓글 CRUD 기능
│   ├── index.html      # 메인 페이지 (UI)
│   ├── main.js         # 이벤트 리스너 & CRUD 로직 관리
│   ├── posts.js        # 게시글 CRUD 기능
│   ├── style.css       # 스타일 시트 (CSS)
│   ├── supabaseClient.js # Supabase 설정
│
│── server.js           # Glitch에서 실행되는 Node.js 서버
│── package.json        # 프로젝트 설정 및 종속성 관리
│── README.md           # 프로젝트 설명 (이 문서)
```

## 🛠 주요 코드 설명

### 1️⃣ **인증 시스템 (`auth.js`)**
- Supabase OAuth(GitHub, Google) 로그인을 관리합니다.
- `supabase.auth.signInWithOAuth({ provider })`를 사용하여 로그인 요청을 보냅니다.
- 로그인 후 `checkLogin()` 함수가 실행되어 **현재 로그인 상태를 UI에 반영**합니다.
- 로그아웃 시 `supabase.auth.signOut()`으로 세션을 초기화합니다.

```javascript
export async function signInWithProvider(provider) {
  await supabase.auth.signOut(); // 기존 세션 삭제 후 로그인 진행

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: { redirectTo: window.location.origin + "/index.html" },
  });

  if (error) {
    console.error(`🛑 ${provider} 로그인 오류:`, error.message);
  } else {
    console.log(`✅ ${provider} 로그인 요청 성공`);
  }
}
```

---

### 2️⃣ **게시글 관리 (`posts.js`)**
- `loadPosts()` → 게시글 목록을 불러와 화면에 표시
- `savePost()` → 게시글 작성 & Base64로 이미지 변환 후 업로드
- `updatePost()` → 게시글 수정
- `deletePost()` → 게시글 삭제

```javascript
export async function loadPosts() {
  const response = await fetch(`${API_URL}/posts`);
  const posts = await response.json();

  const postList = document.getElementById("postList");
  postList.innerHTML = "";

  posts.forEach((post) => createPostElement(post));
}
```

#### 📌 **게시글 UI 동적 생성**
- `createPostElement(post)`에서 HTML을 생성하여 `postList`에 추가합니다.
- 게시글 수정/삭제 버튼이 포함되어 있으며, 각 버튼에 이벤트 리스너를 연결합니다.

```javascript
function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.classList.add("post-card");
  postDiv.dataset.postId = post.id; // ✅ 게시글 ID 저장

  let imageTag = post.image_url
    ? `<div class="post-image"><img src="${post.image_url}" alt="게시물 이미지"></div>`
    : "";

  postDiv.innerHTML = `
    <div id="view-mode-${post.id}">
        ${imageTag}
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <button class="edit-btn">✏ 수정</button>
        <button class="delete-btn">🗑 삭제</button>
    </div>
  `;

  postDiv.querySelector(".edit-btn").addEventListener("click", () => enableEditMode(post.id));
  postDiv.querySelector(".delete-btn").addEventListener("click", () => deletePost(post.id));

  document.getElementById("postList").appendChild(postDiv);
}
```

---

### 3️⃣ **댓글 관리 (`comments.js`)**
- `loadComments(board_id)` → 특정 게시글의 댓글 목록을 불러오기
- `addComment(board_id)` → 댓글 작성
- `updateComment(commentId, board_id)` → 댓글 수정
- `deleteComment(commentId, board_id)` → 댓글 삭제

```javascript
export async function loadComments(board_id) {
  const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
  const comments = await response.json();

  const commentsDiv = document.getElementById(`comments-${board_id}`);
  commentsDiv.innerHTML = "";

  comments.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment-box");

    commentElement.innerHTML = `
      <p>${comment.content}</p>
      <button class="edit-btn">✏ 수정</button>
      <button class="delete-btn">🗑 삭제</button>
    `;

    commentElement.querySelector(".delete-btn").addEventListener("click", () => deleteComment(comment.id, board_id));
    commentsDiv.appendChild(commentElement);
  });
}
```

---

### 4️⃣ **이벤트 관리 (`main.js`)**
- **이벤트 위임 방식**을 사용하여 `click` 이벤트를 하나의 리스너에서 관리합니다.
- `event.target.classList.contains("edit-btn")` 등으로 클릭한 버튼을 확인 후 적절한 함수를 실행합니다.

```javascript
document.addEventListener("click", (event) => {
  const postDiv = event.target.closest(".post-card");
  const commentBox = event.target.closest(".comment-box");

  if (postDiv) {
    const postId = postDiv.dataset.postId;

    if (event.target.classList.contains("edit-btn")) {
      enableEditMode(postId);
    }

    if (event.target.classList.contains("delete-btn") && !commentBox) {
      deletePost(postId);
    }

    if (event.target.classList.contains("comment-btn")) {
      addComment(postId);
    }
  }

  if (commentBox) {
    const commentId = commentBox.dataset.commentId;
    const postId = commentBox.closest(".post-card").dataset.postId;

    if (event.target.classList.contains("delete-btn")) {
      deleteComment(commentId, postId);
    }
  }
});
```
