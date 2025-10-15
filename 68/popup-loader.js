// /js/popup-loader.js
(function(){
  const dlg = document.getElementById('appDialog');
  const body = dlg ? dlg.querySelector('[data-modal-body]') : null;

  async function fetchPartial(path){
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error(`Failed to load ${path}`);
    return res.text();
  }

  window.openPopup = async function(name, opts = {}) {
    if (!dlg || !body) return null;
    body.innerHTML = await fetchPartial(`/popups/${name}.html`);
    dlg.showModal();

    // init controller if provided
    const controller = window.PopupControllers?.[name];

    return new Promise((resolve)=>{
      function cleanup(value){
        try{ dlg.close(); }catch(e){ void e; }
        try{ body.innerHTML = ''; }catch(e){ void e; }
        resolve(value ?? null);
      }

      // close handlers (X & Cancel)
      body.querySelectorAll('[data-close]').forEach(el=>{
        el.addEventListener('click', (e)=>{ e.preventDefault(); cleanup(null); }, {once:true});
      });

      dlg.addEventListener('cancel', (e)=>{ e.preventDefault(); cleanup(null); }, {once:true});
      controller?.(dlg, opts, cleanup);
    });
  };
})();
