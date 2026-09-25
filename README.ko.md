# Prism Glass · 초기 알파

Aave의 웹 글라스 렌더링 구조에서 착안해 독립적으로 작성한 TypeScript 라이브러리입니다. 원본 DOM에 일반 SVG 필터를 적용해 렌즈 안의 픽셀을 굴절시킵니다. 이름은 가칭이며 npm에 공개하지 않았습니다.

## 바로 확인하기

`demo/index.html`을 브라우저에서 열면 됩니다. 필요한 코드가 들어 있어 CDN이 필요 없습니다. 포인터나 위치 슬라이더로 렌즈를 움직이고, `Refraction on/off`로 굴절 전후를 비교하세요. 하단의 `Run browser checks`로 생명주기를 검사할 수 있습니다.

## 설치와 사용

저장소를 내려받았다면 먼저 아래 명령으로 패키지를 생성합니다.

```sh
npm ci
npm run build
npm pack
```

생성된 파일이나 소스 압축 안에 제공된 npm 패키지를 사용할 프로젝트에 설치합니다.

```sh
npm install ./meapri-prism-glass-0.1.0-alpha.1.tgz
```

```ts
import { createGlass } from '@meapri/prism-glass';

const glass = createGlass(document.querySelector<HTMLElement>('#source')!, {
  lens: { x: 60, y: 40, width: 220, height: 120, radius: 30 },
  strength: 24,
  bevel: 28,
});

glass.update({ lens: { x: 100 } });
glass.destroy(); // 컴포넌트를 제거할 때 호출
```

React에서는 `@meapri/prism-glass/react`의 `GlassSource` 또는 `useGlass`를 사용합니다. 전체 API와 예제는 [README.md](README.md)에 있습니다.

## 형태와 재질

원형·타원형·캡슐형·둥근 사각형을 지원합니다. 형태에 맞춰 굴절 방향을 계산하며, 중앙이 평평한 표면·전체가 볼록한 표면·오목한 표면을 선택할 수 있습니다. 블러는 전체·중앙·가장자리에 적용할 수 있습니다.

```ts
import { createGlass, lensFor, getGlassPreset } from '@meapri/prism-glass';

const lens = lensFor('circle', { x: 20, y: 20, width: 96, height: 96 });
const glass = createGlass(source, getGlassPreset('button', lens));
```

`button`, `switch`, `slider`, `tab`, `panel` 프리셋은 용도와 렌즈 크기에 맞춰 강도·깊이·블러를 설정합니다. Aave의 비공개 설정을 복제한 값은 아닙니다. 데모의 `Component preset`에서 비교하고, 아래의 원형 버튼·스위치·슬라이더도 직접 조작할 수 있습니다. 주 렌즈에 겹쳐 있던 CSS 테두리는 제거했으며, 가장자리 광택은 `Edge light`로 조절합니다.

## 이 구조가 맞는 경우

- 탭, 선택 표시, 작은 카드처럼 굴절할 원본 영역을 직접 지정할 수 있는 UI
- 원본 DOM과 이벤트를 유지하면서 글자와 배경이 렌즈 가장자리에서 휘는 효과
- 위치와 강도 변경 시 맵을 재사용하고, 모양 변경 시에만 맵을 새로 만드는 구조

비어 있는 유리 요소를 임의의 웹페이지 위에 올린다고 뒤의 페이지가 굴절되지는 않습니다. `source`에 굴절할 콘텐츠를 넣어야 합니다. 또렷한 라벨이나 버튼은 원본과 형제인 상위 레이어에 두세요. 필터는 실제 클릭 좌표를 이동시키지 않습니다.

## 현재 확인한 범위

순수 계산·SSR 테스트 16개를 통과했습니다. 브라우저 검사와 실제 확인한 범위는 아래 검증 기록에 기재합니다. 네이티브 Safari·Firefox 실기기, React 클라이언트 통합, GPU 성능은 추가 검증이 필요합니다. 전 브라우저·전 기기에서 성능 문제가 없다고 보증하는 버전은 아닙니다.

작은 렌즈라도 원본 전체를 필터링하므로 앱 전체를 `source`로 감싸지 마세요. 이 알파는 원본 하나당 렌즈 하나를 지원하며, 다중 렌즈 합성·자동 배경 복제·영상용 WebGL 렌더러는 포함하지 않습니다.

[검증 기록](docs/VALIDATION.md) · [렌더링 구조](docs/ARCHITECTURE.md)

## 개발

```sh
npm ci
npm test
npm run dev
```

데모는 빌드 시 하나의 HTML로 묶입니다. 소스를 수정한 뒤에는 `npm run build`를 실행해 데모를 갱신하세요.
