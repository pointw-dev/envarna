export function formatType(type: string, devOnly: boolean): string {
  const annotations: string[] = [];
  let clean = type.replace(/\s*\[(pattern|optional)\]/g, (_, a) => {
    annotations.push(a);
    return '';
  });
  clean = clean.replace(/\s+/g, ' ').trim();
  if (devOnly) annotations.push('devOnly');
  if (annotations.length > 0) {
    return `${clean} [${annotations.join(', ')}]`;
  }
  return clean;
}
