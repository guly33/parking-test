const CREDENTIALS = {
	'test': 'test',
	'test1': 'test1',
	'test2': 'test2',
	'driver1': 'password123'

};

const STORAGE_KEY = 'parking_auth_token';

export default {
	async login(username, password) {
		try {
			// Call Real API (V2 Python)
			const res = await fetch('http://localhost:8082/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			if (!res.ok) throw new Error('Login failed');

			const data = await res.json();
			// Store JWT
			sessionStorage.setItem('token', data.token); // Store JWT properly
			sessionStorage.setItem(STORAGE_KEY, username); // Keep username for display
			sessionStorage.setItem('userId', data.user ? data.user.id : data.userId); // Support V2 nested `user` obj

			return { success: true, username };
		} catch (err) {
			return { success: false, message: 'Invalid credentials' };
		}
	},

	logout() {
		sessionStorage.removeItem(STORAGE_KEY);
		sessionStorage.removeItem('token');
	},

	isLoggedIn() {
		return !!sessionStorage.getItem(STORAGE_KEY);
	},

	getCurrentUser() {
		return sessionStorage.getItem(STORAGE_KEY);
	}
};