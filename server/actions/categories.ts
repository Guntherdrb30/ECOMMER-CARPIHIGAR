
'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function getCategories() {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return categories;
}

export async function getCategoryTree() {
    const roots = await prisma.category.findMany({ where: { parentId: null }, orderBy: { name: 'asc' }, include: { children: { orderBy: { name: 'asc' }, include: { children: { orderBy: { name: 'asc' } } } } } });
    return roots as any;
}

export async function createCategory(data: any) {
    const category = await prisma.category.create({ data });
    revalidatePath('/dashboard/admin/categorias');
    return category;
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

export async function deleteCategory(id: string) {
    await prisma.category.delete({ where: { id } });
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
        await prisma.category.delete({ where: { id } });
        revalidatePath('/dashboard/admin/categorias');
        redirect('/dashboard/admin/categorias?message=Categor%C3%ADa%20eliminada');
    } catch (e) {
        redirect('/dashboard/admin/categorias?error=No%20se%20puede%20eliminar%3A%20tiene%20subcategor%C3%ADas%20o%20productos');
    }
}
