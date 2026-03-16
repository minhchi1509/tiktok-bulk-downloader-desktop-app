export async function promisePool<T>({
  items,
  concurrency,
  worker
}: {
  items: T[]
  concurrency: number
  worker: (item: T, index: number) => Promise<void>
}) {
  let index = 0

  const next = async (): Promise<void> => {
    const i = index++
    if (i >= items.length) return

    await worker(items[i], i)
    await next()
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(0)
    .map(() => next())

  await Promise.all(workers)
}
