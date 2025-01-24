import MarkdownItAnchor from 'markdown-it-anchor'
import MarkdownItPlantUML from 'markdown-it-plantuml'
import hljs from 'highlight.js'
import { useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'
const anchorOptions = {
    permalink: MarkdownItAnchor.permalink.linkInsideHeader({
      symbol: `
        <span class="hidden">Jump to heading</span>
        <span aria-hidden="true">#</span>
      `,
      placement: 'before'
    })
}

const md = new MarkdownIt({
  linkify: true,
  typographer: true,
}).use(MarkdownItPlantUML)
.use(MarkdownItAnchor, anchorOptions);
function Markdown({src}: {src: string}) {
    const [renderedHtml, setRenderedHtml] = useState('');
    useEffect(() => {
        setRenderedHtml(md.render(src))
        // tell highlightjs to use plaintext for inline code
        document.getElementById('prose-markdown-wrapper')?.querySelectorAll(':not(pre) > code').forEach((el) => {
          el.classList.add('language-plaintext')
        });
        // highlight all the code
        document.getElementById('prose-markdown-wrapper')?.querySelectorAll('code').forEach((el) => {
          hljs.highlightElement(el as HTMLElement, );
        });
    }, [src]);
    return (
        <div
            id="prose-markdown-wrapper"
            className="prose dark:prose-invert m-5 !w-2/3 !max-w-full"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
        >
        </div>
    );
}

export default Markdown;