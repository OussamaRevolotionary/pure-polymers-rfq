import { Fragment } from 'react'

const ARABIC = /[؀-ۿ]/

/** **bold** only; everything else stays literal text (React escapes it). */
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}

/**
 * Minimal, injection-safe renderer for assistant replies: paragraphs, "- " and
 * "1. " lists, **bold**. No HTML is ever interpreted.
 */
export default function RichText({ text }) {
  const blocks = text.trim().split(/\n{2,}/)
  return (
    <div dir={ARABIC.test(text) ? 'rtl' : 'ltr'} className="space-y-2.5">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n')
        const isList = lines.every((line) => /^\s*(-|•|\d+\.)\s+/.test(line) || !line.trim())
        if (isList) {
          const ordered = /^\s*\d+\./.test(lines[0])
          const Tag = ordered ? 'ol' : 'ul'
          return (
            <Tag key={blockIndex} className={`space-y-1.5 ps-4 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-brand-lime`}>
              {lines
                .filter((line) => line.trim())
                .map((line, i) => (
                  <li key={i}>{inline(line.replace(/^\s*(-|•|\d+\.)\s+/, ''))}</li>
                ))}
            </Tag>
          )
        }
        return (
          <div key={blockIndex} className="space-y-1.5">
            {lines.map((line, i) =>
              /^\s*(-|•)\s+/.test(line) ? (
                <p key={i} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-brand-lime" />
                  <span>{inline(line.replace(/^\s*(-|•)\s+/, ''))}</span>
                </p>
              ) : (
                <p key={i}>{inline(line)}</p>
              ),
            )}
          </div>
        )
      })}
    </div>
  )
}
