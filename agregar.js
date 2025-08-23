document.addEventListener('DOMContentLoaded', () => {
  // Inputs del formulario
  const nombreInput = document.getElementById('nombre');
  const proveedorInput = document.getElementById('proveedor');
  const precioFacturadoInput = document.getElementById('precioFacturado');
  const precioUnidadInput = document.getElementById('precioUnidad');
  const precioMediaDocenaInput = document.getElementById('precioMediaDocena');
  const precioDocenaInput = document.getElementById('precioDocena');
  const precioFardoInput = document.getElementById('precioFardo');

  // Toggles
  const chkUnidad = document.getElementById('habilitarPrecioUnidad');
  const chkMedia  = document.getElementById('habilitarPrecioMediaDocena');
  const chkDocena = document.getElementById('habilitarPrecioDocena');
  const chkFardo  = document.getElementById('habilitarPrecioFardo');

  // Botones/controles
  const agregarProductoBtn = document.getElementById('agregarProductoBtn');
  const productList        = document.getElementById('productList');
  const successModal       = document.getElementById('successModal');
  const closeModalBtn      = successModal.querySelector('.close');

  // Import CSV
  const csvFileInput = document.getElementById('csvFileInput');
  const importCsvBtn = document.getElementById('importCsvBtn');
  const importStatus = document.getElementById('importStatus');

  // Controles de paginación / filtros
  const searchBox   = document.getElementById('searchBox');
  const batchFilter = document.getElementById('batchFilter');
  const pageSizeSel = document.getElementById('pageSize');
  const firstBtn    = document.getElementById('firstPage');
  const prevBtn     = document.getElementById('prevPage');
  const nextBtn     = document.getElementById('nextPage');
  const lastBtn     = document.getElementById('lastPage');
  const pageInfo    = document.getElementById('pageInfo');
  const countInfo   = document.getElementById('countInfo');

  // NUEVO: botón borrar todo
  const wipeBtn     = document.getElementById('wipeProducts');

  // Estado
  let productListData = JSON.parse(localStorage.getItem('productos')) || [];
  let page = 1;
  let pageSize = Number(pageSizeSel.value) || 200;

  // ---------- Utilidades ----------
  const toNumber = (v) => {
    if (v === null || v === undefined) return null;
    const clean = String(v)
      .replace(/[Qq\s]/g, '')
      .replace(/,/g, '')
      .replace(/[^\d.\-]/g, '');
    const n = parseFloat(clean);
    return Number.isFinite(n) ? n : null;
  };

  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Mapeo flexible de encabezados -> claves internas
  const HEADER_ALIASES = {
    producto: ['producto', 'productos', 'nombre', 'nombre del producto'],
    proveedor: ['proveedor', 'proveedores', 'provedor', 'provedores', 'proevedores', 'probedores'],
    facturado: ['facturado', 'facturado a , 99', 'facturado a', 'facturado total'],
    facturado_x_uni: ['facturado x uni', 'factutado x uni', 'facturado por unidad', 'facturado unidad', 'factutado por uni'],
    precio_unidad: ['precio por u', 'precio u', 'pre. venta x libra', 'precio venta x libra', 'precio unidad'],
    precio_media_docena: ['precio 1/2 d', 'precio media docena', '1/2 docena', 'media docena'],
    precio_docena: ['precio por d', 'precio docena', 'docena', 'precio x docena'],
    precio_fardo: ['precio por f', 'fardo', 'precio fardo', 'precio por paquete', 'pcio.x paquete'],

    // Nuevas unidades opcionales
    precio_libra:   ['precio por libra', 'pre. venta x libra', 'precio libra'],
    precio_arroba:  ['precio por aroba', 'precio por arroba', 'pre.venta x aroba', 'pre. venta x aroba'],
    precio_paquete: ['precio por paquete', 'pcio.x paquete', 'precio paquete'],
    precio_x99:     ['precio por 99', 'precio x 99', 'x99', 'precio por 99u']
  };

  function buildHeaderIndex(headerRow) {
    const indices = {};
    const missing = [];
    const headersNorm = headerRow.map(h => normalize(h));

    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      let idx = -1;
      for (const alias of aliases) {
        const target = normalize(alias);
        idx = headersNorm.findIndex(h => h === target);
        if (idx !== -1) break;
      }
      if (idx === -1) {
        const required = ['producto', 'proveedor', 'facturado'];
        if (required.includes(key)) missing.push(key);
      } else {
        indices[key] = idx;
      }
    }
    if (missing.length) {
      throw new Error('Faltan columnas en el CSV: ' + missing.join(', '));
    }
    return indices;
  }

  // Parser CSV simple que soporta comillas
  function parseCSV(text) {
    const rows = [];
    let row = [], cur = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], next = text[i + 1];
      if (c === '"' && inQuotes && next === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = !inQuotes; }
      else if (c === ',' && !inQuotes) { row.push(cur); cur = ''; }
      else if ((c === '\n' || c === '\r') && !inQuotes) {
        if (cur.length || row.length) { row.push(cur); rows.push(row); }
        if (c === '\r' && next === '\n') i++;
        row = []; cur = '';
      } else { cur += c; }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function csvToProducts(csvText) {
    const rows = parseCSV(csvText);
    if (!rows.length) return [];
    const header = rows[0];
    const idx = buildHeaderIndex(header);

    const products = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      if (!cells.length || cells.every(v => !String(v).trim())) continue;

      const nombre = (cells[idx.producto] || '').trim();
      const proveedor = (idx.proveedor !== undefined ? cells[idx.proveedor] : '').trim();
      if (!nombre) continue;

      const p = {
        id: Date.now().toString() + '_' + r,
        nombre,
        proveedor,
        precioFacturado   : toNumber(idx.facturado      !== undefined ? cells[idx.facturado]      : null),
        precioUnidad      : toNumber(idx.precio_unidad  !== undefined ? cells[idx.precio_unidad]  : null),
        precioMediaDocena : toNumber(idx.precio_media_docena !== undefined ? cells[idx.precio_media_docena] : null),
        precioDocena      : toNumber(idx.precio_docena  !== undefined ? cells[idx.precio_docena]  : null),
        precioFardo       : toNumber(idx.precio_fardo   !== undefined ? cells[idx.precio_fardo]   : null),
        facturadoPorUnidad: toNumber(idx.facturado_x_uni !== undefined ? cells[idx.facturado_x_uni] : null),

        // nuevas opcionales
        precioLibra   : toNumber(idx.precio_libra   !== undefined ? cells[idx.precio_libra]   : null),
        precioArroba  : toNumber(idx.precio_arroba  !== undefined ? cells[idx.precio_arroba]  : null),
        precioPaquete : toNumber(idx.precio_paquete !== undefined ? cells[idx.precio_paquete] : null),
        precioX99     : toNumber(idx.precio_x99     !== undefined ? cells[idx.precio_x99]     : null)
      };
      products.push(p);
    }
    return products;
  }

  function toggleInput(id, isEnabled) {
    const el = document.getElementById(id);
    el.disabled = !isEnabled;
  }
  function updateInputStates() {
    toggleInput('precioUnidad', chkUnidad.checked);
    toggleInput('precioMediaDocena', chkMedia.checked);
    toggleInput('precioDocena', chkDocena.checked);
    toggleInput('precioFardo', chkFardo.checked);
  }

  // ---------- Paginación / filtros ----------
  function ensureBatches() {
    productListData.forEach(p => {
      if (!p.batchId) {
        p.batchId = 'legacy';
        p.batchName = 'Sin origen';
      }
    });
  }

  function rebuildBatchFilter() {
    ensureBatches();
    const map = new Map();
    productListData.forEach(p => {
      const id = p.batchId;
      const name = p.batchName;
      const prev = map.get(id);
      map.set(id, { id, name, count: (prev?.count || 0) + 1 });
    });
    const options = ['<option value="">Todos los lotes</option>']
      .concat(
        [...map.values()]
          .sort((a,b)=>a.name.localeCompare(b.name,'es'))
          .map(b => `<option value="${b.id}">${b.name} (${b.count})</option>`)
      )
      .join('');
    batchFilter.innerHTML = options;
  }

  function getFilteredData() {
    const q = normalize(searchBox.value);
    const lote = batchFilter.value; // batchId
    let arr = productListData;
    if (lote) arr = arr.filter(p => (p.batchId || 'legacy') === lote);
    if (q) arr = arr.filter(p => normalize(p.nombre).includes(q) || normalize(p.proveedor||'').includes(q));
    return arr;
  }

  function renderList(resetPage = false) {
    const data = getFilteredData();
    const total = data.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (resetPage) page = 1;
    if (page > pages) page = pages;

    const start = (page - 1) * pageSize;
    const slice = data.slice(start, start + pageSize);

    productList.innerHTML = '';
    slice.forEach(p => addProductRow(p));

    pageInfo.textContent = `Página ${page} / ${pages}`;
    countInfo.textContent = `Mostrando ${slice.length} de ${total} (total inventario: ${productListData.length})`;
    firstBtn.disabled = prevBtn.disabled = (page <= 1);
    nextBtn.disabled  = lastBtn.disabled = (page >= pages);
  }

  // ---------- Lista (filas con acciones) ----------
  function addProductRow(producto) {
    const li = document.createElement('li');
    li.className = 'product-item';
    li.dataset.id = producto.id;

    li.innerHTML = `
      <input type="text" class="product-name" value="${producto.nombre}" readonly aria-label="Nombre">
      <input type="text" class="product-provider" value="${producto.proveedor || ''}" readonly aria-label="Proveedor">
      <input type="text" class="product-facturado" value="${producto.precioFacturado ?? ''}" readonly aria-label="Precio facturado">
      <input type="text" class="product-unidad" value="${producto.precioUnidad ?? ''}" readonly aria-label="Precio unidad">
      <input type="text" class="product-media-docena" value="${producto.precioMediaDocena ?? ''}" readonly aria-label="Precio media docena">
      <input type="text" class="product-docena" value="${producto.precioDocena ?? ''}" readonly aria-label="Precio docena">
      <input type="text" class="product-fardo" value="${producto.precioFardo ?? ''}" readonly aria-label="Precio fardo">
      <label class="sr-only" for="del-${producto.id}">Activar eliminación</label>
      <input id="del-${producto.id}" type="checkbox" class="enable-delete-checkbox" style="display:none;">
      <button class="edit-btn" type="button">Editar</button>
      <button class="save-btn" type="button" style="display:none;">Guardar</button>
      <button class="delete-btn" type="button" style="display:none;">Eliminar</button>
    `;
    productList.appendChild(li);

    // Editar
    li.querySelector('.edit-btn').addEventListener('click', () => {
      li.querySelectorAll('input').forEach(input => {
        if (!input.classList.contains('product-name') && !input.classList.contains('product-provider')) {
          input.readOnly = false;
        }
      });
      li.querySelector('.edit-btn').style.display = 'none';
      li.querySelector('.save-btn').style.display = 'inline';
      const deleteCheckbox = li.querySelector('.enable-delete-checkbox');
      deleteCheckbox.style.display = 'inline';
      li.querySelector('.delete-btn').style.display = 'none';
    });

    // Guardar
    li.querySelector('.save-btn').addEventListener('click', () => {
      li.querySelectorAll('input').forEach(input => (input.readOnly = true));
      li.querySelector('.edit-btn').style.display = 'inline';
      li.querySelector('.save-btn').style.display = 'none';
      li.querySelector('.enable-delete-checkbox').style.display = 'none';
      li.querySelector('.delete-btn').style.display = 'none';
      updateProductInLocalStorage(li);
    });

    // Eliminar
    li.querySelector('.delete-btn').addEventListener('click', () => deleteProductFromList(li));

    // Toggle del botón Eliminar
    const deleteCheckbox = li.querySelector('.enable-delete-checkbox');
    deleteCheckbox.addEventListener('change', function () {
      li.querySelector('.delete-btn').style.display = this.checked ? 'inline' : 'none';
    });
  }

  function updateProductInLocalStorage(li) {
    const id = li.dataset.id;
    const ix = productListData.findIndex(p => p.id === id);
    if (ix === -1) return;

    productListData[ix] = {
      ...productListData[ix],
      nombre         : li.querySelector('.product-name').value,
      proveedor      : li.querySelector('.product-provider').value,
      precioFacturado: toNumber(li.querySelector('.product-facturado').value),
      precioUnidad   : toNumber(li.querySelector('.product-unidad').value),
      precioMediaDocena: toNumber(li.querySelector('.product-media-docena').value),
      precioDocena   : toNumber(li.querySelector('.product-docena').value),
      precioFardo    : toNumber(li.querySelector('.product-fardo').value)
    };
    localStorage.setItem('productos', JSON.stringify(productListData));
  }

  function deleteProductFromList(li) {
    const id = li.dataset.id;
    productListData = productListData.filter(p => p.id !== id);
    localStorage.setItem('productos', JSON.stringify(productListData));
    rebuildBatchFilter();
    renderList();
  }

  function showSuccessModal(msg = 'Producto guardado con éxito.') {
    successModal.querySelector('#ok-desc').textContent = msg;
    successModal.style.display = 'block';
  }
  closeModalBtn.addEventListener('click', () => (successModal.style.display = 'none'));
  window.addEventListener('click', (e) => { if (e.target === successModal) successModal.style.display = 'none'; });

  // ---------- Alta manual ----------
  agregarProductoBtn.addEventListener('click', () => {
    const nombre = nombreInput.value.trim();
    const proveedor = proveedorInput.value.trim();
    const precioFacturado = toNumber(precioFacturadoInput.value);
    const precioUnidad      = chkUnidad.checked ? toNumber(precioUnidadInput.value) : null;
    const precioMediaDocena = chkMedia.checked  ? toNumber(precioMediaDocenaInput.value) : null;
    const precioDocena      = chkDocena.checked ? toNumber(precioDocenaInput.value) : null;
    const precioFardo       = chkFardo.checked  ? toNumber(precioFardoInput.value) : null;

    if (!nombre || !proveedor || precioFacturado === null ||
        (chkUnidad.checked && precioUnidad === null) ||
        (chkMedia.checked && precioMediaDocena === null) ||
        (chkDocena.checked && precioDocena === null) ||
        (chkFardo.checked && precioFardo === null)) {
      alert('Por favor, complete todos los campos correctamente.');
      return;
    }

    const now = new Date();
    const producto = {
      id: Date.now().toString(),
      nombre, proveedor,
      precioFacturado, precioUnidad, precioMediaDocena, precioDocena, precioFardo,
      batchId: 'manual-' + now.toISOString().slice(0,10),
      batchName: 'Manual ' + now.toLocaleDateString('es')
    };

    productListData.push(producto);
    localStorage.setItem('productos', JSON.stringify(productListData));
    rebuildBatchFilter();
    renderList(true);
    showSuccessModal();
  });

  // ---------- Importación CSV ----------
  importCsvBtn.addEventListener('click', () => {
    const file = csvFileInput.files && csvFileInput.files[0];
    if (!file) { alert('Selecciona un archivo CSV primero.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        const items = csvToProducts(text);
        if (!items.length) { alert('El CSV no contiene filas válidas.'); return; }

        const now = Date.now();
        const batchId = 'csv-' + now;
        const batchName = 'CSV: ' + (file.name || ('lote ' + now));
        items.forEach(p => { p.batchId = batchId; p.batchName = batchName; });

        let nuevos = 0;
        items.forEach(p => {
          const existing = productListData.find(x => normalize(x.nombre) === normalize(p.nombre));
          if (existing) {
            existing.proveedor = p.proveedor || existing.proveedor;
            if (p.precioFacturado   !== null) existing.precioFacturado   = p.precioFacturado;
            if (p.precioUnidad      !== null) existing.precioUnidad      = p.precioUnidad;
            if (p.precioMediaDocena !== null) existing.precioMediaDocena = p.precioMediaDocena;
            if (p.precioDocena      !== null) existing.precioDocena      = p.precioDocena;
            if (p.precioFardo       !== null) existing.precioFardo       = p.precioFardo;
            if (p.precioLibra       !== null) existing.precioLibra       = p.precioLibra;
            if (p.precioArroba      !== null) existing.precioArroba      = p.precioArroba;
            if (p.precioPaquete     !== null) existing.precioPaquete     = p.precioPaquete;
            if (p.precioX99         !== null) existing.precioX99         = p.precioX99;
          } else {
            productListData.push(p);
            nuevos++;
          }
        });

        localStorage.setItem('productos', JSON.stringify(productListData));
        rebuildBatchFilter();
        importStatus.textContent = `Importados ${items.length} (nuevos: ${nuevos}).`;
        showSuccessModal(`Importación exitosa: ${items.length} productos (nuevos: ${nuevos}).`);
        renderList(true);
      } catch (err) {
        alert(err.message || 'Error procesando el CSV.');
      }
    };
    reader.onerror = () => alert('No se pudo leer el archivo.');
    reader.readAsText(file, 'utf-8');
  });

  // ---------- Borrar todos los productos ----------
  wipeBtn.addEventListener('click', () => {
    const n = productListData.length;
    if (!n) { alert('No hay productos que borrar.'); return; }

    const yes = confirm(`Esto eliminará ${n} productos del localStorage y no se podrá deshacer.\n\n¿Deseas continuar?`);
    if (!yes) return;

    localStorage.removeItem('productos');
    productListData = [];
    rebuildBatchFilter();
    renderList(true);
    importStatus.textContent = '';
    showSuccessModal('Se eliminaron todos los productos guardados.');
  });

  // ---------- Eventos de filtros / paginación ----------
  searchBox.addEventListener('input', () => renderList(true));
  batchFilter.addEventListener('change', () => renderList(true));
  pageSizeSel.addEventListener('change', () => { pageSize = Number(pageSizeSel.value)||200; renderList(true); });
  firstBtn.addEventListener('click', () => { page = 1; renderList(); });
  prevBtn .addEventListener('click', () => { page = Math.max(1, page-1); renderList(); });
  nextBtn .addEventListener('click', () => { page = page+1; renderList(); });
  lastBtn .addEventListener('click', () => {
    const total = getFilteredData().length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    page = pages;
    renderList();
  });

  // Init
  updateInputStates();
  rebuildBatchFilter();
  renderList(true);

  chkUnidad.addEventListener('change', updateInputStates);
  chkMedia .addEventListener('change', updateInputStates);
  chkDocena.addEventListener('change', updateInputStates);
  chkFardo .addEventListener('change', updateInputStates);
});
