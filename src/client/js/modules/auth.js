class AuthModule {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = null;
    this.isGuest = false;
  }
  
  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await response.json();
    this.setAuth(data.token, data.user, data.isGuest || false);
    return data;
  }
  
  async register(username, email, password) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await response.json();
    this.setAuth(data.token, data.user, false);
    return data;
  }
  
  async guestLogin() {
    const response = await fetch('/api/auth/guest', {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Guest login failed');
    }
    
    const data = await response.json();
    this.setAuth(data.token, data.user, true);
    return data;
  }
  
  async validate() {
    if (!this.token) return null;
    
    try {
      const response = await fetch('/api/auth/validate', {
        headers: this.getAuthHeader()
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      this.user = data.user;
      return data.user;
    } catch (error) {
      return null;
    }
  }
  
  setAuth(token, user, isGuest) {
    this.token = token;
    this.user = user;
    this.isGuest = isGuest;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('is_guest', isGuest);
  }
  
  logout() {
    this.token = null;
    this.user = null;
    this.isGuest = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('is_guest');
  }
  
  isAuthenticated() {
    return !!this.token;
  }
  
  getAuthHeader() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

export default new AuthModule();