
'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function getCategories() {
    const categories = await prisma.category.findMany({ 
        select: { id: true, name: true, slug: true, parentId: true },
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
    });
    return categories;
}

export async function getCategoryTree() {
    const roots = await prisma.category.findMany({ where: { parentId: null }, orderBy: { name: 'asc' }, include: { children: { orderBy: { name: 'asc' }, include: { children: { orderBy: { name: 'asc' } } } } } });
    return roots as any;
}

// Utilidad: aplanar el árbol en orden jerárquico
export async function getCategoriesFlattened() {
    const tree = await getCategoryTree();
    const flat: { id: string; name: string; slug: string; parentId?: string | null; depth: number }[] = [];
    const walk = (nodes: any[], depth: number) => {
        for (const n of nodes) {
            flat.push({ id: n.id, name: n.name, slug: n.slug, parentId: n.parentId ?? null, depth });
            if (n.children?.length) walk(n.children, depth + 1);
        }
    };
    walk(tree as any[], 0);
    return flat;
}

export async function createCategory(data: any) {
    const category = await prisma.category.create({ data });
    revalidatePath('/dashboard/admin/categorias');
    return category;
}

export async function getCategoryById(id: string) {
    const c = await prisma.category.findUnique({ where: { id }, select: { id: true, name: true, slug: true, parentId: true } });
    return c;
}

export async function createCategoryByForm(formData: FormData) {
    const name = String(formData.get('name') || '');
    const slug = String(formData.get('slug') || '');
    const parentId = String(formData.get('parentId') || '') || null;
    if (!name.trim() || !slug.trim()) redirect('/dashboard/admin/categorias?error=Nombre%20y%20slug%20son%20requeridos');
    try {
        await prisma.category.create({ data: { name, slug, parentId: parentId || null } });
        revalidatePath('/dashboard/admin/categorias');
        redirect('/dashboard/admin/categorias?message=Categor%C3%ADa%20creada');
    } catch (e) {
        redirect('/dashboard/admin/categorias?error=No%20se%20pudo%20crear%20la%20categor%C3%ADa');
    }
}

export async function updateCategory(id: string, data: any) {
    const category = await prisma.category.update({
        where: { id },
        data,
    });
    revalidatePath('/dashboard/admin/categorias');
    return category;
}

export async function updateCategoryByForm(formData: FormData) {
    const id = String(formData.get('id') || '');
    const name = String(formData.get('name') || '');
    const slug = String(formData.get('slug') || '');
    const parentIdRaw = String(formData.get('parentId') || '') || null;
    const parentId = parentIdRaw || null;
    if (!id || !name.trim() || !slug.trim()) {
        redirect('/dashboard/admin/categorias?error=Datos%20inv%C3%A1lidos');
    }
    // Validar que no se establezca como padre a un descendiente
    if (parentId && parentId === id) {
        redirect('/dashboard/admin/categorias?error=La%20categor%C3%ADa%20no%20puede%20ser%20su%20propio%20padre');
    }
    if (parentId) {
        try {
            let current: any = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true, parentId: true } });
            // Subimos por la cadena de padres; si encontramos el id, se intenta crear un ciclo
            while (current?.parentId) {
                if (current.parentId === id) {
                    redirect('/dashboard/admin/categorias?error=Selecci%C3%B3n%20inv%C3%A1lida%3A%20no%20puede%20elegir%20un%20descendiente%20como%20padre');
                }
                current = await prisma.category.findUnique({ where: { id: current.parentId }, select: { id: true, parentId: true } });
            }
        } catch {}
    }
    try {
        await prisma.category.update({ where: { id }, data: { name, slug, parentId } });
        revalidatePath('/dashboard/admin/categorias');
        redirect('/dashboard/admin/categorias?message=Categor%C3%ADa%20actualizada');
    } catch (e) {
        redirect('/dashboard/admin/categorias?error=No%20se%20pudo%20actualizar%20la%20categor%C3%ADa');
    }
}

export async function deleteCategory(id: string) {
    // Desasociar hijos y productos antes de eliminar (por seguridad)
    await prisma.$transaction(async (tx) => {
        await tx.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
        await tx.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
        await tx.category.delete({ where: { id } });
    });
    revalidatePath('/dashboard/admin/categorias');
}

export async function deleteCategoryByForm(formData: FormData) {
    const id = String(formData.get('id'));
    const secret = String(formData.get('secret') || '');
    const { getDeleteSecret } = await import('@/server/actions/settings');
    const configured = await getDeleteSecret();
    if (!configured) {
        redirect('/dashboard/admin/categorias?error=Falta%20configurar%20la%20clave%20de%20eliminaci%C3%B3n');
    }
    if (secret !== configured) {
        redirect('/dashboard/admin/categorias?error=Clave%20secreta%20inv%C3%A1lida');
    }
    try {
        await prisma.$transaction(async (tx) => {
            await tx.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
            await tx.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
            await tx.category.delete({ where: { id } });
        });
        revalidatePath('/dashboard/admin/categorias');
        redirect('/dashboard/admin/categorias?message=Categor%C3%ADa%20eliminada');
    } catch (e) {
        redirect('/dashboard/admin/categorias?error=No%20se%20pudo%20eliminar%20la%20categor%C3%ADa');
    }
}
