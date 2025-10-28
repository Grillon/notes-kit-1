export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface ImageData {
  id?: number;
  noteId: string;
  name: string;
  data: Blob;
  createdAt: string;
}
