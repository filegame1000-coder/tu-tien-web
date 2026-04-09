export default function DongPhuPanel({ skills, actions }) {
  const learnedSkills = skills?.learned || []
  const equippedSkills = skills?.equipped || []

  return (
    <section className="altar-card">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Động phủ</div>
            <h2 className="panel-title">Tàng Kinh Các</h2>
          </div>
          <div className="realm-stage-pill">
            <span>Kỹ năng đã học</span>
            <strong>{learnedSkills.length}</strong>
          </div>
        </div>

        <div className="dual-panel-grid">
          <div className="mini-panel">
            <div className="mini-panel-title">Kỹ năng đã học</div>
            <div className="inventory-grid">
              {learnedSkills.map((entry) => (
                <div key={entry.skillId} className="inventory-card">
                  <div className="inventory-card-top">
                    <div>
                      <div className="inventory-name">{entry.def?.name}</div>
                      <div className="inventory-sub">
                        {entry.equippedSlots.length > 0
                          ? `Đang gắn ô ${entry.equippedSlots.map((slot) => slot + 1).join(', ')}`
                          : 'Chưa trang bị'}
                      </div>
                    </div>
                    <div className="inventory-qty">CD {entry.def?.cooldownTurns}</div>
                  </div>

                  <p className="inventory-description">{entry.def?.description}</p>

                  <div className="inventory-stat-list">
                    <span className="inventory-stat-chip">Hao Ki: {entry.def?.manaCost}</span>
                    <span className="inventory-stat-chip">
                      Hồi chiêu: {entry.def?.cooldownTurns} lượt
                    </span>
                  </div>

                  <div className="inventory-actions">
                    {equippedSkills.map((slotEntry) => (
                      <button
                        key={`${entry.skillId}-slot-${slotEntry.slotIndex}`}
                        className="dao-btn dao-btn-primary"
                        onClick={() => actions.equipSkill(entry.skillId, slotEntry.slotIndex)}
                      >
                        Gắn ô {slotEntry.slotIndex + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mini-panel">
            <div className="mini-panel-title">Trang bị kỹ năng</div>
            <div className="inventory-grid">
              {equippedSkills.map((entry) => (
                <div key={`equipped-skill-${entry.slotIndex}`} className="inventory-card">
                  <div className="inventory-card-top">
                    <div>
                      <div className="inventory-name">Ô kỹ năng {entry.slotIndex + 1}</div>
                      <div className="inventory-sub">
                        {entry.def ? entry.def.name : 'Đang để trống'}
                      </div>
                    </div>
                    {entry.def ? (
                      <div className="inventory-qty">
                        {entry.cooldown > 0 ? `CD ${entry.cooldown}` : 'Sẵn sàng'}
                      </div>
                    ) : null}
                  </div>

                  {entry.def ? (
                    <>
                      <p className="inventory-description">{entry.def.description}</p>
                      <div className="inventory-stat-list">
                        <span className="inventory-stat-chip">Hao Ki: {entry.def.manaCost}</span>
                        <span className="inventory-stat-chip">
                          Hồi chiêu: {entry.def.cooldownTurns} lượt
                        </span>
                      </div>
                      <button
                        className="dao-btn dao-btn-muted"
                        onClick={() => actions.unequipSkill(entry.slotIndex)}
                      >
                        Tháo khỏi ô
                      </button>
                    </>
                  ) : (
                    <p className="inventory-description">
                      Gắn kỹ năng đã học vào ô này để dùng trong chiến đấu.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
