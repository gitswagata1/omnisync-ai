/**
 * Express 5 types route params as `string | string[]`. Route params in this
 * app are always single values, so take the first element if it is an array.
 */
export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
