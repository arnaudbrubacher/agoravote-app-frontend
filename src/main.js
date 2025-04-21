import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from './utils/axios'

createApp(App)
  .use(router)
  .mount('#app')