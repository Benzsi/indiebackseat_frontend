const API_URL = 'http://localhost:3000/api';

export interface GalleryItem {
  id: number;
  filePath: string;
  fileType: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export interface GameList {
  id: number;
  name: string;
  userId: number;
  imagePath?: string;
  items: { 
    id: number;
    gameId: number; 
    game: any;
    gallery: GalleryItem[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export async function getListsForUser(userId: string | number): Promise<GameList[]> {
  try {
    const res = await fetch(`${API_URL}/lists/${userId}`);
    if (!res.ok) throw new Error('Hiba a listák lekérésekor');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createListForUser(userId: string | number, name: string): Promise<GameList | null> {
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

export async function addGameToList(listId: string | number, gameId: number) {
  try {
    const res = await fetch(`${API_URL}/lists/${listId}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId }),
    });
    if (!res.ok) throw new Error('Hiba a játék hozzáadásakor');
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function removeGameFromList(listId: string | number, gameId: number) {
  try {
    const res = await fetch(`${API_URL}/lists/${listId}/games/${gameId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Hiba a játék eltávolításakor');
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

export const uploadGameItemGallery = async (listId: number, gameId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/lists/${listId}/games/${gameId}/gallery`, {
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




