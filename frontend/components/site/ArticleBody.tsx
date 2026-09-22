import { getAdUnit } from '@/lib/site-settings';

import { AdSlotClient } from './AdSlotClient';

/**
 * Renders sanitised article HTML and drops an in-article ad after the third
 * paragraph - the placement AdSense recommends for long-form news.
 */
export async function ArticleBody({ html }: { html: string }) {
  const unit = await getAdUnit('in_article');
  if (!unit) {
    return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const [before, after] = splitAfterParagraph(html, 3);
  if (!after) {
    return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <>
      <div className="article-body" dangerouslySetInnerHTML={{ __html: before }} />
      <AdSlotClient client={unit.client} slot={unit.slot} format="in-article" />
      <div className="article-body" dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}

/** Split on a top-level </p> boundary so no tag is ever left unclosed. */
function splitAfterParagraph(html: string, count: number): [string, string | null] {
  let index = -1;
  for (let i = 0; i < count; i += 1) {
    const next = html.indexOf('</p>', index + 1);
    if (next === -1) return [html, null];
    index = next;
  }
  const cut = index + 4;
  const tail = html.slice(cut).trim();
  return tail.length > 400 ? [html.slice(0, cut), tail] : [html, null];
}
