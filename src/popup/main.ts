import { createApp } from 'vue'
import App from './Popup.vue'
import { setupApp } from '~/utils/common-setup'
import '../styles'

const app = createApp(App)
setupApp(app)
app.mount('#app')
