const extraTabs = [
  { key: 'dong-phu', label: 'Dong phu', disabled: false },
  { key: 'linh-dien', label: 'Linh dien', disabled: false },
  { key: 'van-thu-vien', label: 'Van thu vien', disabled: true },
  { key: 'hanh-trang', label: 'Hanh trang', disabled: false },
  { key: 'alchemy', label: 'Luyen dan cac', disabled: false },
  { key: 'cultivation', label: 'Luyen khi cac', disabled: false },
  { key: 'dungeon', label: 'Lich luyen', disabled: false },
  { key: 'thien-ha', label: 'Thien ha', disabled: false },
  { key: 'su-kien', label: 'Su kien', disabled: true },
]

export default function GameTabs({ activeTab, onChange }) {
  return (
    <div className="dao-tabs">
      {extraTabs.map((tab) => {
        const mappedKey =
          tab.key === 'dong-phu'
            ? 'dong-phu'
            : tab.key === 'linh-dien'
            ? 'farm'
            : tab.key === 'hanh-trang'
            ? 'bag'
            : tab.key

        const isActive = activeTab === mappedKey
        const isDisabled = tab.disabled

        return (
          <button
            key={tab.key}
            type="button"
            className={`dao-tab ${isActive ? 'active' : ''} ${isDisabled ? 'ghost' : ''}`}
            onClick={() => {
              if (!isDisabled) onChange(mappedKey)
            }}
          >
            {tab.label}
            <span className="dao-tab-caret">▾</span>
          </button>
        )
      })}
    </div>
  )
}
