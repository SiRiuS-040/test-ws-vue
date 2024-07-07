import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/components/MainPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Главная страница',
      component: MainPage
    }
  ]
})

export default router
