function renderNav(user) {
  const el = document.getElementById('nav-auth');
  if (!el) return;

  if (user) {
    el.innerHTML = `
      <a href="generate.html">Generate</a>
      <a href="profile.html">Profile</a>
      ${user.role === 'admin' ? '<a href="admin.html">Admin</a>' : ''}
      <button class="btn btn-small btn-secondary" id="nav-logout">Sign out</button>
    `;
    document.getElementById('nav-logout')?.addEventListener('click', async () => {
      await window.novoApi.logout();
      window.location.href = 'index.html';
    });
  } else {
    el.innerHTML = `
      <a href="login.html">Sign in</a>
      <a href="register.html" class="btn btn-small btn-primary">Get started</a>
    `;
  }
}

async function requireAuth(redirectTo = 'login.html') {
  try {
    const { user } = await window.novoApi.me();
    renderNav(user);
    return user;
  } catch {
    window.location.href = redirectTo + '?next=' + encodeURIComponent(window.location.pathname);
    return null;
  }
}

async function initNav() {
  try {
    const { user } = await window.novoApi.me();
    renderNav(user);
    return user;
  } catch {
    renderNav(null);
    return null;
  }
}

window.novoAuth = { renderNav, requireAuth, initNav };
