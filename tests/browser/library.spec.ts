import {test,expect} from '@playwright/test';

test('component collection uses native controls, keyboard tabs, and a dismissible popover',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await expect(page).toHaveTitle('Prism Glass · Component library');
  await expect(page.getByRole('heading',{level:1})).toHaveText('A material. A family of controls.');
  await page.getByRole('button',{name:'Add item',exact:true}).click();await expect(page.locator('#item-count')).toHaveText('1 item added');
  const toggle=page.getByRole('switch',{name:'Notifications',exact:true});await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-checked','false');
  const slider=page.getByRole('slider',{name:'Volume',exact:true});await slider.focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#volume-value')).toHaveText('51%');
  await page.getByRole('tab',{name:'Material',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Motion',exact:true})).toBeFocused();await expect(page.getByRole('tabpanel',{name:'Motion',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Align center',exact:true}).click();await expect(page.locator('.alignment-sample')).toHaveCSS('text-align','center');
  const toolbar=page.getByRole('toolbar',{name:'Text alignment',exact:true});await expect(toolbar.locator('[data-prism-renderer="svg-source"]')).toHaveCount(0);
  const trigger=page.getByRole('button',{name:'Display options',exact:true});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Display options',exact:true});await expect(dialog).toBeVisible();
  const dark=page.getByRole('switch',{name:'Dark appearance',exact:true});await expect(dark).toBeFocused();await dark.click();await expect(page.locator('.library')).toHaveAttribute('data-theme','dark');
  await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test('live media uses one canvas and responds to play, pause, seek, and material changes',async({page})=>{
  await page.goto('/');await expect(page.locator('#media-status')).toHaveText('Live refraction');
  await expect(page.locator('.flower-player canvas')).toHaveCount(1);
  const video=page.locator('video');await expect.poll(()=>video.evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
  if(await page.getByRole('button',{name:'Play video',exact:true}).isVisible())await page.getByRole('button',{name:'Play video',exact:true}).click();
  const initial=await video.evaluate(v=>v.currentTime);await expect.poll(()=>video.evaluate(v=>v.currentTime)).not.toBe(initial);
  await page.getByRole('button',{name:'Pause video',exact:true}).click();await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
  const seek=page.getByRole('slider',{name:'Video position',exact:true});await seek.focus();await page.keyboard.press('Home');await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeLessThan(.1);
  await page.keyboard.press('ArrowRight');await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(0);
  await page.getByRole('combobox',{name:'Video material',exact:true}).selectOption('regular');await expect(page.locator('.flower-player')).toHaveAttribute('data-variant','regular');
  await expect(page.locator('.play-control')).toHaveAttribute('data-prism-renderer','webgl-media');
  await expect(page.locator('.play-control')).toHaveAttribute('data-variant','regular');
  await page.getByRole('button',{name:'Back 15 seconds',exact:true}).click();await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBe(0);
});

test('reduced motion and increased contrast preserve functional controls',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce',contrast:'more'});await page.goto('/');
  await expect(page.locator('#media-status')).toHaveText('Accessible material');
  await expect(page.getByRole('button',{name:'Play video',exact:true})).toBeVisible();
  await expect(page.locator('.play-control > .prism-lens')).toHaveCSS('background-color','rgb(34, 42, 39)');
  await page.getByRole('button',{name:'Add item',exact:true}).click();await expect(page.locator('#item-count')).toHaveText('1 item added');
  await page.getByRole('switch',{name:'Notifications',exact:true}).click();await expect(page.getByRole('switch',{name:'Notifications',exact:true})).toHaveAttribute('aria-checked','false');
});

test.describe('mobile component layout',()=>{
  test.use({viewport:{width:390,height:844},deviceScaleFactor:3});
  test('keeps touch targets and popovers inside the viewport',async({page})=>{
    await page.goto('/');await expect(page.locator('#media-status')).toHaveText('Live refraction');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    for(const selector of ['.play-control','.skip-control','.video-seek']){
      const box=await page.locator(selector).first().boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button',{name:'Display options',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Display options',exact:true});await expect(dialog).toBeVisible();
    const rect=await dialog.boundingBox();expect(rect!.x).toBeGreaterThanOrEqual(0);expect(rect!.x+rect!.width).toBeLessThanOrEqual(390);expect(rect!.y+rect!.height).toBeLessThanOrEqual(844);
    await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
  });
});

test('unavailable WebGL reports fallback and keeps playback controls usable',async({page})=>{
  await page.addInitScript(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind:string,...args:any[]){
      if(kind==='webgl')return null;
      return (getContext as any).call(this,kind,...args);
    } as typeof getContext;
  });
  await page.goto('/');await expect(page.locator('#media-status')).toHaveText('Refraction unavailable');
  await expect(page.locator('.play-control > .prism-lens')).toHaveCSS('background-color','rgb(34, 42, 39)');
  const pause=page.getByRole('button',{name:'Pause video',exact:true});
  if(await pause.isVisible())await pause.click();
  await page.getByRole('button',{name:'Play video',exact:true}).click();
  await expect.poll(()=>page.locator('video').evaluate(v=>v.paused)).toBe(false);
});
