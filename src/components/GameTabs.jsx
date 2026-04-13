const extraTabs = [
  { key: 'admin', label: 'Quản Trị', disabled: false, adminOnly: true },
  { key: 'shop', label: 'Tiên Các', disabled: false },
  { key: 'market', label: 'Chợ Giao Dịch', disabled: false },
  { key: 'codes', label: 'Mật Lệnh', disabled: false },
  { key: 'mail', label: 'Thư Hệ Thống', disabled: false },
  { key: 'welfare', label: 'Phúc Lợi', disabled: false },
  { key: 'dong-phu', label: 'Động Phủ', disabled: false },
  { key: 'farm', label: 'Linh Điền', disabled: false },
  { key: 'van-thu-vien', label: 'Văn Thư Viện', disabled: true },
  { key: 'bag', label: 'Hành Trang', disabled: false },
  { key: 'alchemy', label: 'Luyện Đan Các', disabled: false },
  { key: 'cultivation', label: 'Luyện Khí Các', disabled: false },
  { key: 'dungeon', label: 'Lịch Luyện', disabled: false },
  { key: 'world-boss', label: 'Boss Thế Giới', disabled: false },
  { key: 'thien-ha', label: 'Thiên Hạ', disabled: false },
  { key: 'su-kien', label: 'Sự Kiện', disabled: true },
]

export default function GameTabs({ activeTab, onChange, isAdmin = false }) {
  return (
    <div className="dao-tabs">
      {extraTabs
        .filter((tab) => !tab.adminOnly || isAdmin)
        .map((tab) => {
          const isActive = activeTab === tab.key
          const isDisabled = tab.disabled
          const isAdminTab = tab.key === 'admin'

          return (
            <button
              key={tab.key}
              type="button"
              className={`dao-tab ${isActive ? 'active' : ''} ${isDisabled ? 'ghost' : ''} ${
                isAdminTab ? 'dao-tab-admin' : ''
              }`}
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
