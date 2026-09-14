'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

import { API_URL, getTokenHeader } from '@/lib/editor-upload';

/**
 * TinyMCE, self-hosted from /public/tinymce - no cloud API key required.
 * Configured for SEO long-form: real H2/H3 structure, image alt text enforced,
 * link rel control, tables, and a word counter.
 */
export function RichTextEditor({
  value,
  onChange,
  onOpenMedia,
  height = 620,
}: {
  value: string;
  onChange: (html: string) => void;
  onOpenMedia?: (insert: (url: string, alt: string) => void) => void;
  height?: number;
}) {
  const insertRef = useRef<((url: string, alt: string) => void) | null>(null);

  return (
    <Editor
      licenseKey="gpl"
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      value={value}
      onEditorChange={onChange}
      init={{
        height,
        menubar: 'edit insert format table',
        branding: false,
        promotion: false,
        statusbar: true,
        resize: true,
        browser_spellcheck: true,
        contextmenu: 'link image table',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'wordcount', 'codesample', 'autosave',
        ],
        toolbar:
          'undo redo | blocks | bold italic underline strikethrough | ' +
          'alignleft aligncenter alignright | bullist numlist outdent indent | ' +
          'link unlink image mediaLibrary media table blockquote codesample hr | ' +
          'removeformat searchreplace visualblocks code fullscreen',
        block_formats:
          'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4; Quote=blockquote; Code=pre',
        // H1 is reserved for the article title, so it is deliberately absent above.
        content_style: `
          body { font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.75; max-width: 46rem; margin: 1rem auto; color: #121417; }
          h2 { font-size: 1.6em; margin-top: 1.6em; color:#03305f; }
          h3 { font-size: 1.3em; margin-top: 1.4em; color:#03305f; }
          blockquote { border-left: 4px solid #b3163c; margin-left: 0; padding-left: 1rem; font-style: italic; }
          img { max-width: 100%; height: auto; }
          a { color: #03305f; }
        `,
        // SEO hygiene: descriptive alt text and safe external links.
        image_advtab: true,
        image_title: true,
        image_caption: true,
        a11y_advanced_options: true,
        link_default_target: '_blank',
        link_default_protocol: 'https',
        rel_list: [
          { title: 'Default (noopener)', value: 'noopener noreferrer' },
          { title: 'Sponsored', value: 'noopener noreferrer sponsored' },
          { title: 'No follow', value: 'noopener noreferrer nofollow' },
          { title: 'User generated', value: 'noopener noreferrer ugc' },
        ],
        paste_data_images: false,
        automatic_uploads: true,
        images_upload_handler: uploadImage,
        file_picker_types: 'image',
        autosave_interval: '30s',
        autosave_retention: '60m',
        table_default_attributes: { class: 'table' },
        setup: (editor) => {
          insertRef.current = (url: string, alt: string) => {
            editor.insertContent(`<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`);
          };
          editor.ui.registry.addButton('mediaLibrary', {
            icon: 'gallery',
            tooltip: 'Insert from media library',
            onAction: () => {
              if (onOpenMedia && insertRef.current) onOpenMedia(insertRef.current);
            },
          });
        },
      }}
    />
  );
}

/** Uploads pasted/dropped images straight into the media library. */
function uploadImage(blobInfo: { blob: () => Blob; filename: () => string }): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', blobInfo.blob(), blobInfo.filename());
    fetch(`${API_URL}/api/admin/media/tinymce`, {
      method: 'POST',
      headers: getTokenHeader(),
      body: form,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          reject({ message: body.detail ?? `Upload failed (${res.status})`, remove: true });
          return;
        }
        const data = await res.json();
        // The editor needs an absolute URL so the preview renders correctly.
        resolve(data.location.startsWith('http') ? data.location : `${API_URL}${data.location}`);
      })
      .catch((err) => reject({ message: String(err), remove: true }));
  });
}
