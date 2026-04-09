export function cultivate(player) {
  return {
    ...player,
    exp: (Number(player?.exp) || 0) + 1,
  }
}