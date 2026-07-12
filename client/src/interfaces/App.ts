import { Model } from '.';

export interface NewApp {
  name: string;
  url: string;
  icon: string;
  isPublic: boolean;
  description: string;
  // profile ids this app is assigned to; [] = visible in every profile
  profileIds: number[];
}

export interface App extends Model, NewApp {
  orderId: number;
  isPinned: boolean;
}
