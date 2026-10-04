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
  /** Wat er op de achterkant van een kaartje staat. */
  cardType: CardType;
  flip: Flip;
  /** Adres van de e-mailserver (Cloudflare Worker), bv. https://gotcha-mail.naam.workers.dev */
  mailServer: string;
}

/** Namen: het doelwit staat op het kaartje. QR: de leerling scant en ziet het doelwit op de website. */
export type CardType = 'names' | 'qr';

export interface Draw {
  /** Volgorde van de lus (participant-id's). */
  order: string[];
  createdAt: string;
}

/** Hoe de printer het blad omdraait bij recto-verso. */
export type Flip = 'long' | 'short';
