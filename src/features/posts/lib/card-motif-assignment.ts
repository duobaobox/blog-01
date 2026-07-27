export const CARD_MOTIF_COUNT = 8;

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/** 同一文章始终得到相同的图腾索引。 */
export function getMotifIndex(slug: string): number {
  return hashString(slug) % CARD_MOTIF_COUNT;
}

/**
 * 为文章列表分配稳定图腾，并在发生哈希碰撞时确定性避开相邻重复。
 */
export function assignMotifIndices(slugs: readonly string[]): number[] {
  return slugs.reduce<number[]>((indices, slug) => {
    let motifIndex = getMotifIndex(slug);
    const previousIndex = indices.at(-1);

    if (motifIndex === previousIndex) {
      const offset =
        1 + (hashString(`${slug}:adjacent`) % (CARD_MOTIF_COUNT - 1));
      motifIndex = (motifIndex + offset) % CARD_MOTIF_COUNT;
    }

    indices.push(motifIndex);
    return indices;
  }, []);
}

/** 将外部传入的图腾索引约束到有效范围。 */
export function resolveMotifIndex(
  motifIndex: number | undefined,
  slug: string,
): number {
  if (!Number.isInteger(motifIndex)) {
    return getMotifIndex(slug);
  }

  return (
    (((motifIndex as number) % CARD_MOTIF_COUNT) + CARD_MOTIF_COUNT) %
    CARD_MOTIF_COUNT
  );
}
