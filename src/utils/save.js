export function getSaveKey(uid = 'guest') {
  return `tu-tien-save-v3:${uid}`
}

export function saveGame(data, uid = 'guest') {
  try {
    localStorage.setItem(getSaveKey(uid), JSON.stringify(data))
  } catch (error) {
    console.error('Lỗi lưu dữ liệu local:', error)
  }
}

export function loadGame(uid = 'guest') {
  try {
    const raw = localStorage.getItem(getSaveKey(uid))
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.error('Lỗi đọc dữ liệu local:', error)
    return null
  }
}

export function clearGameSave(uid = 'guest') {
  try {
    localStorage.removeItem(getSaveKey(uid))
  } catch (error) {
    console.error('Lỗi xoá dữ liệu local:', error)
  }
}