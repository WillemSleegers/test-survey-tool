import type { Components } from "react-markdown"
import remarkBreaks from "remark-breaks"

export const remarkPlugins = [remarkBreaks]

export const markdownImageComponents: Components = {
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="max-w-full rounded-md my-2" />
  ),
}
