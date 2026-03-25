export const SAVE_KEY = 'tu-tien-save-v2'

export function saveGame(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data))
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error('Lỗi đọc dữ liệu lưu:', error)
    return null
  }
}

export function clearGameSave() {
  localStorage.removeItem(SAVE_KEY)
}