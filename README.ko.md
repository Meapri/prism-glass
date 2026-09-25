# Prism Glass · 0.2 알파

Aave의 공개 렌더링 방식과 Apple의 Liquid Glass 디자인 원칙을 바탕으로 만든 웹 라이브러리입니다. TypeScript 코어와 선택형 React 컴포넌트를 제공합니다. npm에는 아직 공개하지 않았습니다.

[공개 데모](https://meapri.github.io/prism-glass/) · [광학 실험실](https://meapri.github.io/prism-glass/optics.html)

## 실행

```sh
npm ci
npm run build
npm run dev
```

- `/`: 컴포넌트 라이브러리와 실제 영상 플레이어
- `/optics.html`: 기존 광학 파라미터 실험실과 생명주기 검사

자바스크립트와 CSS는 빌드에 포함되며, 영상은 로컬 `demo/assets/flower.mp4`를 사용합니다. 영상 데모는 `file://` 대신 HTTP 서버에서 실행하세요.

## 설치

```sh
npm pack
npm install ./meapri-prism-glass-0.4.0-alpha.1.tgz
```

## React 컴포넌트

```tsx
import { GlassProvider, GlassButton, GlassSwitch, GlassSlider }
  from '@meapri/prism-glass/react';
import '@meapri/prism-glass/styles.css';

<GlassProvider variant="regular" appearance="auto">
  <GlassButton refractionTarget={<DecorativeArtwork />}>추가</GlassButton>
  <GlassSwitch aria-label="알림" checked={enabled}
    onCheckedChange={setEnabled} />
  <GlassSlider aria-label="음량" value={volume}
    onValueChange={setVolume} />
</GlassProvider>
```

버튼, 스위치, 슬라이더, 탭, 툴바, 팝오버, 일반 표면과 미디어 장면을 제공합니다. 탭은 방향키·Home·End와 RTL을 지원하고, 팝오버는 Escape·바깥 클릭·포커스 복귀를 처리합니다. 툴바 내부의 버튼은 유리를 다시 겹치지 않습니다.

`regular`는 일반 조작부와 글자 가독성에, `clear`는 사진·영상 위의 밝고 굵은 조작부에 맞춥니다. 한 그룹의 재질을 일관되게 유지하세요. 동작 줄이기, 투명도 줄이기, 대비 증가, 강제 색상 설정에 대응하는 스타일을 포함합니다.

## 굴절할 원본을 명시합니다

- `refractionTarget`: 직접 제공한 장식용 DOM을 굴절합니다. 전경의 실제 버튼·라벨과 분리하며, 원본 레이어는 포커스나 클릭을 받지 않습니다.
- `GlassMediaScene`: 하나의 영상·이미지·캔버스에서 여러 렌즈를 렌더링합니다. 재생 중인 영상을 복제하지 않습니다.
- 둘 다 없는 표면은 CSS 블러·색조 재질로 동작합니다. 임의의 웹페이지 배경을 자동으로 굴절한다고 표시하지 않습니다.

기존 `createGlass`, `GlassSource`, `useGlass` API도 유지합니다. SVG 원본 하나당 렌즈 하나이고, 미디어 렌더러는 원본 하나에 최대 64개 렌즈를 지원합니다. 작은 원본 영역을 사용하고 앱 전체를 SVG 필터로 감싸지 마세요.

## 프레임워크 독립형 미디어 API

```ts
import { createMediaGlass } from '@meapri/prism-glass/media';

const glass = createMediaGlass(overlayCanvas, video, {
  lenses: [{ id: 'play', variant: 'clear',
    lens: { x: 80, y: 60, width: 120, height: 120,
      radius: 60, shape: 'circle' } }],
});
glass.updateLens('play', { lens: { x: 160 }, press: 0.5 });
glass.destroy();
```

영상의 `object-fit`, 위치, 배경색을 렌더러와 맞추세요. 위치·눌림·밝기 변경은 맵을 재사용하고, 영상 프레임은 모든 렌즈가 공유합니다. 일시정지·화면 밖에서는 불필요한 반복 렌더링을 멈춥니다. 외부 영상은 CORS 허용이 필요하며, WebGL 실패는 진단 상태와 불투명 조작부로 처리합니다.

DOM 원본에는 내부 `overflow: hidden; isolation: isolate` 레이어를 사용합니다. `translateZ(0)`을 강제하면 Safari에서 SVG 필터가 생략될 수 있습니다. PNG 광학 맵을 위해 CSP의 `img-src`에는 `data:` 허용이 필요합니다.

## 검증과 구현 범위

[검증 기록](docs/VALIDATION.md)에 실제 실행한 브라우저와 테스트 결과를 구분해 기록합니다. Apple/Aave의 비공개 셰이더를 복제한 구현은 아니며, 물리적인 iOS 기기와 장시간 GPU 성능을 자동 WebKit 결과만으로 보증하지 않습니다.

[전체 API](README.md) · [디자인 원칙과 지원 범위](docs/LIQUID_GLASS.md) · [렌더링 구조](docs/ARCHITECTURE.md)

## GitHub Pages 배포

`npm run build:pages`로 데모 두 페이지와 영상만 `pages-dist/`에 모읍니다. 이 디렉터리를 `gh-pages` 브랜치 루트에 게시합니다. `main` 변경만으로는 공개 데모가 갱신되지 않습니다.

## 용도별 프리셋과 배경 적응

`GlassSurface preset="navigation" appearance="adaptive"`처럼 사용합니다. 내비게이션·툴바·탭 바·검색창·버튼·플로팅 액션·선택 표시·메뉴·팝오버·사이드바·시트·미디어의 12가지 프리셋을 제공합니다.

`auto`는 OS 모드, `adaptive`는 표면 뒤의 콘텐츠를 따릅니다. 작은 Regular 표면은 라이트·다크가 전환되고, 큰 메뉴·사이드바·시트는 글자색을 유지하며 틴트·확산·그림자가 적응합니다. Clear는 고정된 밝은 전경과 로컬 디밍을 유지합니다.

[지원 배경, API, 제한사항](docs/MATERIAL_PRESETS.md)을 확인하세요. `/#materials` 데모에서 배경을 바꾸고 프리셋별 동작을 비교할 수 있습니다.

## 눌림 발광과 등장·퇴장

눌린 지점에 밝은 중심과 부드러운 빛 번짐이 생기고, 같은 `GlassLightGroup` 안의 가까운 유리에 약하게 전달됩니다. 실제 HDR 출력은 사용하지 않습니다.

`<GlassPresence present={open} preset="popover">…</GlassPresence>`는 굴절·확산·경계와 콘텐츠 선명도를 함께 변화시킨 뒤 퇴장 완료 시 제거합니다. 기존 표면을 유지하려면 `GlassSurface`의 `present`를 사용하세요. 네이티브 팝오버에는 자동 적용됩니다.

[공식 참고 자료, 사용법과 한계](docs/MOTION.md) · [빛과 모션 데모](https://meapri.github.io/prism-glass/#motion)
