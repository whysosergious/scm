// SCM headless e2e suite. Served from a throwaway harness page
// (tools/e2e/e2e.html.template -> web/e2e.html in a temp CWD) — never part
// of the shipped app. Run: see tools/e2e/README.md.
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
async function until(fn,t=10000,w=''){const s=performance.now();while(performance.now()-s<t){try{const v=fn();if(v)return v}catch(_){}await sleep(150);}throw new Error('timeout waiting for '+w);}
const results=[];
function report(n,ok,x=''){results.push(`${ok?'PASS':'FAIL'}: ${n}${x?' — '+x:''}`);}
function paint(){document.getElementById('e2e-results').textContent=results.join('\n');
  document.title=results.some(r=>r.startsWith('FAIL'))?'E2E-FAIL':'E2E-OK';}
async function phase(n,fn){try{await fn();report(n,true);}catch(e){report(n,false,e.message);}paint();}
const $q=(s,r=document)=>r.querySelector(s);
const $$q=(s,r=document)=>[...r.querySelectorAll(s)];
const $$=$$q;
const allRows=()=>$$q('.field-item.prop-row');
const headInput=r=>$q(':scope > .field-content > .head-row .name-cell > .title-input',r);
const rowByName=k=>allRows().find(r=>headInput(r)?.value===k);
const rootRows=()=>$$('#form-root-list > .field-item.prop-row');
const ownList=row=>$q('.prop-body > .nested-container',row);
const kidRows=list=>[...list.children].filter(c=>c.classList.contains('prop-row'));
async function dragRow(sourceRow,target){
  // target: number (viewport y) or function (re-evaluated after activation,
  // because hiding the source row shifts the layout).
  const handle=$q('.drag-handle',sourceRow);
  const h=handle.getBoundingClientRect();
  const sx=h.left+8, sy=h.top+8;
  handle.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:sx,clientY:sy,button:0}));
  await sleep(60);
  window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:sx,clientY:sy+12}));
  await sleep(40);
  for(let i=1;i<=8;i++){
    const ty = typeof target==='function' ? target() : target;
    window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,
      clientX:sx+260*(i/8), clientY:sy+12+(ty-(sy+12))*(i/8)}));
    await sleep(30);
  }
  const ty = typeof target==='function' ? target() : target;
  window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:sx+260,clientY:ty}));
  await sleep(180);
}

(async()=>{
 self.addEventListener('unhandledrejection',e=>{report('unhandled rejection',false,String(e.reason));paint();});

 await phase('boot lists posts.json',()=>
   until(()=>$$q('#content-nav .nav-item').some(a=>a.textContent.includes('posts.json')),15000,'nav item'));

 await phase('sidebar category toggles file list', async ()=>{
   const header=$q('.nav-cat-header');
   if(!header) throw new Error('no category header');
   if(!$q('.nav-file-list .nav-item')) throw new Error('files not listed when open');
   header.click(); await sleep(120);
   if($q('.nav-category > .nav-file-list')) throw new Error('list visible when closed');
   header.click(); await sleep(120);
   if(!$q('.nav-category > .nav-file-list .nav-item')) throw new Error('list did not reopen');
   if(!$q('#add-file-btn')) throw new Error('add button missing in category');
 });

 await phase('collapsed sidebar keeps fly-out with files', async ()=>{
   const sidebar=$q('#sidebar');
   sidebar.classList.add('collapsed');
   await sleep(150);
   const flyout=$q('.cat-flyout');
   if(!flyout) throw new Error('no flyout');
   if(getComputedStyle(flyout).display!=='none') throw new Error('flyout visible without hover');
   if(!$q('.nav-item',flyout)) throw new Error('flyout has no files');
   if(!$q('.nav-file-add',flyout)) throw new Error('flyout has no add button');
   if(getComputedStyle($q('#nav-settings')).display==='none') throw new Error('footer settings hidden');
   sidebar.classList.remove('collapsed');
   await sleep(100);
 });

 await phase('form renders parsed rows', async ()=>{
   $$q('#content-nav .nav-item').find(a=>a.textContent.includes('posts.json')).click();
   await until(()=>rowByName('site')&&rowByName('posts'),8000,'rows');
 });

 await phase('collapse shows (n items)', async ()=>{
   const site=rowByName('site');
   $q('.chevron-btn',site).click(); await sleep(120);
   const note=$q('.count-note',site);
   if(getComputedStyle(note).display==='none') throw new Error('count hidden');
   if(!note.textContent.includes('(2 items)')) throw new Error('bad count');
   $q('.chevron-btn',site).click(); await sleep(80);
 });

 await phase('rename commits on blur', async ()=>{
   const inp=$q('.title-input',rowByName('site'));
   inp.focus(); inp.value='website'; inp.dispatchEvent(new Event('input',{bubbles:true})); inp.blur();
   await until(()=>rowByName('website'),3000,'renamed');
 });

 await phase('duplicate rename rejected + Esc restores', async ()=>{
   const inp=$q('.title-input',rowByName('website'));
   inp.focus(); inp.value='posts'; inp.dispatchEvent(new Event('input',{bubbles:true})); inp.blur();
   await sleep(120);
   if(!$q('.title-input',rowByName('website')).classList.contains('invalid')) throw new Error('no highlight');
   const live=$q('.title-input',rowByName('website'));
   live.value='posts'; live.dispatchEvent(new Event('input',{bubbles:true}));
   live.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
   await sleep(100);
   if($q('.title-input',rowByName('website')).value!=='website') throw new Error('no restore');
 });

 await phase('type switch number->boolean coerces', async ()=>{
   const numberRow=allRows().find(r=>$q('.type-label',r)?.textContent==='Number');
   $q('.type-btn',numberRow).click(); await sleep(120);
   $$q('.menu-dropdown.type-menu .menu-item').find(b=>b.textContent.trim()==='Boolean').click();
   await sleep(300);
   const fresh=allRows().find(r=>$q('.title-input',r)?.value==='views');
   if(!$q('.switch input',fresh).checked) throw new Error('coercion wrong');
 });

 await phase('string modes: input/textarea/rich switch', async ()=>{
   let website=rowByName('website');
   const nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   const btns=$$('.mode-btn',nameRow);
   if(btns.length!==3) throw new Error('expected 3 mode buttons');
   if(!btns[0].classList.contains('active')) throw new Error('input not default for plain string');
   btns[2].click(); await sleep(700);
   website=rowByName('website');
   const rte=$q('rich-text-editor',$q('.prop-body',website));
   if(!rte) throw new Error('rich editor missing');
   rte.value='<p><strong>Bold</strong> intro</p>';
   rte.dispatchEvent(new Event('input',{bubbles:true}));
   await sleep(150);
   website=rowByName('website');
   $$('.mode-btn',$q('.prop-body',website)).find(b=>b.title==='Resizable text field').click();
   await sleep(250);
   website=rowByName('website');
   const ta=$q('textarea.value-input',$q('.prop-body',website));
   if(!ta.value.includes('<strong>Bold</strong>')) throw new Error('html source lost: '+ta.value);
   ta.value='Demo'; ta.dispatchEvent(new Event('input',{bubbles:true}));
   website=rowByName('website');
   $$('.mode-btn',$q('.prop-body',website)).find(b=>b.title==='Single-line text input').click();
   await sleep(250);
   website=rowByName('website');
   const inp=$q('input.value-input',$q('.prop-body',website));
   if(!inp||inp.value!=='Demo') throw new Error('input mode restore failed');
 });

 await phase('clone inserts deep copy under original', async ()=>{
   let website=rowByName('website');
   const nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   $q('.clone-btn',nameRow).click();
   await sleep(250);
   website=rowByName('website');
   const keys=$$q('.title-input',$q('.prop-body',website)).map(i=>i.value);
   const i=keys.indexOf('name');
   if(i===-1||keys[i+1]!=='name2') throw new Error('clone keys: '+keys.join(','));
   const cloneRow=$$('.field-item.prop-row',$q('.prop-body',rowByName('website')))
     .find(r=>$q('.title-input',r)?.value==='name2');
   $q('.delete-btn',cloneRow).click();
   await sleep(200);
 });

 await phase('add property scoped to website', async ()=>{
   let website=rowByName('website');
   $q(':scope > .add-section .btn-primary', ownList(website)).click();
   await sleep(250);
   website=rowByName('website');
   if(!$$q('.title-input',$q('.prop-body',website)).map(i=>i.value).includes('property')) throw new Error('not added');
 });

 await phase('add entry re-indexes array', async ()=>{
   let posts=rowByName('posts');
   $q(':scope > .add-section .btn-primary', ownList(posts)).click();
   await sleep(250);
   posts=rowByName('posts');
   const badges=kidRows(ownList(posts)).map(r=>$q('.index-badge',r)?.textContent);
   if(badges.join(',')!=='[0],[1]') throw new Error('badges: '+badges.join(','));
 });

 await phase('delete entry re-indexes', async ()=>{
   let posts=rowByName('posts');
   $q('.delete-btn', kidRows(ownList(posts))[1]).click();
   await sleep(250);
   posts=rowByName('posts');
   const badges=kidRows(ownList(posts)).map(r=>$q('.index-badge',r)?.textContent);
   if(badges.join(',')!=='[0]') throw new Error('badges: '+badges.join(','));
 });

 await phase('drag sibling reorder at root (upward)', async ()=>{
   const website=rowByName('website');
   website.scrollIntoView({block:'center'}); await sleep(100);
   await dragRow(rowByName('posts'), () => rowByName('website').getBoundingClientRect().top+6);
   const names=rootRows().map(r=>headInput(r)?.value);
   if(names.join(',')!=='posts,website') throw new Error('order: '+names.join(','));
 });

 await phase('drag downward past sibling (regression)', async ()=>{
   const posts=rowByName('posts');
   posts.scrollIntoView({block:'center'}); await sleep(100);
   const wr=rowByName('website').getBoundingClientRect();
   await dragRow(posts, () => rowByName('website').getBoundingClientRect().bottom-4);
   const names=rootRows().map(r=>headInput(r)?.value);
   if(names.join(',')!=='website,posts') throw new Error('order: '+names.join(','));
 });

 await phase('drag cross-parent into object', async ()=>{
   const findIdRow=()=>$$q('.field-item.prop-row').find(r=>$q(':scope > .field-content > .head-row .name-cell > .title-input',r)?.value==='id');
   for (let attempt=1; attempt<=3; attempt++) {
     const idRow=findIdRow();
     if(!idRow) throw new Error('id row missing');
     let website=rowByName('website');
     let wbody=$q('.prop-body',website);
     if(getComputedStyle(wbody).display==='none'){ $q('.chevron-btn',website).click(); await sleep(150); }
     website=rowByName('website'); wbody=$q('.prop-body',website);
     const nameRow=$$('.field-item.prop-row',wbody).find(r=>$q('.title-input',r)?.value==='name');
     nameRow.scrollIntoView({block:'center'}); await sleep(150);
     await dragRow(idRow, nameRow.getBoundingClientRect().bottom+5);
     await sleep(250);
     website=rowByName('website'); wbody=$q('.prop-body',website);
     const keys=$$q('.title-input',wbody).map(i=>i.value);
     if(keys.includes('id')) return;
     // diagnostics: where did id land?
     const idNow=findIdRow();
     const chain=[];
     let el=idNow;
     while(el){ if(el.dataset && el.dataset.parentId) chain.push(el.dataset.parentId); el=el.parentElement; }
     results.push(`  retry ${attempt}: id ancestors=[${chain.join(',')}], keys=[${keys.join(',')}]`);
   }
   throw new Error('id not moved into website after retries');
 });

 await phase('json tab reflects form edits', async ()=>{
   $$('.tab-btn').find(b=>b.textContent==='JSON').click(); await sleep(150);
   const ta=$q('.json-editor');
   if(!ta.value.includes('"website"')) throw new Error('no sync');
   JSON.parse(ta.value);
 });

 await phase('save persists to server', async ()=>{
   $$('.tab-btn').find(b=>b.textContent==='Form').click(); await sleep(200);
   const btn=$$('.btn-save').find(b=>b.textContent==='Save');
   btn.click();
   await until(()=>$$q('.toast-message').some(t=>t.textContent.includes('Saved')),8000,'saved toast');
   const text=await (await fetch('/api/projects/demo-site/content/posts.json?cb='+Date.now())).text();
   const doc=JSON.parse(text);
   if(Object.keys(doc)[0]!=='website'||!doc.website.id) throw new Error('server state wrong: '+Object.keys(doc));
 });

 await phase('markdown autodetect + round-trip', async ()=>{
   // posts[0].title was never mode-touched → autodetect applies cleanly.
   const posts=rowByName('posts');
   const entry=kidRows(ownList(posts))[0];
   const titleRow=$$('.field-item.prop-row',$q('.prop-body',entry))
     .find(r=>$q('.title-input',r)?.value==='title');
   if(!titleRow) throw new Error('title row missing');
   $$('.mode-btn',titleRow).find(b=>b.title==='Resizable text field').click();
   await sleep(200);
   const entry2=kidRows(ownList(rowByName('posts')))[0];
   const titleRow2=$$('.field-item.prop-row',$q('.prop-body',entry2))
     .find(r=>$q('.title-input',r)?.value==='title');
   const ta=$q('textarea.value-input',titleRow2);
   if(!ta) throw new Error('textarea missing');
   ta.value='## Heading\n\n- one\n- two with **bold**';
   ta.dispatchEvent(new Event('input',{bubbles:true}));
   await sleep(150);
   // save the markdown, then reopen: fresh parse must autodetect rich/md
   $$('.btn-save').find(b=>b.textContent==='Save').click();
   await until(()=>$$q('.toast-message').some(t=>t.textContent.includes('Saved')),8000,'saved toast');
   await sleep(300);
   $$q('#content-nav .nav-item').find(a=>a.textContent.includes('posts.json')).click();
   await sleep(300);
   $$q('#content-nav .nav-item').find(a=>a.textContent.includes('posts.json')).click();
   await sleep(500);
   const posts3=rowByName('posts');
   const entry3=kidRows(ownList(posts3))[0];
   const titleRow3=$$('.field-item.prop-row',$q('.prop-body',entry3))
     .find(r=>$q('.title-input',r)?.value==='title');
   const richBtn=$$('.mode-btn',titleRow3).find(b=>b.title==='Rich text');
   if(!richBtn.classList.contains('active')) throw new Error('markdown not autodetected');
   const rte=$q('rich-text-editor',titleRow3);
   if(!rte||rte.getAttribute('format')!=='markdown') throw new Error('format wrong: '+rte?.getAttribute('format'));
   if(!rte.value.includes('**bold**')||!rte.value.includes('Heading')) throw new Error('md content lost: '+rte.value.slice(0,60));
   // markdown round-trip: serialization stays markdown
   rte.value='## Heading\n\n- one\n- two with [a link](https://x.y)';
   rte.dispatchEvent(new Event('input',{bubbles:true}));
   await sleep(150);
   const src=rte.value;
   if(src.includes('<p>')||!src.includes('[a link]')) throw new Error('md round-trip broken: '+src.slice(0,80));
 });

 await phase('rich editor markdown toolbar + features', async ()=>{
   // plain 'Demo' → markdown-format editor (19 buttons, no underline/align)
   let website=rowByName('website');
   let nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   $$('.mode-btn',nameRow).find(b=>b.title==='Rich text').click();
   await sleep(700);
   website=rowByName('website');
   nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   const rte=$q('rich-text-editor',nameRow);
   if(!rte) throw new Error('rte missing');
   if(rte.getAttribute('format')!=='markdown') throw new Error('expected md format');
   const toolbar=$$('.rte-btn',rte);
   if(toolbar.length!==19) throw new Error('md toolbar size: '+toolbar.length);
   if(toolbar.some(b=>b.title.includes('Underline')||b.title.includes('Align'))) throw new Error('html-only buttons in md mode');
   if(!$q('.rte-count',rte)) throw new Error('no word count');
   const mdBtn=(title)=>{ const b=toolbar.find(x=>x.title.startsWith(title)); if(!b) throw new Error('missing btn: '+title); return b; };

   // H2 via toolbar + programmatic text
   rte.querySelector('.ProseMirror').focus();
   mdBtn('Heading 2').click(); await sleep(80);
   rte.insertText('About us');
   await sleep(120);
   if(!$q('.ProseMirror h2',rte)) throw new Error('H2 not created');

   // image via stubbed prompt → markdown serialization
   window.prompt=(msg)=>msg.includes('Alt')?'logo alt':'https://example.com/logo.png';
   mdBtn('Insert image').click(); await sleep(150);
   if(!$q('.ProseMirror img',rte)) throw new Error('image node missing');
   if(!rte.value.includes('![logo alt](https://example.com/logo.png)')) throw new Error('md image missing: '+rte.value.slice(0,120));

   // strike via toolbar → ~~
   mdBtn('Strikethrough').click(); await sleep(60);
   rte.insertText('old news');
   await sleep(120);
   if(!rte.value.includes('~~old news~~')) throw new Error('strike md missing: '+rte.value.slice(-80));
 });

 await phase('rich editor html-only features', async ()=>{
   // feed HTML through textarea → rich editor must build with html format
   let website=rowByName('website');
   let nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   $$('.mode-btn',nameRow).find(b=>b.title==='Resizable text field').click();
   await sleep(200);
   website=rowByName('website');
   nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   let ta=$q('textarea.value-input',nameRow);
   ta.value='<p>About us</p>';
   ta.dispatchEvent(new Event('input',{bubbles:true}));
   await sleep(120);
   website=rowByName('website');
   nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   $$('.mode-btn',nameRow).find(b=>b.title==='Rich text').click();
   await sleep(700);
   website=rowByName('website');
   nameRow=$$('.field-item.prop-row',$q('.prop-body',website))
     .find(r=>$q('.title-input',r)?.value==='name');
   const rte=$q('rich-text-editor',nameRow);
   if(!rte||rte.getAttribute('format')!=='html') throw new Error('html format not detected');
   const toolbar=$$('.rte-btn',rte);
   if(toolbar.length!==24) throw new Error('html toolbar size: '+toolbar.length);
   const htmlBtn=(title)=>{ const b=toolbar.find(x=>x.title.startsWith(title)); if(!b) throw new Error('missing btn: '+title); return b; };

   // underline (html only)
   rte.querySelector('.ProseMirror').focus();
   htmlBtn('Underline').click(); await sleep(60);
   rte.insertText('u-text');
   await sleep(120);
   if(!$q('.ProseMirror u',rte)) throw new Error('underline missing');
   if(!rte.value.includes('<u>u-text</u>')) throw new Error('u not serialized: '+rte.value.slice(-80));

   // alignment
   htmlBtn('Align center').click(); await sleep(80);
   if(!$q('.ProseMirror p[style*="center"], .ProseMirror [style*="text-align: center"]',rte)) throw new Error('align center failed');

   // image via stubbed prompt → <img>
   window.prompt=(msg)=>msg.includes('Alt')?'pic alt':'https://example.com/pic.jpg';
   htmlBtn('Insert image').click(); await sleep(150);
   if(!rte.value.includes('<img src="https://example.com/pic.jpg"')) throw new Error('html img missing');
 });

 paint();
})();