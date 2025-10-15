// /js/popup-loader.js
(function(){
  const dlg = document.getElementById('appDialog');
  const body = dlg.querySelector('[data-modal-body]');

  async function fetchPartial(path){
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error(`Failed to load ${path}`);
    return res.text();
  }

  window.openPopup = async function(name, opts = {}) {
    body.innerHTML = await fetchPartial(`/popups/${name}.html`);
    dlg.showModal();

    // close handlers (X & Cancel)
    body.querySelectorAll('[data-close]').forEach(el=>{
      el.addEventListener('click', (e)=>{ e.preventDefault(); cleanup(null); }, {once:true});
    });

    // init controller if provided
    const controller = window.PopupControllers?.[name];
    return new Promise((resolve)=>{
      function cleanup(value){
        dlg.close();
        body.innerHTML = '';
        resolve(value ?? null);
      }

      dlg.addEventListener('cancel', (e)=>{ e.preventDefault(); cleanup(null); }, {once:true});
      controller?.(dlg, opts, cleanup);
    });
  };
})();
