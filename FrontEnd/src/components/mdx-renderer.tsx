"use client";

import { MDXRemote } from "next-mdx-remote/rsc";

interface MdxRendererProps {
  contentMDX: string;
  components: Record<string, React.ComponentType<any>>;
}

export function MdxRenderer({ contentMDX, components }: MdxRendererProps) {
  if (!contentMDX) {
    return null;
  }

  // MDXRemote requires a string source and a components dictionary
  return <MDXRemote source={contentMDX} components={components} />;
}
