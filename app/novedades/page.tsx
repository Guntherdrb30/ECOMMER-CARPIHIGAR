import Link from 'next/link';

// --- DATOS DE EJEMPLO PARA EL BLOG ---
// En el futuro, esto vendría de una base de datos (ej. Prisma)
const posts = [
  {
    id: 1,
    title: 'La Guía Definitiva para Elegir los Herrajes Perfectos para tus Muebles',
    slug: 'guia-definitiva-herrajes-perfectos',
    excerpt: 'Los herrajes son los detalles que marcan la diferencia. Aprende a seleccionar las piezas que no solo complementan tu estilo, sino que también garantizan durabilidad y funcionalidad en cada apertura y cierre.',
    imageUrl: 'https://picsum.photos/seed/carpinteria1/1200/800',
    authorName: 'Ana Martínez',
    authorAvatarUrl: 'https://i.pravatar.cc/150?u=ana.martinez',
    date: 'Oct 10, 2025',
    featured: true,
  },
  {
    id: 2,
    title: '5 Tendencias en Diseño de Cocinas que Dominarán el 2026',
    slug: 'tendencias-diseno-cocinas-2026',
    excerpt: 'Desde islas multifuncionales hasta gabinetes inteligentes y materiales sostenibles. Te presentamos las tendencias que transformarán tu cocina en el corazón del hogar del futuro.',
    imageUrl: 'https://picsum.photos/seed/cocina1/1200/800',
    authorName: 'Carlos Pérez',
    authorAvatarUrl: 'https://i.pravatar.cc/150?u=carlos.perez',
    date: 'Sep 28, 2025',
  },
  {
    id: 3,
    title: 'Pisos de Vinil vs. Laminados: ¿Cuál es la Mejor Opción para tu Hogar?',
    slug: 'pisos-vinil-vs-laminados',
    excerpt: 'Ambos son elegantes y duraderos, pero tienen diferencias clave. Analizamos la resistencia, instalación, mantenimiento y costo para ayudarte a tomar la decisión correcta para cada espacio de tu casa.',
    imageUrl: 'https://picsum.photos/seed/pisos1/1200/800',
    authorName: 'Laura Gómez',
    authorAvatarUrl: 'https://i.pravatar.cc/150?u=laura.gomez',
    date: 'Sep 15, 2025',
  },
  {
    id: 4,
    title: 'El Arte del Almacenamiento: Soluciones de Closet para Espacios Pequeños',
    slug: 'soluciones-closet-espacios-pequenos',
    excerpt: 'Maximiza cada centímetro de tu habitación con estas soluciones de almacenamiento inteligentes. Desde organizadores modulares hasta trucos de diseño que crean una sensación de amplitud.',
    imageUrl: 'https://picsum.photos/seed/closet1/1200/800',
    authorName: 'Javier Rodríguez',
    authorAvatarUrl: 'https://i.pravatar.cc/150?u=javier.rodriguez',
    date: 'Sep 05, 2025',
  },
];

const FeaturedPostCard = ({ post }: { post: typeof posts[0] }) => (
  <Link href={`/novedades/${post.slug}`}>
    <div className="group grid md:grid-cols-2 gap-8 md:gap-12 items-center bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
      <div className="overflow-hidden rounded-xl">
        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div>
        <p className="text-brand font-semibold text-sm mb-2">Artículo Destacado</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-brand transition-colors duration-300">{post.title}</h2>
        <p className="text-gray-600 mb-6">{post.excerpt}</p>
        <div className="flex items-center">
          <img src={post.authorAvatarUrl} alt={post.authorName} className="w-10 h-10 rounded-full mr-4" />
          <div>
            <p className="font-semibold text-gray-800">{post.authorName}</p>
            <p className="text-sm text-gray-500">{post.date}</p>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

const PostCard = ({ post }: { post: typeof posts[0] }) => (
  <Link href={`/novedades/${post.slug}`}>
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
      <div className="overflow-hidden">
        <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand transition-colors duration-300 flex-grow">{post.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
        <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
          <img src={post.authorAvatarUrl} alt={post.authorName} className="w-9 h-9 rounded-full mr-3" />
          <div>
            <p className="font-semibold text-sm text-gray-800">{post.authorName}</p>
            <p className="text-xs text-gray-500">{post.date}</p>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

export default function NovedadesPage() {
  const featuredPost = posts.find(p => p.featured) || posts[0];
  const otherPosts = posts.filter(p => p.id !== featuredPost.id);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Novedades y Tendencias</h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Ideas, guías y las últimas tendencias del mundo del diseño de interiores y la carpintería.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && <FeaturedPostCard post={featuredPost} />}

        {/* Grid of Other Posts */}
        <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Más Artículos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>

        {posts.length === 0 && (
            <div className="text-center py-16 border-t border-gray-200 mt-16">
                <h2 className="text-2xl font-semibold text-gray-700">Próximamente</h2>
                <p className="mt-2 text-gray-500">Estamos preparando contenido increíble para ti. ¡Vuelve pronto!</p>
            </div>
        )}
      </div>
    </div>
  );
}