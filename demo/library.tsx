import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { GlassProvider, GlassButton, GlassSwitch, GlassSlider, GlassTabs, GlassToolbar, GlassPopover, GlassSurface, GlassMediaScene } from '../src/react.js';
import type { GlassVariant } from '../src/materials.js';
import type { MediaGlassDiagnostics } from '../src/media-types.js';

function PlaybackIcon({ playing }: { playing: boolean }) {
  return <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">{playing ? <><rect x="15" y="10" width="12" height="44" rx="2.5" /><rect x="37" y="10" width="12" height="44" rx="2.5" /></> : <path d="M23 11c-2-1.2-4 .2-4 2.5v37c0 2.3 2 3.7 4 2.5l31-18.5c2-1.2 2-3.8 0-5z" />}</svg>;
}
function SkipIcon({ forward = false }: { forward?: boolean }) {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><g transform={forward ? 'translate(64 0) scale(-1 1)' : undefined}>
    <path d="M12 30a22 22 0 1 1 7 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="m5 24 7 11 7-11" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
  </g><text x="33" y="40" fill="currentColor" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="24" fontWeight="450">15</text></svg>;
}
function AlignIcon({ alignment }: { alignment: 'left' | 'center' | 'right' }) {
  const shortX = alignment === 'left' ? 4 : alignment === 'right' ? 10 : 7;
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d={`M4 5h16M${shortX} 10h10M4 15h16M${shortX} 20h10`} /></svg>;
}
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function MediaExample() {
  const video = useRef<HTMLVideoElement | null>(null), [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0), [currentTime, setCurrentTime] = useState(0);
  const [variant, setVariant] = useState<GlassVariant>('clear'), [status, setStatus] = useState('loading');
  const options = useRef({ onStatus: (d: MediaGlassDiagnostics) => setStatus(d.state) }).current;
  useEffect(() => {
    const media = video.current!;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) void media.play().catch(() => setPlaying(false));
  }, []);
  function toggle() {
    const media = video.current!;
    if (media.paused) void media.play().catch(() => setPlaying(false));
    else { media.pause(); setPlaying(false); setCurrentTime(media.currentTime); }
  }
  function seek(value: number) {
    const media = video.current!; if (!Number.isFinite(media.duration)) return;
    media.currentTime = Math.max(0, Math.min(media.duration, value)); setCurrentTime(media.currentTime);
  }
  return <section className="media-example" aria-label="Shared media refraction">
    <GlassMediaScene source={video} media={options} variant={variant} className="flower-player" aria-label="Flower video player">
      <video ref={video} src="./assets/flower.mp4" muted playsInline loop preload="auto" aria-label="Garden flowers and leaves"
        onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)} onPause={event => { setPlaying(false); setCurrentTime(event.currentTarget.currentTime); }} onSeeked={event => setCurrentTime(event.currentTarget.currentTime)} />
      <div className="prism-media-controls"><div className="playback-row">
        <GlassButton shape="circle" className="skip-control" aria-label="Back 15 seconds" onClick={() => seek((video.current?.currentTime ?? 0) - 15)} optics={{ blur: 0.25, strength: 18 }}><SkipIcon /></GlassButton>
        <GlassButton shape="circle" className="play-control" aria-label={playing ? 'Pause video' : 'Play video'} onClick={toggle}
          optics={{ surface: 'dome', depth: 1.3, curvature: 2.4, strength: 42, blur: variant === 'clear' ? 0 : 6 }}><PlaybackIcon playing={playing} /></GlassButton>
        <GlassButton shape="circle" className="skip-control" aria-label="Forward 15 seconds" onClick={() => seek((video.current?.currentTime ?? 0) + 15)} optics={{ blur: 0.25, strength: 18 }}><SkipIcon forward /></GlassButton>
      </div><GlassSurface shape="capsule" className="scrub-glass" optics={{ strength: 16, bevel: 22, blur: variant === 'clear' ? 0.4 : 6 }}>
        <input className="video-seek" type="range" min="0" max={duration || 1} step="0.01" value={Math.min(currentTime, duration || 1)}
          disabled={!duration} aria-label="Video position" aria-valuetext={`${timeLabel(currentTime)} of ${timeLabel(duration)}`}
          style={{ '--video-progress': `${duration ? currentTime / duration * 100 : 0}%` } as CSSProperties}
          onChange={event => seek(event.currentTarget.valueAsNumber)} />
      </GlassSurface></div>
    </GlassMediaScene>
    <div className="media-caption"><p>One video. Four lenses. Every frame stays live.</p><div className="media-options">
      <label>Material <select aria-label="Video material" value={variant} onChange={event => setVariant(event.target.value as GlassVariant)}><option value="clear">Clear</option><option value="regular">Regular</option></select></label>
      <span id="media-status" role="status">{status === 'ready' ? 'Live refraction' : status === 'paused' ? 'Idle while offscreen' : status === 'disabled' ? 'Accessible material' : status === 'fallback' || status === 'error' ? 'Refraction unavailable' : 'Preparing media'}</span>
    </div></div>
  </section>;
}
function Artwork() { return <span className="sample-artwork"><span /></span>; }
function Library() {
  const [count, setCount] = useState(0), [enabled, setEnabled] = useState(true), [volume, setVolume] = useState(50);
  const [dark, setDark] = useState(false), [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  return <GlassProvider appearance={dark ? 'dark' : 'light'}><div className="library" data-theme={dark ? 'dark' : 'light'}>
    <header className="site-header"><a className="brand" href="#"><span className="brand-mark" aria-hidden="true" />Prism Glass</a><nav aria-label="Main navigation"><a href="#components">Components</a><a href="./optics.html">Optics</a><a href="#api">API</a></nav></header>
    <main><section className="library-intro"><h1>A material. A family of controls.</h1><p>Live refraction, clear interactions.<br />{' '}Liquid glass for the web, from the renderer to the button.</p></section>
      <MediaExample />
      <section id="components" className="component-library"><div className="section-title"><h2>Made for interaction.</h2><p>One material system. Familiar, accessible controls.</p></div>
        <div className="component-row">
          <article className="component-example"><h3>Button</h3><div className="example-stage"><GlassButton refractionTarget={<Artwork />} onClick={() => setCount(value => value + 1)}>Add item <span aria-hidden="true">＋</span></GlassButton></div><p role="status" id="item-count">{count ? `${count} ${count === 1 ? 'item' : 'items'} added` : 'A little light with every press.'}</p></article>
          <article className="component-example"><h3>Switch</h3><div className="example-stage switch-example"><span>Notifications</span><GlassSwitch checked={enabled} onCheckedChange={setEnabled} aria-label="Notifications" /></div><p id="notification-value">{enabled ? 'On' : 'Off'} · The lens follows the track.</p></article>
          <article className="component-example"><h3>Slider</h3><div className="example-stage"><GlassSlider value={volume} onValueChange={setVolume} aria-label="Volume" /></div><p><output id="volume-value">{volume}%</output> · A gentler bend for precise input.</p></article>
        </div>
        <div className="component-row wide-row">
          <article className="component-example tabs-example"><h3>Tabs</h3><GlassTabs aria-label="Library guide" items={[
            { value: 'material', label: 'Material', content: 'Regular softens busy backgrounds. Clear lets photos and video show through, with local dimming to keep bold controls legible.' },
            { value: 'motion', label: 'Motion', content: 'Selection moves with a spring. Press feedback responds immediately. Reduced motion removes the elastic response.' },
            { value: 'accessibility', label: 'Accessibility', content: 'Keyboard controls, visible focus, reduced transparency, increased contrast, and forced colors are part of the same system.' },
          ]} /></article>
          <article className="component-example"><h3>Toolbar &amp; popover</h3><div className="toolbar-example"><GlassToolbar aria-label="Text alignment" refractionTarget={<Artwork />}>
            {(['left', 'center', 'right'] as const).map(value => <GlassButton key={value} shape="rounded-rect" aria-label={`Align ${value}`} aria-pressed={alignment === value} onClick={() => setAlignment(value)}><AlignIcon alignment={value} /></GlassButton>)}
          </GlassToolbar><GlassPopover trigger="Display options" aria-label="Display options"><h4>Display options</h4><div className="setting-row"><span>Dark appearance</span><GlassSwitch checked={dark} onCheckedChange={setDark} aria-label="Dark appearance" /></div><p>One glass layer. Controls inside remain simple.</p></GlassPopover></div><p className="alignment-sample" style={{ textAlign: alignment }}>Content stays clear.</p></article>
        </div>
      </section>
      <section id="api" className="api-section"><div><h2>Choose the source.<br />Keep the controls.</h2><p>Use SVG for an explicit DOM source and one shared WebGL renderer for media. Your labels, buttons, and keyboard behavior remain ordinary HTML.</p><div className="source-links"><a href="https://aave.com/design/building-glass-for-the-web">Aave’s rendering approach ↗</a><a href="https://developer.apple.com/design/human-interface-guidelines/materials">Apple’s material guidance ↗</a></div></div>
        <pre><code>{`import { GlassProvider, GlassButton,\n  GlassSwitch } from '@meapri/prism-glass/react';\nimport '@meapri/prism-glass/styles.css';\n\n<GlassProvider variant="regular">\n  <GlassButton refractionTarget={<Artwork />}>\n    Add item\n  </GlassButton>\n  <GlassSwitch aria-label="Notifications"\n    checked={enabled}\n    onCheckedChange={setEnabled} />\n</GlassProvider>`}</code></pre>
      </section>
    </main><footer><span>Prism Glass · Independent web implementation</span><span>TypeScript core · React components · Source-first optics</span></footer>
  </div></GlassProvider>;
}
createRoot(document.getElementById('root')!).render(<Library />);
