const API_URL = 'http://localhost:3000/api';

export interface GalleryItem {
  id: number;
  filePath: string;
  fileType: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export interface BookList {
  id: number;
  name: string;
  userId: number;
  imagePath?: string;
  items: { 
    id: number;
    bookId: number; 
    book: any;
    gallery: GalleryItem[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export async function getListsForUser(userId: string | number): Promise<BookList[]> {
  try {
    const res = await fetch(`${API_URL}/lists/${userId}`);
    if (!res.ok) throw new Error('Hiba a listák lekérésekor');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createListForUser(userId: string | number, name: string): Promise<BookList | null> {
  try {
    const res = await fetch(`${API_URL}/lists/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Hiba a lista létrehozásakor');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function addBookToList(listId: string | number, bookId: number) {
  try {
    const res = await fetch(`${API_URL}/lists/${listId}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookId }),
    });
    if (!res.ok) throw new Error('Hiba a könyv hozzáadásakor');
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function removeBookFromList(listId: string | number, bookId: number) {
  try {
    const res = await fetch(`${API_URL}/lists/${listId}/books/${bookId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Hiba a könyv eltávolításakor');
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function removeList(listId: string | number) {
  try {
    const res = await fetch(`${API_URL}/lists/${listId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Hiba a lista törlésekor');
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function uploadListImage(listId: string | number, file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/lists/${listId}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Hiba a kép feltöltésekor');
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export const uploadBookItemGallery = async (listId: number, bookId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/lists/${listId}/books/${bookId}/gallery`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Hiba a feltöltés során');
  return res.json();
};

export const deleteGalleryItem = async (id: number) => {
  const res = await fetch(`${API_URL}/lists/gallery/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Hiba a törlés során');
};
