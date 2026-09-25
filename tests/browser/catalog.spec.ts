import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const inventory=JSON.parse(readFileSync('docs/HIG_INVENTORY.json','utf8'));
test.use({viewport:{width:402,height:812}});
async function scene(page:Page,component:string,state='default'){
 await page.goto(`/catalog-scene.html?${new URLSearchParams({component,state})}`);
 await expect(page.locator('[data-scene-ready]')).toHaveAttribute('data-scene-ready','true');
}

test('catalog lists the complete HIG inventory and switches live states without missing assets',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('/catalog.html?component=buttons');
 await expect(page.getByRole('navigation',{name:'Component catalog'}).getByRole('button')).toHaveCount(inventory.items.length+4);
 await expect(page.getByAltText('Native iOS 27 buttons base reference')).toBeVisible();
 await page.getByLabel('Catalog state').selectOption('disabled');
 await expect(page.frameLocator('iframe').getByRole('button',{name:'Continue',exact:true}).first()).toBeDisabled();
 await page.getByLabel('Catalog background').selectOption('grid');
 await expect(page.getByText('No native capture is available for this background.',{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(402);expect(errors).toEqual([]);
});

test('menu keyboard navigation skips disabled items, preserves checked actions and restores focus',async({page})=>{
 await scene(page,'menus','closed');const trigger=page.getByRole('button',{name:'Actions',exact:true});await trigger.click();
 const menu=page.getByRole('menu',{name:'Actions',exact:true});await expect(menu).toBeVisible();
 await expect(menu.getByRole('menuitem',{name:'Copy',exact:true})).toBeFocused();
 await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');
 const favorite=menu.getByRole('menuitemcheckbox',{name:'Favorite',exact:true});await expect(favorite).toBeFocused();await page.keyboard.press('Enter');await expect(favorite).toHaveAttribute('aria-checked','false');
 await page.keyboard.press('ArrowDown');await expect(menu.getByRole('menuitem',{name:'Delete',exact:true})).toBeFocused();
 await page.keyboard.press('Enter');await expect(menu).toBeHidden();await expect(trigger).toBeFocused();await expect(page.getByRole('status')).toHaveText('Delete selected');
});

test('context menu opens by keyboard and returns focus to its own target',async({page})=>{
 await scene(page,'context-menus','closed');const target=page.locator('.prism-context-target');await target.focus();await page.keyboard.press('Shift+F10');
 const menu=page.getByRole('menu',{name:'Context actions'});await expect(menu).toBeVisible();await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(target).toBeFocused();
});

test('alert uses a real modal, isolates background input and returns focus after exit',async({page})=>{
 await scene(page,'alerts','closed');const trigger=page.getByRole('button',{name:'Present',exact:true});await trigger.click();
 const alert=page.getByRole('alertdialog',{name:'Delete item?'});await expect(alert).toBeVisible();await expect(alert.getByRole('button',{name:'Cancel'})).toBeFocused();
 await trigger.evaluate(node=>node.focus());await expect(trigger).not.toBeFocused();
 await alert.getByRole('button',{name:'Delete',exact:true}).click();await expect(alert).toBeHidden();await expect(trigger).toBeFocused();await expect(page.getByRole('status')).toHaveText('Item removed');
});

test('sheet detents support keyboard size changes and modal dismissal',async({page})=>{
 await scene(page,'sheets','closed');await page.getByRole('button',{name:'Present',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Collection'}),size=dialog.getByRole('slider',{name:'Sheet size'});await expect(dialog).toBeVisible();
 await expect(size).toHaveAttribute('aria-valuetext','medium');await size.focus();await page.keyboard.press('End');await expect(size).toHaveAttribute('aria-valuetext','large');
 await page.keyboard.press('Home');await expect(size).toHaveAttribute('aria-valuetext','medium');await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Present'})).toBeFocused();
});

test('input controls update values and honor disabled state',async({page})=>{
 await scene(page,'steppers');const increase=page.getByRole('button',{name:'Increase Amount'});await increase.click();await expect(page.getByRole('group',{name:'Amount: 4'})).toBeVisible();
 await page.getByRole('button',{name:'Quality',exact:true}).click();await page.getByRole('menuitemradio',{name:'High',exact:true}).click();await expect(page.getByRole('button',{name:'Quality',exact:true})).toHaveText('High');
 await page.getByRole('textbox',{name:'Name',exact:true}).fill('New collection');await expect(page.getByRole('textbox',{name:'Name',exact:true})).toHaveValue('New collection');
 const current=page.getByRole('button',{name:'Page 3 of 7'});await current.focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('button',{name:'Page 4 of 7'})).toHaveAttribute('aria-current','page');
 await scene(page,'steppers','disabled');await expect(page.getByRole('button',{name:'Increase Amount'})).toBeDisabled();await expect(page.getByRole('textbox',{name:'Name',exact:true})).toBeDisabled();
});

test('wheel and calendar expose keyboard selection without losing their active item',async({page})=>{
 await scene(page,'pickers');const wheel=page.getByRole('listbox',{name:'Number'});await wheel.focus();await page.keyboard.press('ArrowDown');await expect(wheel.getByRole('option',{name:'4',exact:true})).toHaveAttribute('aria-selected','true');
 const date=page.getByRole('button',{name:'Friday, September 25, 2026',exact:true});await date.focus();await page.keyboard.press('ArrowRight');
 const next=page.getByRole('button',{name:'Saturday, September 26, 2026',exact:true});await expect(next).toBeFocused();await page.keyboard.press('Enter');await expect(next.locator('..')).toHaveAttribute('aria-selected','true');
});

test('clear dock, chips, notifications and tab bars keep their interactive semantics',async({page})=>{
 await scene(page,'dock');await page.getByRole('button',{name:'Phone',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Phone selected');
 await scene(page,'chips');const chip=page.getByRole('button',{name:'Filter',exact:true});await chip.click();await expect(chip).toHaveAttribute('aria-pressed','true');
 await scene(page,'notifications','expanded');await page.getByRole('button',{name:'Dismiss notification'}).click();await expect(page.getByRole('button',{name:'Show notification'})).toBeVisible();
 await scene(page,'tab-bars');await page.getByRole('tab',{name:'Explore',exact:true}).click();await expect(page.getByRole('tab',{name:'Explore',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('.scene-tab-title')).toHaveText('Explore');
});

test('elastic dock presses reuse high-density fields throughout a complete press and release',async({page})=>{
 await page.addInitScript(()=>{
  (window as any).fieldUploads=0;
  const original=WebGLRenderingContext.prototype.texImage2D;
  WebGLRenderingContext.prototype.texImage2D=function(...args:any[]){if(args.at(-1) instanceof Uint8Array)(window as any).fieldUploads++;return (original as any).apply(this,args);};
 });
 await scene(page,'dock');await expect(page.locator('.catalog-scene')).toHaveAttribute('data-prism-state','ready');
 const button=page.getByRole('button',{name:'Phone',exact:true}),rect=await button.boundingBox();
 const before=await page.evaluate(()=>(window as any).fieldUploads);await page.mouse.move(rect!.x+rect!.width/2,rect!.y+rect!.height/2);await page.mouse.down();
 await expect.poll(()=>button.evaluate(node=>parseFloat((node as HTMLElement).style.getPropertyValue('--prism-press')))).toBeGreaterThan(.9);
 await page.mouse.up();await expect.poll(()=>button.evaluate(node=>parseFloat((node as HTMLElement).style.getPropertyValue('--prism-press')))).toBeLessThan(.01);
 const after=await page.evaluate(()=>(window as any).fieldUploads);expect(after-before).toBeLessThanOrEqual(4);
});
