const extraTabs = [
  { key: 'dong-phu', label: 'Động phủ', disabled: false },
  { key: 'linh-dien', label: 'Linh điền', disabled: false },
  { key: 'van-thu-vien', label: 'Vạn thư viện', disabled: true },
  { key: 'hanh-trang', label: 'Hành trang', disabled: false },
  { key: 'alchemy', label: 'Luyện đan các', disabled: false },
  { key: 'cultivation', label: 'Luyện khí các', disabled: false },
  { key: 'dungeon', label: 'Lịch luyện', disabled: false },
  { key: 'thien-ha', label: 'Thiên hạ', disabled: true },
  { key: 'su-kien', label: 'Sự kiện', disabled: true },
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