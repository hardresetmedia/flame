import { Model, Bookmark } from '.';

export interface NewCategory {
  name: string;
  isPublic: boolean;
  // profile ids this category (and its bookmarks) is assigned to;
  // [] = visible in every profile
  profileIds: number[];
}

export interface Category extends Model, NewCategory {
  isPinned: boolean;
  orderId: number;
  bookmarks: Bookmark[];
}
