const extraTabs = [
  { key: 'admin', label: 'Quan Tri', disabled: false, adminOnly: true },
  { key: 'shop', label: 'Tien Cac', disabled: false },
  { key: 'market', label: 'Cho Giao Dich', disabled: false },
  { key: 'codes', label: 'Mat Lenh', disabled: false },
  { key: 'welfare', label: 'Phuc Loi', disabled: false },
  { key: 'dong-phu', label: 'Dong Phu', disabled: false },
  { key: 'farm', label: 'Linh Dien', disabled: false },
  { key: 'van-thu-vien', label: 'Van Thu Vien', disabled: true },
  { key: 'bag', label: 'Hanh Trang', disabled: false },
  { key: 'alchemy', label: 'Luyen Dan Cac', disabled: false },
  { key: 'cultivation', label: 'Luyen Khi Cac', disabled: false },
  { key: 'dungeon', label: 'Lich Luyen', disabled: false },
  { key: 'world-boss', label: 'Boss The Gioi', disabled: false },
  { key: 'thien-ha', label: 'Thien Ha', disabled: false },
  { key: 'su-kien', label: 'Su Kien', disabled: true },
]

export default function GameTabs({ activeTab, onChange, isAdmin = false }) {
  return (
    <div className="dao-tabs">
      {extraTabs
        .filter((tab) => !tab.adminOnly || isAdmin)
        .map((tab) => {
          const isActive = activeTab === tab.key
          const isDisabled = tab.disabled

          return (
            <button
              key={tab.key}
              type="button"
              className={`dao-tab ${isActive ? 'active' : ''} ${isDisabled ? 'ghost' : ''}`}
              onClick={() => {
                if (!isDisabled) onChange(tab.key)
              }}
            >
              {tab.label}
              <span className="dao-tab-caret">▼</span>
            </button>
          )
        })}
    </div>
  )
}
