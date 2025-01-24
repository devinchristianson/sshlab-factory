import { createWebHistory, createRouter } from 'vue-router'
import Dashboard from './pages/Dashboard.vue'
import Intro from './pages/Intro.vue'
import Wiki from './pages/Wiki.vue'

const routes = [
  { path: '/', component: Dashboard },
  { path: '/intro', component: Intro },
  { path: '/wiki/:identifier+', component: Wiki },
]

export const Router = createRouter({
  history: createWebHistory(),
  routes,
})