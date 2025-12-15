import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase/firebase'

import Dashboard from '../views/Dashboard.vue'
import Courses from '../views/Courses.vue'
import Planning from '../views/Planning.vue'
import AiAssistant from '../views/AiAssistant.vue'
import Premium from '../views/Premium.vue'
import Settings from '../views/Settings.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import LandingPage from '../landing/LandingPage.vue'

const routes = [
    { path: '/welcome', component: LandingPage, name: 'LandingPage' },
    { path: '/', component: Dashboard, name: 'Dashboard', meta: { requiresAuth: true } },
    { path: '/courses', component: Courses, name: 'Courses', meta: { requiresAuth: true } },
    { path: '/planning', component: Planning, name: 'Planning', meta: { requiresAuth: true } },
    { path: '/ai-assistant', component: AiAssistant, name: 'AiAssistant', meta: { requiresAuth: true } },
    { path: '/premium', component: Premium, name: 'Premium', meta: { requiresAuth: true } },
    { path: '/settings', component: Settings, name: 'Settings', meta: { requiresAuth: true } },
    { path: '/login', component: Login, name: 'Login' },
    { path: '/register', component: Register, name: 'Register' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    const currentUser = await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });

    if (requiresAuth && !currentUser) {
        next('/welcome');
    } else if (!requiresAuth && currentUser && (to.path === '/login' || to.path === '/register' || to.path === '/welcome')) {
        next('/');
    } else {
        next();
    }
});

export default router
