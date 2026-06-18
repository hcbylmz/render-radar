# Render Radar — Tasarım Dokümanı

**Tarih:** 2026-06-18
**Durum:** Onaylandı (tasarım), implementasyon planı bekliyor
**Paket adı:** `render-radar` (npm'de boş — 2026-06-18 itibarıyla 404)

---

## 1. Amaç

React Native geliştiricilerinin **gereksiz yeniden render'ları (re-render) çıplak gözle görmesini** sağlayan, geliştirme-modu (dev-only) bir teşhis aracı. Bir component her render olduğunda kenarı flash'lar, bir sayaç gösterir ve (ileri fazlarda) render'ın **neden** olduğunu söyler.

### Doldurduğu boşluk
- Flipper artık deprecated.
- React DevTools'un "highlight updates" özelliği RN'de hantal ve kurulumu zahmetli.
- Hafif, sıfır-config, uygulama-içi (in-app) bir alternatif yok.

### Hedef kitle
Orta seviye RN geliştiricileri; performans/`memo`/`useCallback` davranışını gözle anlamak isteyenler.

### Başarı kriterleri
- `npm i -D render-radar` + tek satır kod ile çalışır.
- Production'da **tamamen no-op** (sıfır runtime maliyeti, tree-shake edilebilir).
- Aracın kendisi izlediği component'i yeniden render etmez (sayacı kirletmez).
- Expo ve bare RN'de çalışır (saf JS, zorunlu native bağımlılık yok).
- README'de bir GIF ile değeri 5 saniyede anlaşılır.

---

## 2. Mimari — "Tek beyin, üç ağız"

Tüm public API'ler aynı çekirdeği kullanır.

### 2.1 Çekirdek

**`useRenderTracker(name, props?)`** (dahili hook)
- Her render'da `useRef` sayacını artırır.
- Bir önceki prop'ları ref'te tutar; yeni prop'larla **shallow diff** alır → hangi key değişti, referans mı değişti.
- Render olayını merkezi store'a yazar: `{ id, name, count, timestamp, changedKeys }`.

**Merkezi store (`store.ts`)** — hafif pub/sub
- Stat'ları render döngüsünün dışında tutar.
- Tüketiciler `useSyncExternalStore` ile abone olur.
- **Kritik tasarım kuralı:** store güncellemesi, izlenen component'in yeniden render olmasına yol açMAMALI — aksi halde araç kendi ölçümünü bozar. Overlay ve panel store'a ayrı abone olur.

**`isDev.ts`** — ortam kapısı
- `__DEV__` false ise tüm public API'ler erken döner / sadece `children` render eder.

### 2.2 Kullanım katmanları (üç ağız + provider)

1. **Hook** — `useRenderRadar(name, props?)`: component içinden çağrılır. Çekirdeğin ince sarmalayıcısı.
2. **Wrapper** — `<RenderRadar name="Card"><Card/></RenderRadar>`: children'ı sarar, otomatik flash + badge çizer.
3. **HOC** — `withRenderRadar(Card, name?)`: kolaylık sarmalayıcısı (Faz 2).
4. **Provider (Faz 3)** — `<RadarProvider>`: React'in `<Profiler>` API'si ile alt ağacı **otomatik** izler; aynı store'u besler.

### 2.3 Görsel katman

- **Flash border** — izlenen elemanın `onLayout` ile ölçülen çerçevesine absolute konumlu bir overlay View; render'da opacity/border animasyonu.
- **Badge** — küçük sayaç pill'i (render sayısı).
- **"Neden" ipucu (Faz 2)** — değişen prop key'lerini gösterir (örn. "`props.user` değişti — yeni referans").
- **Hotspot paneli (Faz 3)** — sürüklenebilir kayan panel; en çok render olan component'leri sıralar; reset butonu.
- **Animasyon adaptörü (`FlashDriver`)** — varsayılan dahili `Animated`; `react-native-reanimated` kuruluysa otomatik onu kullanır. İki sürücü de küçük bir ortak arayüzü uygular.

---

## 3. Veri akışı

```
render olur
  → useRenderTracker: sayaç++ , prev/next prop diff
  → store'a olay yazılır { id, name, count, changedKeys }
  → (a) o id'ye abone FlashOverlay flash'lar + badge günceller
  → (b) HotspotPanel tüm olaylara abone, sıralamayı tazeler
```

Store güncellemesi izlenen component'i değil, yalnızca overlay/panel'i etkiler (external store sayesinde).

---

## 4. Fazlama — her faz bağımsız yayınlanabilir

### Faz 1 — MVP (ilk npm sürümü)
- Çekirdek: `useRenderTracker`, `store`, `isDev`.
- `useRenderRadar` hook + `<RenderRadar>` wrapper.
- Flash border + count badge, **dahili Animated API** ile.
- Dev-only no-op davranışı.
- TypeScript tipleri.
- Expo örnek app + README + GIF.

### Faz 2 — "Neden"
- Prop/state shallow diff → değişen key'lerin gösterimi.
- `withRenderRadar` HOC.

### Faz 3 — Otomatik + panel
- `<RadarProvider>` + React `<Profiler>` ile otomatik izleme.
- Sürüklenebilir hotspot paneli (sıralı + reset).
- Opsiyonel Reanimated `FlashDriver` adaptörü.

---

## 5. Dosya yapısı (her dosya tek sorumluluk)

```
src/
  core/
    useRenderTracker.ts   # sayım + diff + raporlama
    store.ts              # pub/sub external store
    isDev.ts              # ortam kapısı
  api/
    useRenderRadar.ts     # hook ağzı
    RenderRadar.tsx       # wrapper ağzı
    withRenderRadar.tsx   # HOC ağzı (Faz 2)
  overlay/
    FlashOverlay.tsx      # ölçüm + flash + badge
    flashDriver/
      animated.ts         # dahili Animated sürücüsü
      reanimated.ts       # opsiyonel Reanimated sürücüsü (Faz 3)
  panel/
    RadarProvider.tsx     # Profiler otomatik izleme (Faz 3)
    HotspotPanel.tsx      # sıralı panel (Faz 3)
  index.ts
example/                  # Expo uygulaması (manuel test + README GIF'i)
```

---

## 6. Araçlar & test

- **Dil:** TypeScript.
- **Build:** `react-native-builder-bob` (RN kütüphane standardı).
- **Örnek app:** Expo (Expo + bare ikisinde de çalışır; saf JS).
- **Testler (jest + @testing-library/react-native):**
  - Çekirdek render sayımı doğru artıyor mu?
  - Diff mantığı: değişen key'leri ve referans değişimini doğru tespit ediyor mu?
  - `__DEV__ = false` iken tam no-op: hook hiçbir şey yapmaz, wrapper children'ı değiştirmeden render eder.
  - Wrapper, sarılan ağacın çıktısını bozmaz.

---

## 7. Kapsam dışı (YAGNI)

- Zaman çizelgesi/timeline kaydı ve dışa aktarma.
- Ağ/Redux/navigation entegrasyonu.
- Web (react-native-web) desteği — ilk sürümde hedeflenmiyor.
- Render *sebebinin* derin (deep) diff'i — yalnızca shallow diff.

---

## 8. Açık riskler / dikkat noktaları

- **Ölçüm kirliliği:** Aracın kendi render'ı izlenen component'e sıçramamalı (external store ile çözülüyor).
- **Layout ölçümü:** `onLayout` async; ilk flash bir frame gecikebilir — kabul edilebilir.
- **Reanimated opsiyonelliği:** iki sürücüyü de bakımlı tutmak ek yük; bu yüzden Reanimated Faz 3'e ertelendi.
