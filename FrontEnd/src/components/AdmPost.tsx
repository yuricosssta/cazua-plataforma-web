"use client";

import { IPost } from "../types/post";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import MarkdownIt from 'markdown-it/index.js';
import highlightjs from 'markdown-it-highlightjs';


 export const AdmPost = ({ post }: { post: IPost | null }) => {
   if (!post) return <p>Página não encontrada</p>;
 
     return (
     <div>       
         <Link href={`/posts/${post._id}/edit`} className="btn btn-secondary">
           Editar
         </Link>             
     </div>
   );
 };
 