"use client";

import { IPost } from "../types/post";
import Link from "next/link";


 export const AdmPost = ({ post }: { post: IPost | null }) => {
   if (!post) return <p>Página não encontrada</p>;
 
     return (
     <div>       
         <Link href={`/posts/${post.id}/edit`} className="btn btn-secondary">
           Editar
         </Link>             
     </div>
   );
 };
 