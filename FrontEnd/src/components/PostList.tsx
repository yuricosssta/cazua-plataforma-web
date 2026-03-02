// FrontEnd/src/components/PostList.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
// import { IPost } from "../types/IPost"; // Comentado pois não estava sendo usado na importação explícita
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { fetchPosts, deletePost } from '@/lib/redux/slices/postsSlice';

export const PostList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, status, error, currentPage, totalPages } = useSelector((state: RootState) => state.posts);

  useEffect(() => {
    dispatch(fetchPosts({ page: 1 }));
  }, [dispatch]);

  const handlePageChange = (newPage: number) => {
    dispatch(fetchPosts({ page: newPage }));
  };

  const handleDelete = (_id: string) => {
    if (confirm('Tem certeza que deseja deletar este post?')) {
      dispatch(deletePost(_id)).then(() => {
        if (posts.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        } else {
          dispatch(fetchPosts({ page: currentPage }));
        }
      });
    }
  };

  if (status === 'loading' && posts.length === 0) {
    return <p className="text-center text-muted-foreground py-10">Carregando posts...</p>;
  }

  if (status === 'failed') {
    return <p className="text-center text-destructive py-10">Erro ao carregar posts: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-cazua-primary selection:text-white transition-colors duration-300">
      <div
        className={`relative pt-4 pb-24 px-4 overflow-hidden grid grid-cols-1 gap-16 md:grid-cols-2 transition-opacity duration-300 ${status === 'loading' ? 'opacity-50' : 'opacity-100'}`}
      >
        {posts.map((post) => (
          <div className="break-words" key={post._id}>
            <Link href={`/posts/${post._id}`}>
              {/* CORREÇÃO 2: 'bg-gray-200' virou 'bg-muted'. 
                 No modo escuro, o cinza fica mais escuro automaticamente.
              */}
              <div className="fill aspect-[16/9] relative cursor-pointer bg-muted rounded-md overflow-hidden border border-border">
                 {/* Substituído tag img por Image do Next.js para melhor performance (opcional, mas recomendado) */}
                 <img 
                  alt={post.title} 
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  src={post.image || "https://placehold.co/600x400"}
                  // sizes="(max-width: 768px) 100vw, 50vw"
                /> 
              </div>
            </Link>
            <div className="grid grid-cols-1 gap-3 md:col-span-2 mt-4">
              <h2 className="font-sans font-semibold tracking-tighter text-primary text-2xl md:text-3xl hover:text-primary/80 transition-colors">
                <Link href={`/posts/${post._id}`}>{post.title}</Link>
              </h2>
              {/* text-muted-foreground já estava correto aqui */}
              <div className="prose lg:prose-lg leading-relaxed md:text-lg line-clamp-4 text-muted-foreground">
                {post.content}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="font-medium">
                  {post.author} | Publicado em {Intl.DateTimeFormat("pt-br", { dateStyle: 'long' }).format(
                    new Date(post.modified_at || post.created_at || new Date())
                  )}
                </div>
              </div>
              <Link 
                href={`/posts/${post._id}/edit`} 
                /* CORREÇÃO 3: Classes de botão padronizadas */
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 w-fit"
              >
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de Paginação */}
      {/* CORREÇÃO 4: Removido bg fixo e usado classes do tema */}
      <div className="flex justify-center items-center gap-4 mt-16 pb-10 text-foreground">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || status === 'loading'}
          /* Botões usando bg-secondary (cinza suave) e text-secondary-foreground */
          className="px-4 py-2 rounded-md font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="font-medium">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || status === 'loading'}
          className="px-4 py-2 rounded-md font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

// FrontEnd/src/components/PostList.tsx
// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { IPost } from "../types/IPost";
// import { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/lib/redux/store';
// import { fetchPosts, deletePost } from '@/lib/redux/slices/postsSlice';

// export const PostList = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { posts, status, error, currentPage, totalPages } = useSelector((state: RootState) => state.posts);

//   useEffect(() => {
//     dispatch(fetchPosts({ page: 1 }));
//   }, [dispatch]);

//   const handlePageChange = (newPage: number) => {
//     dispatch(fetchPosts({ page: newPage }));
//   };

//   const handleDelete = (_id: string) => {
//     if (confirm('Tem certeza que deseja deletar este post?')) {
//       dispatch(deletePost(_id)).then(() => {
//         if (posts.length === 1 && currentPage > 1) {
//           handlePageChange(currentPage - 1);
//         } else {
//           dispatch(fetchPosts({ page: currentPage }));
//         }
//       });
//     }
//   };

//   if (status === 'loading' && posts.length === 0) {
//     return <p className="text-center"> Carregando posts...</p>;
//   }

//   if (status === 'failed') {
//     return <p className="text-center text-red-500"> Erro ao carregar posts: {error}</p>;
//   }

//   return (
//     <div className="min-h-screen bg-stone-50 font-sans text-stone-800 selection:bg-[#8B4513] selection:text-white">
//       <div
//         className={`relative pt-30 pb-24 px-4 overflow-hidden grid grid-cols-1 gap-16 md:grid-cols-2 px-4 transition-opacity duration-300 ${status === 'loading' ? 'opacity-50' : 'opacity-100'}`}
//       >
//         {posts.map((post) => (
//           <div className="break-words" key={post._id}>
//             <Link href={`/posts/${post._id}`}>
//               <div className="fill aspect-[16/9] relative cursor-pointer bg-gray-200">
//                  <img 
//                   alt={post.title} 
//                   className="object-cover"
//                   src={post.image || "https://placehold.co/600x400"}
//                   sizes="(max-width: 768px) 100vw, 50vw"
//                 /> 
//               </div>
//             </Link>
//             <div className="grid grid-cols-1 gap-3 md:col-span-2 mt-4">
//               <h2 className="font-sans font-semibold tracking-tighter text-primary text-2xl md:text-3xl">
//                 <Link href={`/posts/${post._id}`}>{post.title}</Link>
//               </h2>
//               <div className="prose lg:prose-lg leading-relaxed md:text-lg line-clamp-4 text-muted-foreground">
//                 {post.content}
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="font-medium">
//                   {/* {post.author} | Publicado em {formatFullDate(post.modified_at)} */}
//                   {post.author} | Publicado em
//                 </div>
//               </div>
//               <Link href={`/posts/${post._id}/edit`} className="btn btn-sm btn-secondary hover:underline w-fit">
//                 Editar
//               </Link>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Controles de Paginação */}
//       <div className="flex justify-center items-center gap-4 mt-16 bg-stone-50 font-sans text-stone-800 selection:bg-[#8B4513] selection:text-white">
//         <button
//           onClick={() => handlePageChange(currentPage - 1)}
//           disabled={currentPage <= 1 || status === 'loading'}
//           className="px-4 py-2 bg-black-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           Anterior
//         </button>
//         <span>
//           Página {currentPage} de {totalPages}
//         </span>
//         <button
//           onClick={() => handlePageChange(currentPage + 1)}
//           disabled={currentPage >= totalPages || status === 'loading'}
//           className="px-4 py-2 bg-black-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           Próxima
//         </button>
//       </div>
//     </div>
//   );
// };