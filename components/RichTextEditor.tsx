'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Undo,
  Redo,
} from 'lucide-react'

type PortableTextMark = 'strong' | 'em' | 'code' | 'link'

type PortableTextBlock = {
  _type: string
  style?: string
  children: {
    _type: string
    text: string
    marks?: PortableTextMark[]
  }[]
}

type RichTextEditorProps = {
  content: PortableTextBlock[] | string
  onChange: (content: PortableTextBlock[]) => void
  placeholder?: string
}

// Convert HTML to Portable Text
function htmlToPortableText(html: string): PortableTextBlock[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const blocks: PortableTextBlock[] = []

  function processNode(node: Node): PortableTextBlock | null {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return {
        _type: 'block',
        style: 'normal',
        children: [{
          _type: 'span',
          text: node.textContent
        }]
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const block: PortableTextBlock = {
        _type: 'block',
        children: []
      }

      // Handle block styles
      switch (element.tagName.toLowerCase()) {
        case 'h1':
          block.style = 'h1'
          break
        case 'h2':
          block.style = 'h2'
          break
        case 'h3':
          block.style = 'h3'
          break
        case 'p':
          block.style = 'normal'
          break
        case 'blockquote':
          block.style = 'blockquote'
          break
        case 'pre':
          block.style = 'code'
          break
        default:
          block.style = 'normal'
      }

      // Process child nodes
      element.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
          const span = {
            _type: 'span',
            text: child.textContent,
            marks: [] as PortableTextMark[]
          }

          // Handle marks
          if (element.tagName.toLowerCase() === 'strong' || element.tagName.toLowerCase() === 'b') {
            span.marks = ['strong']
          } else if (element.tagName.toLowerCase() === 'em' || element.tagName.toLowerCase() === 'i') {
            span.marks = ['em']
          } else if (element.tagName.toLowerCase() === 'code') {
            span.marks = ['code']
          } else if (element.tagName.toLowerCase() === 'a') {
            span.marks = ['link']
            // You might want to store the href somewhere
          }

          block.children.push(span)
        } else {
          const childBlock = processNode(child)
          if (childBlock) {
            block.children.push(...childBlock.children)
          }
        }
      })

      if (block.children.length > 0) {
        return block
      }
    }

    return null
  }

  doc.body.childNodes.forEach(node => {
    const block = processNode(node)
    if (block) {
      blocks.push(block)
    }
  })

  return blocks
}

// Convert Portable Text to HTML
function portableTextToHtml(blocks: PortableTextBlock[]): string {
  return blocks.map(block => {
    const content = block.children.map(child => {
      let text = child.text

      // Apply marks
      if (child.marks) {
        child.marks.forEach(mark => {
          switch (mark) {
            case 'strong':
              text = `<strong>${text}</strong>`
              break
            case 'em':
              text = `<em>${text}</em>`
              break
            case 'code':
              text = `<code>${text}</code>`
              break
            case 'link':
              // You might want to handle href here
              text = `<a href="#">${text}</a>`
              break
          }
        })
      }

      return text
    }).join('')

    // Apply block style
    switch (block.style) {
      case 'h1':
        return `<h1>${content}</h1>`
      case 'h2':
        return `<h2>${content}</h2>`
      case 'h3':
        return `<h3>${content}</h3>`
      case 'blockquote':
        return `<blockquote>${content}</blockquote>`
      case 'code':
        return `<pre><code>${content}</code></pre>`
      default:
        return `<p>${content}</p>`
    }
  }).join('\n')
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing your article...',
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Convert initial content if it's Portable Text
  const initialContent = typeof content === 'string' ? content : portableTextToHtml(content)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        allowBase64: true,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-lg focus:outline-none max-w-full',
      },
    },
    onUpdate({ editor }: { editor: Editor }) {
      // Convert HTML to Portable Text before calling onChange
      const html = editor.getHTML()
      const portableText = htmlToPortableText(html)
      onChange(portableText)
    },
  })

  // Handle creating a link
  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) return

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  // Handle adding an image
  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  // Ensure hydration issues are avoided
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full border rounded-md">
      <div className="flex flex-wrap gap-1 p-2 bg-muted border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
          type="button"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
          type="button"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={editor.isActive('link') ? 'bg-accent' : ''}
          type="button"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <div className="flex-1"></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          type="button"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          type="button"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-background shadow-md border rounded-md flex overflow-hidden"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-accent' : ''}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-accent' : ''}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={editor.isActive('link') ? 'bg-accent' : ''}
            type="button"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      <div className="p-4 min-h-[300px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
} 