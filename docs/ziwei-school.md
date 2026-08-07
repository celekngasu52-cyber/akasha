# Zi Wei Dou Shu (紫微斗数) — School Conventions & Rules

> Documented for the Akasha astrology engine (todo 7). The engine
> replicates the [iztro](https://github.com/SylarLong/iztro) (MIT) 安星
> algorithm, which implements the standard 三合派 (San He School) star
> placement formulas. The golden fixtures in
> `tests/golden/ziwei/case{1,2,3}.json` were captured from
> `insightapp.life/ziwei/chart`, whose backend is built on iztro.

## Sources

1. **iztro (MIT license)** — open-source Zi Wei Dou Shu charting library
   by SylarLong. Source: <https://github.com/SylarLong/iztro>. The
   `src/astro/palace.ts`, `src/star/location.ts`, `src/star/majorStar.ts`,
   and `src/star/minorStar.ts` files define the 安星 formulas used here.
   The engine ports these algorithms to pure TypeScript without adding
   iztro as a runtime dependency.

2. **紫微斗数全书 (ZT Quan Shu)** — the classical reference text
   (《紫微斗数全书》, attributed to Luo Hongxian 罗洪先, Ming dynasty).
   The 安命身宫诀, 起紫微星诀, and 安十四主星诀 verses cited in iztro's
   source comments originate from this text. The standard mnemonic:
   - 命宫: "寅起正月，顺数至生月，逆数生时为命宫"
   - 身宫: "寅起正月，顺数至生月，顺数生时为身宫"
   - 紫微: "六五四三二，酉午亥辰丑，局数除日数，商数宫前走"

3. **insightapp.life/ziwei/chart** — the fixture capture source. The
   live API at `/api/ziwei/chart` accepts `{lunar_year, lunar_month,
   lunar_day, hour, gender, year_gan_idx, year_zhi_idx}` and returns
   the chart (palaces, stars, siHua, bureau, ming/shen gong). The
   fixtures were captured 2026-08-07.

## School Conventions

### 晚子时 (Late Zi Hour) — dayDivide='current'

The critical convention for the 23:00–24:00 birth hour (晚子时 / late zi):

- **Time branch**: 子 (index 0), same as 早子时 (00:00–01:00).
- **ZWDS chart (star placement)**: uses the **current day's lunar date**
  (dayDivide='current' in iztro). The lunar day is NOT advanced.
- **Day pillar (四柱)**: advances to the **next day's** stem-branch.
  For case3 (solar 2000-03-15 23:30): day pillar = 癸酉 (the 2000-03-16
  pillar), time pillar = 壬子 (五鼠遁 from 癸 day: 戊癸起壬子).

This hybrid convention (chart uses current day, pillars use advanced
day) is the one used by insightapp.life. It matches the iztro library's
behavior when `dayDivide='current'` is set for the chart computation,
combined with forward day-pillar advancement for the four pillars.

> **Note**: lunar-javascript's default `EightChar` advances the day
> pillar at 23:00 (dayDivide='forward'). For the ZWDS chart, the engine
> uses the current day's lunar date (dayDivide='current') by NOT
> advancing the date for `Solar.fromYmdHms`. For the four pillars, the
> day pillar is explicitly advanced for late-zi births.

### 命宫 / 身宫 (Life / Body Palace)

All indices are 寅-relative (寅=0, 卯=1, ..., 子=10, 丑=11) internally:
- monthIndex = `(lunarMonth - 1) mod 12`
- 命宫 (soul) = `(monthIndex - timeBranchIndex) mod 12` (逆数生时)
- 身宫 (body) = `(monthIndex + timeBranchIndex) mod 12` (顺数生时)
- Convert to absolute branch index (子=0): `absIndex = (relIndex + 2) mod 12`

### 五行局 (Five Elements Bureau)

The NaYin bureau is derived from the 命宫's stem-branch pair:
- stemNumber = `floor(stemIdx / 2) + 1`
- branchNumber = `floor(fixIndex(branchIdx, 6) / 2) + 1`
- index = `stemNumber + branchNumber`; reduce > 5 by subtracting 5
- Bureau table (index 1-5): 木三局, 金四局, 水二局, 火六局, 土五局

The bureau number determines the 紫微 star position and the 大限
(decade) starting age.

### 14 Primary Stars

- **紫微系** (counterclockwise from 紫微): 紫微→天机→(skip)→太阳→
  武曲→天同→(skip×2)→廉贞
- **天府系** (clockwise from 天府): 天府→太阴→贪狼→巨门→天相→
  天梁→七杀→(skip×3)→破军
- 天府 position = `(12 - ziweiIndex) mod 12` (mirror of 紫微)
- 紫微 position from the 起紫微星诀 (lunar day ÷ bureau number)

### 四化 (Si Hua)

Standard 四化 table per year stem (禄, 权, 科, 忌):
- 甲: 廉贞, 破军, 武曲, 太阳
- 乙: 天机, 天梁, 紫微, 太阴
- 丙: 天同, 天机, 文昌, 廉贞
- 丁: 太阴, 天同, 天机, 巨门
- 戊: 贪狼, 太阴, 右弼, 天机
- 己: 武曲, 贪狼, 天梁, 文曲
- 庚: 太阳, 武曲, 太阴, 天同
- 辛: 巨门, 太阳, 文曲, 文昌
- 壬: 天梁, 紫微, 左辅, 武曲
- 癸: 破军, 巨门, 太阴, 贪狼

### Auxiliary Stars

- **左辅/右弼**: by lunar month (辰上顺数月, 戌上逆数月)
- **文昌/文曲**: by time branch (辰上顺数时, 戌上逆数时)
- **天魁/天钺**: by year stem (甲戊庚→丑未, 乙己→子申, etc.)
- **禄存/擎羊/陀罗**: by year stem (禄前羊刃当, 禄后陀罗府)
- **火星/铃星**: by year branch + time branch
- **地空/地劫**: by time branch (亥上子时顺安劫, 逆回便是地空亡)

## Fixture Notes

### case2 day/time pillar discrepancy

The case2 fixture records `dayGanZhi: "辛巳"` and `timeGanZhi: "丁酉"`,
which correspond to the date **1985-12-08** (lunar 十月二十七), not the
birth date 1985-11-22 (lunar 十月十一). The astronomically correct
pillars for 1985-11-22 18:00 are `乙丑` / `乙酉` (verified via
lunar-javascript, lunar-lite, and Julian Day calculation). The
insightapp API does not return day/time pillars — they were computed
externally by the fixture author with a wrong date. The engine computes
the correct pillars; the test asserts day/time only for cases 1 and 3.

### case1/case3 isShenGong inconsistency

When 命宫 and 身宫 coincide (same branch), the fixtures are
inconsistent: case1 records `isShenGong: false`, case3 records
`isShenGong: true`. The engine sets both flags true when they coincide
(matching case3); the test skips the isShenGong assertion for
coincident palaces.
