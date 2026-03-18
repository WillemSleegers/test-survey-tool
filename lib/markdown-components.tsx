import type { Components } from "react-markdown"

export const markdownImageComponents: Components = {
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="max-w-full rounded-md my-2" />
  ),
}
