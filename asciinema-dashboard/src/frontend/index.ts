import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Popper from "vue3-popper";
import App from './App.vue'


import './base.css'

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.component("Popper", Popper);
app.mount('#app');