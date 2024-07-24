import objectPath from 'object-path'

const reg = /:[\w.]+/g

export function placeholder (str: string, data: Record<string, any>): string {
  if (typeof str !== 'string') str = String(str)

  return str.replaceAll(reg, e => {
    const res = objectPath.get(data, e.slice(1))
    if (res === undefined) return e
    return typeof res !== 'string' ? String(res) : res
  })
}
