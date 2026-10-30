/**
 * Replaces Arabic-script letters with their contextual presentation forms
 * (Unicode Arabic Presentation Forms-B) using the Persian character map,
 * so the text displays joined where the renderer doesn't shape it.
 * Characters outside the map are returned unchanged.
 */
export declare function convertArabic(normal: string): string;

/**
 * Converts Arabic Presentation Forms-B characters back to their base
 * letters. Characters outside the map are returned unchanged.
 */
export declare function convertArabicBack(apfb: string): string;
