import { supabase } from './supabaseClient.js';

export async function signInWithProvider(provider) {
  console.log(`🔹 ${provider} 로그인 시도...`);
  await supabase.auth.signOut();
  const redirectUrl = `${window.location.origin}/index.html`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: { redirectTo: redirectUrl, prompt: "select_account" },
  });
  if (error) {
    console.error(`🛑 ${provider} 로그인 오류:`, error.message);
  } else {
    console.log(`✅ ${provider} 로그인 요청 보냄:`, data);
  }
}

export async function signOutAndClearSession() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("🛑 로그아웃 실패:", error.message);
  } else {
    console.log("✅ 로그아웃 성공");
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
    window.location.reload();
  }
}

export async function checkLogin() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  console.log("🔹 Supabase 세션 데이터:", sessionData);
  const loginGit = document.querySelector("#login-github");
  const loginGoogle = document.querySelector("#login-google");
  const logoutButton = document.querySelector("#logout");
  if (error || !sessionData?.session) {
    console.warn("🔹 세션 없음, 로그아웃 상태 유지");
    loginGit.style.display = "inline";
    loginGoogle.style.display = "inline";
    logoutButton.style.display = "none";
    return;
  }
  const { data: userCheck, error: userCheckError } = await supabase.auth.getUser();
  if (userCheckError || !userCheck?.user) {
    console.warn("🛑 사용자 계정이 삭제됨! 강제 로그아웃 실행...");
    await supabase.auth.signOut();
    window.location.reload();
    return;
  }
  loginGit.style.display = "none";
  loginGoogle.style.display = "none";
  logoutButton.style.display = "inline";
}

export async function checkAuth() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData?.session) {
    alert("로그인이 필요합니다!");
    return null;
  }
  return sessionData.session.user.id;
}