export interface Participant {
  id: string;
  name: string;
  klas: string;
  email: string;
}

export type ThemeId = 'gotcha' | 'santa' | 'valentine';

export interface Settings {
  theme: ThemeId;
  eventName: string;
  rules: string;
  /** De organisator speelt mee → blinde modus. */
  playing: boolean;
}

export interface Draw {
  /** Volgorde van de lus (participant-id's). */
  order: string[];
  createdAt: string;
}

/** Hoe de printer het blad omdraait bij recto-verso. */
export type Flip = 'long' | 'short';
