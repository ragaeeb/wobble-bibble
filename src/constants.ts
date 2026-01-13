export enum Markers {
    Book = 'B',
    Footnote = 'F',
    Heading = 'T',
    Chapter = 'C',
    Note = 'N',
    Plain = 'P',
}

export const TRANSLATION_MARKER_PARTS = {
    /** Dash variations (hyphen, en dash, em dash) */
    dashes: '[-–—]',
    /** Numeric portion of the reference */
    digits: '\\d+',
    /** Valid marker prefixes (Book, Chapter, Footnote, Translation, Page) */
    markers: `[${Markers.Book}${Markers.Chapter}${Markers.Footnote}${Markers.Heading}${Markers.Plain}${Markers.Note}]`,
    /** Optional whitespace before dash */
    optionalSpace: '\\s?',
    /** Valid single-letter suffixes */
    suffix: '[a-z]',
} as const;

export const MARKER_ID_PATTERN = `${TRANSLATION_MARKER_PARTS.markers}${TRANSLATION_MARKER_PARTS.digits}${TRANSLATION_MARKER_PARTS.suffix}?`;
