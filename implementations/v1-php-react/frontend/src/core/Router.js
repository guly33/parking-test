import AuthService from '../services/AuthService';

export default class Router {
	constructor(routes, rootElement) {
		this.routes = routes;
		this.rootElement = rootElement;
		this.currentPage = null;
	}

	navigate(path) {
		if (path === '/slots' && !AuthService.isLoggedIn()) {
			return this.navigate('/login');
		}

		if (path === '/login' && AuthService.isLoggedIn()) {
			return this.navigate('/slots');
		}

		const PageClass = this.routes[path];

		if (!PageClass) return;

		if (this.currentPage && typeof this.currentPage.destroy === 'function') {
			this.currentPage.destroy();
		}

		this.currentPage = new PageClass(this.rootElement, this);
		this.currentPage.render();

		window.history.pushState({}, '', path);
	}
}