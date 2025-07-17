export interface TypeInfo {
  type: string;
  devOnly: boolean;
  optional?: boolean;
  pattern?: string | null;
}

export function formatType(info: TypeInfo): string {
  const annotations: string[] = [];
  const clean = info.type.replace(/\s+/g, ' ').trim();
  if (info.optional) annotations.push('optional');
  if (info.pattern) annotations.push('pattern');
  if (info.devOnly) annotations.push('devOnly');
  return annotations.length > 0 ? `${clean} [${annotations.join(', ')}]` : clean;
}
