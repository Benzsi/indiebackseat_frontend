const API_URL = 'http://localhost:3000/api';

export interface BookList {
  id: number;
  name: string;
  userId: number;
  items: { bookId: number }[];
  createdAt: string;
  updatedAt: string;
}

export async function getListsForUser(userId: string): Promise<BookList[]> {
  try {
    const res = await fetch(`${API_URL}/lists/user/${userId}`);
    if (!res.ok) throw new Error('Hiba a listák lekérésekor');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createListForUser(userId: string, name: string): Promise<BookList | null> {
  try {
    const res = await fetch(`${API_URL}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: Number(userId), name }),
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
        headers: { 'Content-Type': 'application/json' },
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
