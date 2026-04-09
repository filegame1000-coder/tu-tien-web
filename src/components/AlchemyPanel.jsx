import { useEffect, useMemo, useState } from 'react'
import { consumableDefs } from '../data/consumables'
import { getAlchemyRecipeList } from '../data/alchemyRecipes'
import { getAlchemyProgressPercent } from '../systems/alchemy'

function formatSeconds(ms = 0) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function RecipeCard({ recipe, player, crafting, craftingRemainMs, onCraft }) {
  const itemDef = consumableDefs[recipe.itemId]
  const herbs = Number(player?.herbs) || 0
  const spiritStones = Number(player?.spiritStones) || 0

  const needHerbs = Number(recipe.cost?.herbs) || 0
  const needSpiritStones = Number(recipe.cost?.spiritStones) || 0

  const canAfford = herbs >= needHerbs && spiritStones >= needSpiritStones
  const isCraftingThis = crafting?.recipeId === recipe.id
  const isBusy = !!crafting

  return (
    <div className="mini-panel alchemy-recipe-card">
      <div className="mini-panel-title">{recipe.name}</div>

      <div className="requirements-list" style={{ marginBottom: 14 }}>
        <div>
          <span>Dược thảo</span>
          <strong>{needHerbs}</strong>
        </div>
        <div>
          <span>Linh thạch</span>
          <strong>{needSpiritStones}</strong>
        </div>
        <div>
          <span>Thời gian</span>
          <strong>{Math.floor((recipe.craftTimeMs || 0) / 1000)} giây</strong>
        </div>
      </div>

      {itemDef?.description ? (
        <p className="inventory-description" style={{ marginTop: 0, marginBottom: 12 }}>
          {itemDef.description}
        </p>
      ) : null}

      {itemDef?.effect ? (
        <div className="inventory-stat-list" style={{ marginBottom: 14 }}>
          {itemDef.effect.baseHp ? (
            <span className="inventory-stat-chip">
              Tăng vĩnh viễn +{itemDef.effect.baseHp} HP gốc
            </span>
          ) : null}
          {itemDef.effect.baseMp ? (
            <span className="inventory-stat-chip">
              Tăng vĩnh viễn +{itemDef.effect.baseMp} MP gốc
            </span>
          ) : null}
          {itemDef.effect.baseDamage ? (
            <span className="inventory-stat-chip">
              Tăng vĩnh viễn +{itemDef.effect.baseDamage} damage gốc
            </span>
          ) : null}
        </div>
      ) : null}

      <button
        className={`dao-btn ${isCraftingThis ? 'dao-btn-muted' : 'dao-btn-primary'}`}
        disabled={!canAfford || isBusy}
        onClick={() => onCraft(recipe.id)}
      >
        {isCraftingThis
          ? `Đang luyện... ${formatSeconds(craftingRemainMs)}`
          : isBusy
          ? 'Lò đan đang bận'
          : 'Luyện đan'}
      </button>

      {!canAfford && !isBusy ? (
        <p style={{ margin: '10px 0 0', color: '#fca5a5' }}>
          Không đủ tài nguyên để luyện.
        </p>
      ) : null}
    </div>
  )
}

export default function AlchemyPanel({
  player,
  actions,
  crafting,
  craftingRemainMs,
}) {
  const recipes = getAlchemyRecipeList()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!crafting) return

    const interval = setInterval(() => {
      setNow(Date.now())
    }, 200)

    return () => clearInterval(interval)
  }, [crafting])

  useEffect(() => {
    if (!crafting) {
      setNow(Date.now())
    }
  }, [crafting])

  const progressPercent = useMemo(() => {
    if (!crafting) return 0
    return getAlchemyProgressPercent(crafting, now)
  }, [crafting, now])

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Đan đạo</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              LUYỆN ĐAN CÁC
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Trạng thái</span>
            <strong>{crafting ? 'Đang luyện' : 'Rảnh'}</strong>
          </div>
        </div>

        <div className="resource-grid" style={{ marginBottom: 18 }}>
          <div className="resource-chip">
            <span>Linh thạch</span>
            <strong>{player?.spiritStones ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>Dược thảo</span>
            <strong>{player?.herbs ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>HP gốc</span>
            <strong>{player?.baseStats?.maxHp ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>MP gốc</span>
            <strong>{player?.baseStats?.maxMp ?? 0}</strong>
          </div>
        </div>

        {crafting ? (
          <div className="mini-panel alchemy-active-panel">
            <div className="mini-panel-title">Lò đan đang hoạt động</div>

            <div className="alchemy-active-top">
              <div>
                <div className="inventory-name">{crafting.recipeName}</div>
                <div className="inventory-sub">Đang luyện 1 viên đan dược</div>
              </div>

              <div className="inventory-qty">{formatSeconds(craftingRemainMs)}</div>
            </div>

            <div className="breakthrough-progress compact">
              <div
                className="breakthrough-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="alchemy-progress-meta">
              <span>Tiến độ</span>
              <strong>{Math.floor(progressPercent)}%</strong>
            </div>
          </div>
        ) : null}

        <div
          className="dual-panel-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              player={player}
              crafting={crafting}
              craftingRemainMs={craftingRemainMs}
              onCraft={actions.craftPill}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
