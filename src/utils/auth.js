export const isAuthenticated = () => Boolean(localStorage.getItem('token'));

export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  window.dispatchEvent(new Event('auth-change'));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-change'));
};
