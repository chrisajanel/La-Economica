// ====================== Utilidades ======================
const norm = (s = "") =>
  s.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function getProductos() {
  const list = JSON.parse(localStorage.getItem("productos")) || [];
  return Array.isArray(list)
    ? list.map(p => ({
        ...p,
        // Precios tradicionales
        precioUnidad: p.precioUnidad != null ? Number(p.precioUnidad) : null,
        precioMediaDocena: p.precioMediaDocena != null ? Number(p.precioMediaDocena) : null,
        precioDocena: p.precioDocena != null ? Number(p.precioDocena) : null,
        precioFardo: p.precioFardo != null ? Number(p.precioFardo) : null,
        // Nuevos precios
        precioLibra: p.precioLibra != null ? Number(p.precioLibra) : null,
        precioArroba: p.precioArroba != null ? Number(p.precioArroba) : null,
        precioPaquete: p.precioPaquete != null ? Number(p.precioPaquete) : null,
        precioX99: p.precioX99 != null ? Number(p.precioX99) : null
      }))
    : [];
}

function findProductoByName(list, name) {
  const key = norm(name);
  return list.find(p => norm(p.nombre) === key) || null;
}

// ====================== Principal ======================
document.addEventListener("DOMContentLoaded", () => {
  // ------ Datos base ------
  const productList = getProductos();

  // ------ DOM factura ------
  const productoInput = document.getElementById("producto");
  const cantidadInput = document.getElementById("cantidad");
  const unidadSelect = document.getElementById("unidad");
  const suggestionsList = document.getElementById("suggestionss");
  const invoiceTableBody = document.getElementById("invoiceTableBody");
  const totalElement = document.getElementById("total");
  const agregarProductoBtn = document.getElementById("agregarProductoBtn");
  const errorModal = document.getElementById("errorModal");
  const closeModalBtn = document.querySelector(".close-btn");
  const imprimirProductoBtn = document.getElementById("imprimirProductoBtn");
  const limpiarBtn = document.getElementById("limpiar");

  // ------ DOM buscador rápido ------
  const searchInput = document.getElementById("searchProduct");
  const unitSelect = document.getElementById("searchProductUnit");
  const priceDisplay = document.getElementById("priceDisplay");
  const suggestionsLista = document.getElementById("suggestionsLista");

  // =============== Helpers de unidades visibles =========
  function rebuildInvoiceUnits(product) {
    const hadFocus = document.activeElement === unidadSelect;
    unidadSelect.innerHTML = "";

    const options = [];
    if (product?.precioUnidad != null) options.push({ value: "Unidad", label: "Unidad" });
    if (product?.precioMediaDocena != null) options.push({ value: "Media Docena", label: "Media Docena" });
    if (product?.precioDocena != null) options.push({ value: "Docena", label: "Docena" });
    if (product?.precioFardo != null) options.push({ value: "Fardo", label: "Fardo" });
    if (product?.precioLibra != null) options.push({ value: "Libra", label: "Libra" });
    if (product?.precioArroba != null) options.push({ value: "Arroba", label: "Arroba" });
    if (product?.precioPaquete != null) options.push({ value: "Paquete", label: "Paquete" });
    if (product?.precioX99 != null) options.push({ value: "x99", label: "x99" });

    if (!options.length) {
      const opt = document.createElement("option");
      opt.textContent = "— sin precios —";
      opt.value = "";
      unidadSelect.appendChild(opt);
      unidadSelect.disabled = true;
      agregarProductoBtn.disabled = true;
      return;
    }

    options.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      unidadSelect.appendChild(opt);
    });

    unidadSelect.disabled = false;
    agregarProductoBtn.disabled = false;
    if (hadFocus) unidadSelect.focus();
  }

  function rebuildTopUnits(product) {
    const hadFocus = document.activeElement === unitSelect;
    unitSelect.innerHTML = "";

    const options = [];
    if (product?.precioUnidad != null) options.push({ value: "unidad", label: "Unidad" });
    if (product?.precioMediaDocena != null) options.push({ value: "media-docena", label: "Media Docena" });
    if (product?.precioDocena != null) options.push({ value: "docena", label: "Docena" });
    if (product?.precioFardo != null) options.push({ value: "fardo", label: "Fardo" });
    if (product?.precioLibra != null) options.push({ value: "libra", label: "Libra" });
    if (product?.precioArroba != null) options.push({ value: "arroba", label: "Arroba" });
    if (product?.precioPaquete != null) options.push({ value: "paquete", label: "Paquete" });
    if (product?.precioX99 != null) options.push({ value: "x99", label: "x99" });

    if (!options.length) {
      const opt = document.createElement("option");
      opt.textContent = "— sin precios —";
      opt.value = "";
      unitSelect.appendChild(opt);
      unitSelect.disabled = true;
      priceDisplay.textContent = "0.00";
      return;
    }

    options.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      unitSelect.appendChild(opt);
    });

    unitSelect.disabled = false;
    if (hadFocus) unitSelect.focus();
  }

  // =============== Autocompletar (Factura) ===============
  function showSuggestionsFactura() {
    const q = norm(productoInput.value);
    suggestionsList.innerHTML = "";
    const matched = findProductoByName(productList, q);
    rebuildInvoiceUnits(matched);

    if (!q) return;

    const filtered = productList.filter(p => norm(p.nombre).includes(q));
    filtered.slice(0, 20).forEach(product => {
      const li = document.createElement("li");
      li.textContent = product.nombre;
      li.setAttribute("role", "option");
      li.addEventListener("click", () => {
        productoInput.value = product.nombre;
        suggestionsList.innerHTML = "";
        rebuildInvoiceUnits(product);
      });
      suggestionsList.appendChild(li);
    });
  }

  // =============== Agregar a factura =====================
  function precioPorUnidad(producto, unidad) {
    switch (unidad) {
      case "Unidad": return producto.precioUnidad;
      case "Media Docena": return producto.precioMediaDocena;
      case "Docena": return producto.precioDocena;
      case "Fardo": return producto.precioFardo;
      case "Libra": return producto.precioLibra;
      case "Arroba": return producto.precioArroba;
      case "Paquete": return producto.precioPaquete;
      case "x99": return producto.precioX99;
      default: return null;
    }
  }

  function addProductToInvoice() {
    const nombre = productoInput.value.trim();
    const cantidad = parseInt(cantidadInput.value, 10) || 0;
    const unidad = unidadSelect.value;
    const producto = findProductoByName(productList, nombre);

    if (!producto) {
      alert("Producto no encontrado.");
      return;
    }
    const precioUnitario = precioPorUnidad(producto, unidad);
    if (precioUnitario == null || isNaN(precioUnitario)) {
      errorModal.style.display = "block";
      return;
    }

    const subtotal = precioUnitario * cantidad;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cantidad}</td>
      <td>${unidad}</td>
      <td>${nombre}</td>
      <td>${subtotal.toFixed(2)}</td>
      <td><button class="deleteBtn" type="button">Eliminar</button></td>
    `;
    invoiceTableBody.appendChild(tr);

    updateTotal();
    saveInvoiceToLocalStorage();

    tr.querySelector(".deleteBtn").addEventListener("click", () => {
      tr.remove();
      updateTotal();
      saveInvoiceToLocalStorage();
    });
  }

  function updateTotal() {
    let total = 0;
    invoiceTableBody.querySelectorAll("tr").forEach(row => {
      total += Number(row.cells[3].textContent) || 0;
    });
    totalElement.textContent = total.toFixed(2);
  }

  function saveInvoiceToLocalStorage() {
    const items = [];
    invoiceTableBody.querySelectorAll("tr").forEach(row => {
      items.push({
        cantidad: row.cells[0].textContent,
        unidad: row.cells[1].textContent,
        nombre: row.cells[2].textContent,
        subtotal: row.cells[3].textContent
      });
    });
    localStorage.setItem("invoiceItems", JSON.stringify(items));
    localStorage.setItem("invoiceTotal", totalElement.textContent);
  }

  function loadInvoiceFromLocalStorage() {
    const items = JSON.parse(localStorage.getItem("invoiceItems")) || [];
    const total = localStorage.getItem("invoiceTotal") || "0.00";

    items.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.cantidad}</td>
        <td>${item.unidad}</td>
        <td>${item.nombre}</td>
        <td>${item.subtotal}</td>
        <td><button class="deleteBtn" type="button">Eliminar</button></td>
      `;
      invoiceTableBody.appendChild(tr);
      tr.querySelector(".deleteBtn").addEventListener("click", () => {
        tr.remove();
        updateTotal();
        saveInvoiceToLocalStorage();
      });
    });
    totalElement.textContent = total;
  }

  // =============== Imprimir =============================
  imprimirProductoBtn.addEventListener("click", () => {
    saveInvoiceToLocalStorage();

    const printWindow = window.open("fimprimir.html", "_blank");
    printWindow.onload = function () {
      const invoiceItems = JSON.parse(localStorage.getItem("invoiceItems")) || [];
      const total = localStorage.getItem("invoiceTotal") || "0.00";

      const invoiceTableBodyPrint = printWindow.document.getElementById("invoiceTableBodyPrint");
      invoiceItems.forEach(item => {
        const tr = printWindow.document.createElement("tr");
        tr.innerHTML = `
          <td>${item.cantidad}</td>
          <td>${item.unidad}</td>
          <td>${item.nombre}</td>
          <td>${item.subtotal}</td>
        `;
        invoiceTableBodyPrint.appendChild(tr);
      });

      printWindow.document.getElementById("totalPrint").innerText = total;
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  });

  // =============== Limpiar ==============================
  limpiarBtn.addEventListener("click", () => {
    [...document.querySelectorAll(".deleteBtn")].forEach(b => b.click());
    localStorage.removeItem("invoiceItems");
    localStorage.removeItem("invoiceTotal");

    document.getElementById("cashInput").value = "";
    document.getElementById("change").textContent = "0.00";
    localStorage.removeItem("efectivo");
    localStorage.removeItem("cambio");

    document.getElementById("nombreCliente").value = "";
    document.getElementById("direccion").value = "";
    localStorage.removeItem("nombreCliente");
    localStorage.removeItem("direccion");

    totalElement.textContent = "0.00";
    alert("Se limpió la factura y los datos guardados.");
  });

  // =============== Modal ================================
  closeModalBtn.addEventListener("click", () => (errorModal.style.display = "none"));
  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete-container") && !e.target.closest("#suggestionss")) {
      suggestionsList.innerHTML = "";
    }
  });

  // =============== Cantidad por Unidad ==================
  document.getElementById("unidad").addEventListener("change", function () {
    // Mantengo tu lógica original para 'Unidad'
    cantidadInput.value = this.value === "Unidad" ? 3 : 1;
  });

  // =============== Cambio ===============================
  document.getElementById("calcularCambioBtn").addEventListener("click", () => {
    const total = Number(totalElement.textContent) || 0;
    const cash = Number(document.getElementById("cashInput").value);

    if (isNaN(cash)) {
      alert("Por favor, ingresa un valor numérico válido.");
      return;
    }
    if (cash < total) {
      alert("El efectivo es insuficiente para cubrir el total.");
      return;
    }
    const change = cash - total;
    document.getElementById("change").textContent = change.toFixed(2);
    localStorage.setItem("efectivo", cash.toFixed(2));
    localStorage.setItem("cambio", change.toFixed(2));
  });

  // =============== Datos del cliente ====================
  function saveClientData() {
    localStorage.setItem("nombreCliente", document.getElementById("nombreCliente").value || "");
    localStorage.setItem("direccion", document.getElementById("direccion").value || "");
  }
  function loadClientData() {
    const nombre = localStorage.getItem("nombreCliente");
    const dir = localStorage.getItem("direccion");
    if (nombre) document.getElementById("nombreCliente").value = nombre;
    if (dir) document.getElementById("direccion").value = dir;
  }
  imprimirProductoBtn.addEventListener("click", saveClientData);
  loadClientData();

  // =============== Búsqueda rápida (arriba) =============
  function updatePriceDisplay(product) {
    const unit = unitSelect.value;
    let price = 0;
    if (unit === "unidad") price = Number(product?.precioUnidad) || 0;
    else if (unit === "media-docena") price = Number(product?.precioMediaDocena) || 0;
    else if (unit === "docena") price = Number(product?.precioDocena) || 0;
    else if (unit === "fardo") price = Number(product?.precioFardo) || 0;
    else if (unit === "libra") price = Number(product?.precioLibra) || 0;
    else if (unit === "arroba") price = Number(product?.precioArroba) || 0;
    else if (unit === "paquete") price = Number(product?.precioPaquete) || 0;
    else if (unit === "x99") price = Number(product?.precioX99) || 0;
    priceDisplay.textContent = price.toFixed(2);
  }

  function showSuggestionsTop(filtered) {
    suggestionsLista.innerHTML = "";
    filtered.slice(0, 20).forEach(product => {
      const li = document.createElement("li");
      li.textContent = product.nombre;
      li.setAttribute("role", "option");
      li.addEventListener("click", () => {
        searchInput.value = product.nombre;
        rebuildTopUnits(product);
        updatePriceDisplay(product);
        suggestionsLista.innerHTML = "";
      });
      suggestionsLista.appendChild(li);
    });
  }

  function filterProductsTop() {
    const q = norm(searchInput.value);
    const filtered = productList.filter(p => norm(p.nombre).includes(q));
    showSuggestionsTop(filtered);

    const matched = findProductoByName(productList, q);
    rebuildTopUnits(matched);
    if (matched) updatePriceDisplay(matched);
    else priceDisplay.textContent = "0.00";
  }

  searchInput.addEventListener("input", filterProductsTop);
  unitSelect.addEventListener("change", () => {
    const matched = findProductoByName(productList, searchInput.value);
    if (matched) updatePriceDisplay(matched);
  });

  // =============== Listeners finales ====================
  productoInput.addEventListener("input", showSuggestionsFactura);
  agregarProductoBtn.addEventListener("click", addProductToInvoice);

  // Carga inicial de la factura guardada
  loadInvoiceFromLocalStorage();
});
