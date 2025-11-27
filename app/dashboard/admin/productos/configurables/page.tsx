import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getConfigurableProducts, setProductEcpdConfig } from '@/server/actions/ecpd';
import { getProducts, createProduct } from '@/server/actions/products';
import { getCategoriesFlattened } from '@/server/actions/categories';
import { getSettings } from '@/server/actions/settings';
import HeroMediaUploader from '@/components/admin/hero-media-uploader';
import ImagesUploader from '@/components/admin/images-uploader2';
import ShowToastFromSearch from '@/components/show-toast-from-search';

const defaultSchema = {
  name: 'Armario Nidus',
  dimensions: {
    width: { min: 130, max: 230 },
    depth: { min: 30, max: 110 },
    height: { min: 33, max: 65 },
  },
  initialDimensions: {
    width: 130,
    depth: 30,
    height: 33,
  },
  components: {
    shelves: { min: 1, max: 7 },
    drawers: { min: 1, max: 3, spacePerDrawer: 20 },
    maletero: { min: 0, max: 50 },
    hangingBar: { type: 'boolean' },
    rodapieAMedida: {
      type: 'conditional',
      requires: 'rodapieAMedida',
      dimension: { min: 6, max: 20 },
    },
  },
  aesthetics: {
    doors: ['Una', 'Dos', 'Sin puertas'],
    colors: ['Arena', 'Nogal oscuro', 'Gris claro'],
    handles: [],
  },
  pricing: {
    referencePrice: 300,
    referenceVolume: 130 * 30 * 33,
    surcharges: {
      oneDoor: 14.99,
      twoDoors: 29.99,
      noRodapie: 2,
      rodapieAMedida: 7,
    },
  },
};

export default async function ConfigurableProductsPage({
  searchParams,
}: {
  searchParams?: { q?: string; editId?: string };
}) {
  const session = await getServerSession(authOptions as any);
  const role = String((session?.user as any)?.role || '');
  if (!session?.user || role !== 'ADMIN') {
    redirect('/auth/login?callbackUrl=/dashboard/admin/productos/configurables');
  }

  const [allProducts, configurable, categories, settings] = await Promise.all([
    getProducts(),
    getConfigurableProducts(),
    getCategoriesFlattened(),
    getSettings(),
  ]);

  const rawColors = Array.isArray((settings as any).ecpdColors)
    ? ((settings as any).ecpdColors as any[])
    : [];
  const ecpdColors =
    rawColors.length > 0
      ? rawColors
      : [
          { name: 'Arena', description: '', image: '' },
          { name: 'Nogal oscuro', description: '', image: '' },
          { name: 'Gris claro', description: '', image: '' },
        ];

  const q = String(searchParams?.q || '').trim();
  const qLower = q.toLowerCase();

  const configurableFiltered = configurable.filter((p: any) => {
    if (!p.isConfigurable) return false;
    if (!qLower) return true;
    const name = String(p.name || '').toLowerCase();
    const slug = String(p.slug || '').toLowerCase();
    return name.includes(qLower) || slug.includes(qLower);
  });

  const configurableIds = new Set(
    configurableFiltered.map((p: any) => p.id),
  );

  const editId = String((searchParams as any)?.editId || '').trim();
  const editing = editId ? configurable.find((p: any) => p.id === editId) || null : null;
  const editingSchema: any =
    editing && (editing as any).configSchema ? (editing as any).configSchema : null;
  const editingDimensions = editingSchema?.dimensions || defaultSchema.dimensions;
  const editingInitialDimensions =
    editingSchema?.initialDimensions || {
      width: editingDimensions.width.min,
      depth: editingDimensions.depth.min,
      height: editingDimensions.height.min,
    };
  const editingColors: string[] =
    Array.isArray(editingSchema?.aesthetics?.colors) && editingSchema.aesthetics.colors.length
      ? (editingSchema.aesthetics.colors as string[])
      : defaultSchema.aesthetics.colors;
  const editingHasCombos = editingColors.some((c) => c.includes('+'));
  const editingColorsLower = editingColors.map((c) => String(c || '').toLowerCase());
  const isColorAllowedForEditing = (name: string | undefined) => {
    if (!name) return false;
    const n = String(name).toLowerCase();
    return editingColorsLower.some((opt) => {
      if (!opt) return false;
      if (opt === n) return true;
      return opt.includes(`${n} +`) || opt.includes(`+ ${n}`);
    });
  };

  async function setConfigurable(formData: FormData) {
    'use server';
    const productId = String(formData.get('productId') || '');
    const schemaText = String(formData.get('schema') || '').trim();
    if (!productId) {
      redirect('/dashboard/admin/productos/configurables?error=Producto%20requerido');
    }
    let schema: any = null;
    if (schemaText) {
      try {
        schema = JSON.parse(schemaText);
      } catch {
        redirect(
          '/dashboard/admin/productos/configurables?error=El%20JSON%20no%20es%20v%C3%A1lido',
        );
      }
    } else {
      schema = defaultSchema;
    }
    await setProductEcpdConfig(productId, {
      name: String(schema?.name || 'Configurador'),
      schema,
    });
    redirect(
      '/dashboard/admin/productos/configurables?message=Configurador%20actualizado',
    );
  }

  async function disableConfigurable(formData: FormData) {
    'use server';
    const productId = String(formData.get('productId') || '');
    if (!productId) {
      redirect('/dashboard/admin/productos/configurables');
    }
    await setProductEcpdConfig(productId, null);
    redirect(
      '/dashboard/admin/productos/configurables?message=Configurador%20desactivado',
    );
  }

  async function createConfigurableProduct(formData: FormData) {
    'use server';
    const name = String(formData.get('name') || '').trim();
    if (!name) {
      redirect(
        '/dashboard/admin/productos/configurables?error=Nombre%20requerido',
      );
    }
    const slug = String(formData.get('slug') || '').trim();
    const brand =
      String(formData.get('brand') || '').trim() || 'Carpihogar';
    const description = String(formData.get('description') || '').trim();
    const priceUSD = parseFloat(String(formData.get('priceUSD') || '0'));
    const stockUnits = parseInt(String(formData.get('stockUnits') || '0'), 10);
    const mainImage = String(formData.get('mainImage') || '').trim();
    const extraImages = (formData.getAll('images[]') as string[]).map(String).filter(Boolean);
    const categoryId = String(formData.get('categoryId') || '') || null;

    // Medidas mínimas y máximas
    const widthMinRaw = parseFloat(String(formData.get('widthMin') || '0'));
    const widthMaxRaw = parseFloat(String(formData.get('widthMax') || '0'));
    const heightMinRaw = parseFloat(String(formData.get('heightMin') || '0'));
    const heightMaxRaw = parseFloat(String(formData.get('heightMax') || '0'));
    const depthMinRaw = parseFloat(String(formData.get('depthMin') || '0'));
    const depthMaxRaw = parseFloat(String(formData.get('depthMax') || '0'));

    const widthMin =
      !isNaN(widthMinRaw) && widthMinRaw > 0
        ? widthMinRaw
        : defaultSchema.dimensions.width.min;
    const widthMax =
      !isNaN(widthMaxRaw) && widthMaxRaw > 0
        ? widthMaxRaw
        : defaultSchema.dimensions.width.max;
    const heightMin =
      !isNaN(heightMinRaw) && heightMinRaw > 0
        ? heightMinRaw
        : defaultSchema.dimensions.height.min;
    const heightMax =
      !isNaN(heightMaxRaw) && heightMaxRaw > 0
        ? heightMaxRaw
        : defaultSchema.dimensions.height.max;
    const depthMin =
      !isNaN(depthMinRaw) && depthMinRaw > 0
        ? depthMinRaw
        : defaultSchema.dimensions.depth.min;
    const depthMax =
      !isNaN(depthMaxRaw) && depthMaxRaw > 0
        ? depthMaxRaw
        : defaultSchema.dimensions.depth.max;

    // Medidas iniciales recomendadas
    const widthInitialRaw = parseFloat(
      String(formData.get('widthInitial') || '0'),
    );
    const heightInitialRaw = parseFloat(
      String(formData.get('heightInitial') || '0'),
    );
    const depthInitialRaw = parseFloat(
      String(formData.get('depthInitial') || '0'),
    );

    let widthInitial =
      !isNaN(widthInitialRaw) && widthInitialRaw > 0
        ? widthInitialRaw
        : widthMin;
    let heightInitial =
      !isNaN(heightInitialRaw) && heightInitialRaw > 0
        ? heightInitialRaw
        : heightMin;
    let depthInitial =
      !isNaN(depthInitialRaw) && depthInitialRaw > 0
        ? depthInitialRaw
        : depthMin;

    // Asegurar que las iniciales est�n dentro de los rangos
    widthInitial = Math.min(Math.max(widthInitial, widthMin), widthMax);
    heightInitial = Math.min(Math.max(heightInitial, heightMin), heightMax);
    depthInitial = Math.min(Math.max(depthInitial, depthMin), depthMax);

    // Colores permitidos
    const allowedColors: string[] = [];
    for (let i = 0; i < 5; i++) {
      const flag = formData.get(`colorAllowed${i}`);
      const nameFromForm = String(formData.get(`colorName${i}`) || '').trim();
      if (flag && nameFromForm) {
        allowedColors.push(nameFromForm);
      }
    }
    const allowColorCombos =
      String(formData.get('allowColorCombos') || '') === 'on';

    const colorOptions: string[] = [...allowedColors];
    if (allowColorCombos && allowedColors.length >= 2) {
      for (let i = 0; i < allowedColors.length; i++) {
        for (let j = i + 1; j < allowedColors.length; j++) {
          colorOptions.push(`${allowedColors[i]} + ${allowedColors[j]}`);
        }
      }
    }

    const finalColorOptions =
      colorOptions.length > 0
        ? colorOptions
        : ['Arena', 'Nogal oscuro', 'Gris claro'];

    const referenceVolume = widthInitial * depthInitial * heightInitial;

    const schema: any = {
      ...defaultSchema,
      name,
      dimensions: {
        width: { min: widthMin, max: widthMax },
        depth: { min: depthMin, max: depthMax },
        height: { min: heightMin, max: heightMax },
      },
      initialDimensions: {
        width: widthInitial,
        depth: depthInitial,
        height: heightInitial,
      },
      components: {
        ...defaultSchema.components,
      },
      aesthetics: {
        ...defaultSchema.aesthetics,
        colors: finalColorOptions,
        handles: [],
      },
      pricing: {
        ...defaultSchema.pricing,
        referenceVolume,
      },
    };

    const allImages = mainImage ? [mainImage, ...extraImages] : extraImages;

    const product = await createProduct({
      name,
      slug,
      brand,
      description,
      images: allImages.slice(0, 10),
      sku: null,
      barcode: '',
      priceUSD,
      priceAllyUSD: null,
      priceWholesaleUSD: null,
      stock: stockUnits,
      stockUnits,
      stockMinUnits: 0,
      allowBackorder: false,
      type: 'SIMPLE',
      unitsPerPackage: null,
      stockPackages: null,
      soldBy: 'UNIT',
      weightKg: null,
      // Medidas base del producto simple (sin personalizar)
      // para que coincidan con las medidas iniciales recomendadas.
      heightCm: heightInitial,
      widthCm: widthInitial,
      depthCm: depthInitial,
      freightType: null,
      categoryId,
      supplierId: null,
      isNew: true,
      videoUrl: null,
      showSocialButtons: false,
      relatedIds: [],
      isConfigurable: true,
      configSchema: schema,
    } as any);

    await setProductEcpdConfig(String((product as any).id), {
      name: String(schema?.name || name),
      schema,
    });

    redirect(
      '/dashboard/admin/productos/configurables?message=Mueble%20configurable%20creado',
    );
  }

  async function updateConfigurableProduct(formData: FormData) {
    'use server';
    const productId = String(formData.get('productId') || '').trim();
    if (!productId) {
      redirect(
        '/dashboard/admin/productos/configurables?error=Producto%20requerido',
      );
    }

    const allConfig = await getConfigurableProducts();
    const prod = allConfig.find((p: any) => p.id === productId);
    if (!prod) {
      redirect(
        '/dashboard/admin/productos/configurables?error=Producto%20no%20encontrado',
      );
    }

    const baseSchema: any =
      (prod as any).configSchema && Object.keys((prod as any).configSchema || {}).length
        ? (prod as any).configSchema
        : defaultSchema;
    const baseDims = baseSchema.dimensions || defaultSchema.dimensions;
    const baseAesthetics = baseSchema.aesthetics || defaultSchema.aesthetics;

    // Medidas mínimas y máximas
    const widthMinRaw = parseFloat(String(formData.get('widthMin') || '0'));
    const widthMaxRaw = parseFloat(String(formData.get('widthMax') || '0'));
    const heightMinRaw = parseFloat(String(formData.get('heightMin') || '0'));
    const heightMaxRaw = parseFloat(String(formData.get('heightMax') || '0'));
    const depthMinRaw = parseFloat(String(formData.get('depthMin') || '0'));
    const depthMaxRaw = parseFloat(String(formData.get('depthMax') || '0'));

    const widthMin =
      !isNaN(widthMinRaw) && widthMinRaw > 0 ? widthMinRaw : baseDims.width.min;
    const widthMax =
      !isNaN(widthMaxRaw) && widthMaxRaw > 0 ? widthMaxRaw : baseDims.width.max;
    const heightMin =
      !isNaN(heightMinRaw) && heightMinRaw > 0 ? heightMinRaw : baseDims.height.min;
    const heightMax =
      !isNaN(heightMaxRaw) && heightMaxRaw > 0 ? heightMaxRaw : baseDims.height.max;
    const depthMin =
      !isNaN(depthMinRaw) && depthMinRaw > 0 ? depthMinRaw : baseDims.depth.min;
    const depthMax =
      !isNaN(depthMaxRaw) && depthMaxRaw > 0 ? depthMaxRaw : baseDims.depth.max;

    // Medidas iniciales recomendadas
    const baseInitial = baseSchema.initialDimensions || {
      width: baseDims.width.min,
      depth: baseDims.depth.min,
      height: baseDims.height.min,
    };

    const widthInitialRaw = parseFloat(
      String(formData.get('widthInitial') || '0'),
    );
    const heightInitialRaw = parseFloat(
      String(formData.get('heightInitial') || '0'),
    );
    const depthInitialRaw = parseFloat(
      String(formData.get('depthInitial') || '0'),
    );

    let widthInitial =
      !isNaN(widthInitialRaw) && widthInitialRaw > 0
        ? widthInitialRaw
        : baseInitial.width;
    let heightInitial =
      !isNaN(heightInitialRaw) && heightInitialRaw > 0
        ? heightInitialRaw
        : baseInitial.height;
    let depthInitial =
      !isNaN(depthInitialRaw) && depthInitialRaw > 0
        ? depthInitialRaw
        : baseInitial.depth;

    widthInitial = Math.min(Math.max(widthInitial, widthMin), widthMax);
    heightInitial = Math.min(Math.max(heightInitial, heightMin), heightMax);
    depthInitial = Math.min(Math.max(depthInitial, depthMin), depthMax);

    // Colores permitidos
    const allowedColors: string[] = [];
    for (let i = 0; i < 5; i++) {
      const flag = formData.get(`colorAllowed${i}`);
      const nameFromForm = String(formData.get(`colorName${i}`) || '').trim();
      if (flag && nameFromForm) {
        allowedColors.push(nameFromForm);
      }
    }
    const allowColorCombos =
      String(formData.get('allowColorCombos') || '') === 'on';

    const colorOptions: string[] = [...allowedColors];
    if (allowColorCombos && allowedColors.length >= 2) {
      for (let i = 0; i < allowedColors.length; i++) {
        for (let j = i + 1; j < allowedColors.length; j++) {
          colorOptions.push(`${allowedColors[i]} + ${allowedColors[j]}`);
        }
      }
    }

    const finalColorOptions =
      colorOptions.length > 0
        ? colorOptions
        : (baseAesthetics.colors as string[]) ||
          ['Arena', 'Nogal oscuro', 'Gris claro'];

    const referenceVolume = widthInitial * depthInitial * heightInitial;

    const schema: any = {
      ...baseSchema,
      name: baseSchema.name || prod.name || 'Configurador',
      dimensions: {
        width: { min: widthMin, max: widthMax },
        depth: { min: depthMin, max: depthMax },
        height: { min: heightMin, max: heightMax },
      },
      initialDimensions: {
        width: widthInitial,
        depth: depthInitial,
        height: heightInitial,
      },
      components: {
        ...baseSchema.components,
      },
      aesthetics: {
        ...baseAesthetics,
        colors: finalColorOptions,
        handles: [],
      },
      pricing: {
        ...baseSchema.pricing,
        referenceVolume,
      },
    };

    await setProductEcpdConfig(productId, {
      name: String(schema?.name || prod.name || 'Configurador'),
      schema,
    });

    redirect(
      `/dashboard/admin/productos/configurables?message=Configurador%20actualizado`,
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <h1 className="text-2xl font-bold mb-2">Muebles personalizables (ECPD)</h1>
      <p className="text-sm text-gray-600 mb-4">
        Desde aqu� defines qu� productos del cat�logo se pueden personalizar con el motor ECPD.
        Para cada mueble puedes fijar sus medidas m�nimas/m�ximas y los colores de melamina
        permitidos.
      </p>

      <section className="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold">
          Crear nuevo mueble configurable
        </h2>
        <p className="text-sm text-gray-600">
          Usa este formulario para dar de alta un mueble dise�ado para el
          personalizador (nombre, ficha b�sica, medidas, colores e im�genes).
        </p>
        <form action={createConfigurableProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nombre del mueble
              </label>
              <input
                name="name"
                required
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Armario Nidus 2 puertas"
              />
              <label className="block text-sm font-medium text-gray-700 mt-3">
                Slug (opcional)
              </label>
              <input
                name="slug"
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="armario-nidus-2p"
              />
              <label className="block text-sm font-medium text-gray-700 mt-3">
                Marca
              </label>
              <input
                name="brand"
                defaultValue="Carpihogar"
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <label className="block text-sm font-medium text-gray-700 mt-3">
                Precio base (USD)
              </label>
              <input
                name="priceUSD"
                type="number"
                min={0}
                step="0.01"
                required
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <label className="block text-sm font-medium text-gray-700 mt-3">
                Stock inicial (unidades)
              </label>
              <input
                name="stockUnits"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <label className="block text-sm font-medium text-gray-700 mt-3">
                Categor�a (opcional)
              </label>
              <select
                name="categoryId"
                className="w-full border rounded px-2 py-1 text-sm"
                defaultValue=""
              >
                <option value="">Sin categor�a</option>
                {(categories as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {`${'- '.repeat(c.depth || 0)}${c.name}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Descripci�n comercial
              </label>
              <textarea
                name="description"
                className="w-full border rounded px-2 py-1 text-sm min-h-[90px]"
                placeholder="Descripci�n breve del mueble, materiales, usos recomendados..."
              />
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen principal
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Esta imagen se usar� como referencia visual en el personalizador y
                  en la ficha de producto.
                </p>
                <HeroMediaUploader targetInputName="mainImage" />
                <input type="hidden" name="mainImage" defaultValue="" />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Im�genes de soporte (hasta 10)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Im�genes adicionales del mueble (detalles, ambiente, etc.).
                </p>
                <ImagesUploader targetName="images[]" max={10} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Medidas m�nimas (cm)
              </h3>
              <label className="block text-xs text-gray-700 mb-1">
                Ancho m�nimo
              </label>
              <input
                name="widthMin"
                type="number"
                step="0.1"
                min={0}
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="Ej. 60"
              />
              <label className="block text-xs text-gray-700 mb-1 mt-2">
                Alto m�nimo
              </label>
              <input
                name="heightMin"
                type="number"
                step="0.1"
                min={0}
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="Ej. 75"
              />
              <label className="block text-xs text-gray-700 mb-1 mt-2">
                Fondo m�nimo
              </label>
              <input
                name="depthMin"
                type="number"
                step="0.1"
                min={0}
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="Ej. 25"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Medidas m�ximas (cm)
              </h3>
              <label className="block text-xs text-gray-700 mb-1">
                Ancho m�ximo
              </label>
              <input
                name="widthMax"
                type="number"
                step="0.1"
                min={0}
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="Ej. 120"
              />
              <label className="block text-xs text-gray-700 mb-1 mt-2">
                Alto m�ximo
              </label>
              <input
                name="heightMax"
                type="number"
                step="0.1"
                min={0}
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="Ej. 200"
              />
              <label className="block text-xs text-gray-700 mb-1 mt-2">
                Fondo m�ximo
              </label>
              <input
                name="depthMax"
                type="number"
                step="0.1"
                min={0}
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="Ej. 40"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Colores permitidos</h3>
              <p className="text-xs text-gray-500 mb-2">
                Marca los colores de melamina que se pueden usar en este mueble. Las
                combinaciones mostrar�n opciones como &quot;Arena + Gris claro&quot;.
              </p>
              <div className="space-y-2">
                {ecpdColors.slice(0, 5).map((c: any, i: number) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 text-xs text-gray-700"
                  >
                    <input
                      type="checkbox"
                      name={`colorAllowed${i}`}
                      defaultChecked={i === 0}
                    />
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image}
                        alt={c.name || ''}
                        className="w-6 h-6 rounded-full object-cover border"
                      />
                    ) : (
                      <span className="inline-block w-6 h-6 rounded-full bg-gray-200 border" />
                    )}
                    <span>{c.name || `Color ${i + 1}`}</span>
                    <input
                      type="hidden"
                      name={`colorName${i}`}
                      value={c.name || ''}
                    />
                  </label>
                ))}
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  name="allowColorCombos"
                  defaultChecked
                />
                Permitir combinaciones de dos colores
              </label>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">
              Medidas iniciales recomendadas (cm)
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Estas ser�n las medidas con las que se abrir� el personalizador y
              el precio base recomendado. Si las dejas vac�as, se usar�n las
              medidas m�nimas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Ancho inicial
                </label>
                <input
                  name="widthInitial"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  placeholder="Ej. 100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Alto inicial
                </label>
                <input
                  name="heightInitial"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  placeholder="Ej. 180"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Fondo inicial
                </label>
                <input
                  name="depthInitial"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  placeholder="Ej. 35"
                />
              </div>
            </div>
          </div>

          {/* Bloque avanzado de JSON eliminado: ahora se genera el schema desde estos campos */}

          <button
            type="submit"
            className="px-4 py-2 rounded bg-brand text-white text-sm font-semibold hover:bg-opacity-90"
          >
            Crear mueble configurable
          </button>
        </form>
      </section>

      {editing && (
        <section className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="text-lg font-semibold">
            Editar mueble configurable
          </h2>
          <p className="text-sm text-gray-600">
            Aquí puedes actualizar solo las <strong>medidas mínimas/máximas</strong> y los{' '}
            <strong>colores de melamina</strong> del mueble{' '}
            <span className="font-semibold">{(editing as any).name}</span>. El precio, categoría,
            imágenes y otros datos del producto se editan desde el listado general de productos.
          </p>
          <form action={updateConfigurableProduct} className="space-y-4">
            <input type="hidden" name="productId" value={(editing as any).id} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Medidas mínimas (cm)
                </h3>
                <label className="block text-xs text-gray-700 mb-1">
                  Ancho mínimo
                </label>
                <input
                  name="widthMin"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  defaultValue={editingDimensions.width.min}
                />
                <label className="block text-xs text-gray-700 mb-1 mt-2">
                  Alto mínimo
                </label>
                <input
                  name="heightMin"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  defaultValue={editingDimensions.height.min}
                />
                <label className="block text-xs text-gray-700 mb-1 mt-2">
                  Fondo mínimo
                </label>
                <input
                  name="depthMin"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  defaultValue={editingDimensions.depth.min}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Medidas máximas (cm)
                </h3>
                <label className="block text-xs text-gray-700 mb-1">
                  Ancho máximo
                </label>
                <input
                  name="widthMax"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  defaultValue={editingDimensions.width.max}
                />
                <label className="block text-xs text-gray-700 mb-1 mt-2">
                  Alto máximo
                </label>
                <input
                  name="heightMax"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  defaultValue={editingDimensions.height.max}
                />
                <label className="block text-xs text-gray-700 mb-1 mt-2">
                  Fondo máximo
                </label>
                <input
                  name="depthMax"
                  type="number"
                  step="0.1"
                  min={0}
                  className="w-full border rounded px-2 py-1 text-xs"
                  defaultValue={editingDimensions.depth.max}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Colores permitidos</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Marca los colores de melamina que se pueden usar en este mueble.
                </p>
                <div className="space-y-2">
                  {ecpdColors.slice(0, 5).map((c: any, i: number) => (
                    <label
                      key={i}
                      className="flex items-center gap-2 text-xs text-gray-700"
                    >
                      <input
                        type="checkbox"
                        name={`colorAllowed${i}`}
                        defaultChecked={isColorAllowedForEditing(c.name)}
                      />
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image}
                          alt={c.name || ''}
                          className="w-6 h-6 rounded-full object-cover border"
                        />
                      ) : (
                        <span className="inline-block w-6 h-6 rounded-full bg-gray-200 border" />
                      )}
                      <span>{c.name || `Color ${i + 1}`}</span>
                      <input
                        type="hidden"
                        name={`colorName${i}`}
                        value={c.name || ''}
                      />
                    </label>
                  ))}
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    name="allowColorCombos"
                    defaultChecked={editingHasCombos}
                  />
                  Permitir combinaciones de dos colores
                </label>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">
                Medidas iniciales recomendadas (cm)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Definen el tama�o con el que se abrir� el personalizador y el
                precio recomendado inicial.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    Ancho inicial
                  </label>
                  <input
                    name="widthInitial"
                    type="number"
                    step="0.1"
                    min={0}
                    className="w-full border rounded px-2 py-1 text-xs"
                    defaultValue={editingInitialDimensions.width}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    Alto inicial
                  </label>
                  <input
                    name="heightInitial"
                    type="number"
                    step="0.1"
                    min={0}
                    className="w-full border rounded px-2 py-1 text-xs"
                    defaultValue={editingInitialDimensions.height}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    Fondo inicial
                  </label>
                  <input
                    name="depthInitial"
                    type="number"
                    step="0.1"
                    min={0}
                    className="w-full border rounded px-2 py-1 text-xs"
                    defaultValue={editingInitialDimensions.depth}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-brand text-white text-sm font-semibold hover:bg-opacity-90"
              >
                Guardar cambios de configurador
              </button>
              <a
                href="/dashboard/admin/productos/configurables"
                className="text-xs text-gray-600 underline"
              >
                Cancelar edición
              </a>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold">Seleccionar producto y definir esquema</h2>
        <p className="text-xs text-gray-500">
          Esta secci�n es avanzada. Puedes tomar un producto existente y sobreescribir su esquema
          ECPD pegando un JSON compatible.
        </p>
        <form action={setConfigurable} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto base
              </label>
              <select
                name="productId"
                className="w-full border rounded px-2 py-1 text-sm"
                required
              >
                <option value="">Selecciona un producto�?�</option>
                {allProducts.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {configurableIds.has(p.id) ? ' (configurable)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Puedes reutilizar un producto existente como base de precio y ficha de cat�logo.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Esquema JSON (opcional, avanzado)
              </label>
              <textarea
                name="schema"
                className="w-full border rounded px-2 py-1 text-xs min-h-[140px] font-mono"
                placeholder={JSON.stringify(defaultSchema, null, 2)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Si lo dejas vac�o se usar� el esquema por defecto del Armario Nidus.
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-brand text-white text-sm font-semibold hover:bg-opacity-90"
          >
            Guardar como configurable
          </button>
        </form>
      </section>

      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Listado de muebles configurables</h2>
        <form className="mb-3 flex gap-2" method="get">
          <input
            name="q"
            placeholder="Buscar por nombre o slug"
            defaultValue={q}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button className="px-3 py-1 rounded bg-brand hover:bg-opacity-90 text-white text-sm">
            Buscar
          </button>
          {q && (
            <a
              href="/dashboard/admin/productos/configurables"
              className="px-3 py-1 rounded border text-sm"
            >
              Limpiar
            </a>
          )}
        </form>
        {configurableFiltered.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay muebles configurables que coincidan con la busqueda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left font-semibold">Producto</th>
                <th className="p-2 text-left font-semibold">Slug</th>
                <th className="p-2 text-left font-semibold">Esquema</th>
                <th className="p-2 text-left font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {configurableFiltered.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2 text-xs text-gray-600">{p.slug}</td>
                    <td className="p-2 text-xs text-gray-600 max-w-md">
                      <pre className="whitespace-pre-wrap break-words max-h-32 overflow-auto bg-gray-50 rounded p-2">
                        {JSON.stringify(p.configSchema ?? {}, null, 2)}
                      </pre>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/dashboard/admin/productos/configurables?editId=${encodeURIComponent(
                            String(p.id),
                          )}`}
                          className="px-3 py-1 rounded border text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Editar configuración
                        </a>
                        <a
                          href={`/dashboard/admin/productos?q=${encodeURIComponent(
                            String(p.name || ''),
                          )}`}
                          className="px-3 py-1 rounded border text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Editar producto
                        </a>
                        <form action={disableConfigurable}>
                          <input type="hidden" name="productId" value={p.id} />
                          <button
                            type="submit"
                            className="px-3 py-1 rounded border text-xs text-red-600 hover:bg-red-50"
                          >
                            Desactivar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
