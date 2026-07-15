export function createPool(factory, size) {
  const items = new Array(size);
  const free = new Array(size);
  for (let i = 0; i < size; i++) {
    const item = factory();
    item.active = false;
    item._idx = i;
    items[i] = item;
    free[i] = size - 1 - i;
  }
  let freeTop = size;

  function acquire() {
    if (freeTop === 0) return null;
    const idx = free[--freeTop];
    const item = items[idx];
    item.active = true;
    return item;
  }

  function release(item) {
    if (!item.active) return;
    item.active = false;
    free[freeTop++] = item._idx;
  }

  function forEachActive(cb) {
    for (let i = 0; i < size; i++) {
      const it = items[i];
      if (it.active) cb(it, i);
    }
  }

  function activeCount() {
    return size - freeTop;
  }

  function clear() {
    freeTop = size;
    for (let i = 0; i < size; i++) {
      items[i].active = false;
      free[i] = size - 1 - i;
    }
  }

  return { items, size, acquire, release, forEachActive, activeCount, clear };
}
