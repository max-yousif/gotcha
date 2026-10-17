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

/**
 * names: het doelwit staat op de achterkant.
 * qr: QR-code op de achterkant; de leerling scant en ziet het doelwit op de website.
 * qr-front: naam + QR-code samen op de voorkant, enkelzijdig afdrukken.
 */
export type CardType = 'names' | 'qr' | 'qr-front';

/** Kaartjes met een QR-code (de links moeten vooraf aangemaakt worden). */
export const usesQr = (t: CardType) => t === 'qr' || t === 'qr-front';

export interface Draw {
  /** Volgorde van de lus (participant-id's). */
  order: string[];
  createdAt: string;
}

/** Hoe de printer het blad omdraait bij recto-verso. */
export type Flip = 'long' | 'short';
