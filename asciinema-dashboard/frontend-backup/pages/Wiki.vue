
  
<script lang="ts">
  import VueMarkdown from 'vue-markdown-render'
  import MarkdownItAnchor from 'markdown-it-anchor'
  import MarkdownItPlantUML from 'markdown-it-plantuml'
  import { defineComponent, onUpdated, ref, watchEffect} from 'vue'
  import { watch } from 'vue'
  import { useRoute } from 'vue-router'
  import hljs from 'highlight.js'
  function useOptions(plugin: any, options: any){
    return (instance: any) => instance.use(plugin, options)
  }
  const markdownAnchorPlugin = useOptions(MarkdownItAnchor, {
    permalink: MarkdownItAnchor.permalink.linkInsideHeader({
      symbol: `
        <span class="hidden">Jump to heading</span>
        <span aria-hidden="true">#</span>
      `,
      placement: 'before'
    })
  })
  export default defineComponent({
    name: 'MyComponent',
    components: {
      VueMarkdown
    },
    setup(props, ctx) {
      const route = useRoute()
      const options = ref()
      const plugins = ref([markdownAnchorPlugin, MarkdownItPlantUML])
      const src = ref('...Loading')
      const error = ref(false)
      onUpdated(() => {
        // tell highlightjs to use plaintext for inline code
        document.getElementById('prose-markdown-wrapper')?.querySelectorAll(':not(pre) > code').forEach((el) => {
          el.classList.add('language-plaintext')
        });
        // highlight all the code
        document.getElementById('prose-markdown-wrapper')?.querySelectorAll('code').forEach((el) => {
          hljs.highlightElement(el as HTMLElement, );
        });
      })
      watch(
        () => route.params.identifier,
        (newId, oldId) => {
          fetch(`/markdown/${(typeof newId == 'string' ? newId : newId.join("/") )}`)
            .then((resp) => {
              if (resp.ok) {
                return resp.text()
              } else {
                error.value = true
              }
            })
            .then((text) => {
              src.value = text ?? ''
            })
            .catch(() => {

            })

        },
        {
          immediate: true
        }
      )
      return {
        src, error, plugins, options
      }
    },
  })
</script>

<template>
  <div id="prose-markdown-wrapper" class="prose dark:prose-invert m-5 !w-2/3 !max-w-full">
    <vue-markdown v-if="!error" :source="src" :plugins="plugins" :options="options" />
    <div v-else>Oops!</div>
  </div>
</template>