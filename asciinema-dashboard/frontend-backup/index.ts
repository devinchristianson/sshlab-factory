import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Popper from "vue3-popper";
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css';
import App from './App.vue'
import {Router} from './router'
import { VueQueryPlugin } from '@tanstack/vue-query'

import './base.css'

const pinia = createPinia();
const app = createApp(App);
hljs.configure({ cssSelector: 'code' });;
hljs.highlightAll();
app.use(Router)
app.use(pinia);
app.use(VueQueryPlugin)
app.component("Popper", Popper);
app.mount('#app');