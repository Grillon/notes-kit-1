export type NoteID = string;

export interface Note {
  id: NoteID;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
