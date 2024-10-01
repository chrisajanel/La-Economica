
document.addEventListener('DOMContentLoaded', function() {
    const productList = JSON.parse(localStorage.getItem('productos')) || [];
    const productoInput = document.getElementById('producto');
    const cantidadInput = document.getElementById('cantidad');
    const unidadSelect = document.getElementById('unidad');
    const suggestionsList = document.getElementById('suggestionss');
    const invoiceTableBody = document.getElementById('invoiceTableBody');
    const totalElement = document.getElementById('total');
    const agregarProductoBtn = document.getElementById('agregarProductoBtn');
    const errorModal = document.getElementById('errorModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const imprimirProductoBtn = document.getElementById('imprimirProductoBtn'); 
   

  

    


    // Cargar productos desde localStorage
    loadInvoiceFromLocalStorage();

    function showSuggestionsS() {
        const input = searchProductInput.value.toLowerCase();
        suggestionsList.innerHTML = '';

        if (input === '') return;

        const filteredProducts = productList.filter(product => 
            product.nombre.toLowerCase().includes(input)
        );

        filteredProducts.forEach(product => {
            const li = document.createElement('li');
            li.textContent = product.nombre;
            li.addEventListener('click', () => {
                searchProductUnitSelect.value = product.nombre;
                suggestionsList.innerHTML = '';
            });
            suggestionsList.appendChild(li);
        });
    }

    function showSuggestions() {
        const input = productoInput.value.toLowerCase();
        suggestionsList.innerHTML = '';

        if (input === '') return;

        const filteredProducts = productList.filter(product => 
            product.nombre.toLowerCase().includes(input)
        );

        filteredProducts.forEach(product => {
            const li = document.createElement('li');
            li.textContent = product.nombre;
            li.addEventListener('click', () => {
                productoInput.value = product.nombre;
                suggestionsList.innerHTML = '';
            });
            suggestionsList.appendChild(li);
        });
    }

    function addProductToInvoice() {
        const nombre = productoInput.value;
        const cantidad = parseInt(cantidadInput.value);
        const unidad = unidadSelect.value;
        const producto = productList.find(p => p.nombre === nombre);

        if (!producto) {
            alert('Producto no encontrado.');
            return;
        }

        let precioUnitario;
        switch (unidad) {
            case 'Unidad':
                precioUnitario = producto.precioUnidad;
                break;
            case 'Media Docena':
                precioUnitario = producto.precioMediaDocena;
                break;
            case 'Docena':
                precioUnitario = producto.precioDocena;
                break;
            case 'Fardo':
                precioUnitario = producto.precioFardo;
                break;
            default:
                precioUnitario = null;
        }

        if (precioUnitario == null || isNaN(precioUnitario)) {
            errorModal.style.display = 'block';
            return;
        }

        const subtotal = precioUnitario * cantidad;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cantidad}</td>
            <td>${unidad}</td>
            <td>${nombre}</td>
            <td>${subtotal.toFixed(2)}</td>
            <td><button class="deleteBtn">Eliminar</button></td>
        `;
        invoiceTableBody.appendChild(tr);

        updateTotal();

        // Guardar los productos en localStorage
        saveInvoiceToLocalStorage();

        tr.querySelector('.deleteBtn').addEventListener('click', function() {
            tr.remove();
            updateTotal();
            saveInvoiceToLocalStorage();
        });
    }

    function updateTotal() {
        let total = 0;
        document.querySelectorAll('#invoiceTableBody tr').forEach(row => {
            const subtotal = parseFloat(row.cells[3].innerText);
            total += subtotal;
        });
        totalElement.innerText = total.toFixed(2);
    }

    function saveInvoiceToLocalStorage() {
        const invoiceItems = [];
        document.querySelectorAll('#invoiceTableBody tr').forEach(row => {
            const cantidad = row.cells[0].innerText;
            const unidad = row.cells[1].innerText;
            const nombre = row.cells[2].innerText;
            const subtotal = row.cells[3].innerText;
            invoiceItems.push({ cantidad, unidad, nombre, subtotal });
        });
        const total = totalElement.innerText;

        localStorage.setItem('invoiceItems', JSON.stringify(invoiceItems));
        localStorage.setItem('invoiceTotal', total);
    }

    function loadInvoiceFromLocalStorage() {
        const invoiceItems = JSON.parse(localStorage.getItem('invoiceItems')) || [];
        const total = localStorage.getItem('invoiceTotal') || '0.00';

        invoiceItems.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.cantidad}</td>
                <td>${item.unidad}</td>
                <td>${item.nombre}</td>
                <td>${item.subtotal}</td>
                <td><button class="deleteBtn">Eliminar</button></td>
            `;
            invoiceTableBody.appendChild(tr);

            tr.querySelector('.deleteBtn').addEventListener('click', function() {
                tr.remove();
                updateTotal();
                saveInvoiceToLocalStorage();
            });
        });

        totalElement.innerText = total;
    }

    // Función para imprimir la factura
    imprimirProductoBtn.addEventListener('click', function() {
        const printWindow = window.open('fimprimir.html', '_blank');
    
        printWindow.onload = function() {
            // Esperar a que la ventana de impresión se cargue
            const invoiceItems = JSON.parse(localStorage.getItem('invoiceItems')) || [];
            const total = localStorage.getItem('invoiceTotal') || '0.00';
    
            // Llenar los datos de la factura en el documento de impresión
            const invoiceTableBodyPrint = printWindow.document.getElementById('invoiceTableBodyPrint');
    
            invoiceItems.forEach(item => {
                const tr = printWindow.document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.cantidad}</td>
                    <td>${item.unidad}</td>
                    <td>${item.nombre}</td>
                    <td>${item.subtotal}</td>
                `;
                invoiceTableBodyPrint.appendChild(tr);
            });
    
            // Actualizar total
            printWindow.document.getElementById('totalPrint').innerText = total;
    
            // Esperar un breve momento para asegurarse de que todo se haya renderizado
            setTimeout(() => {
                printWindow.print();
                printWindow.close(); // Cerrar la ventana después de imprimir
            }, 500); // Ajusta el tiempo si es necesario
        };
    });
    
    




    productoInput.addEventListener('input', showSuggestions);
    agregarProductoBtn.addEventListener('click', addProductToInvoice);
    closeModalBtn.addEventListener('click', () => {
        errorModal.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container') && !e.target.closest('#suggestions')) {
            suggestionsList.innerHTML = '';
        }
    });
    
});

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchProduct');
    const unitSelect = document.getElementById('searchProductUnit');
    const priceDisplay = document.getElementById('priceDisplay');
    const suggestionsLista = document.getElementById('suggestionsLista');

   
    // Función para cargar los productos desde localStorage
    function loadProducts() {
        return JSON.parse(localStorage.getItem('productos')) || [];
    }

    //para busqueda 
    // Función para mostrar las sugerencias de productos
    function showSuggestions(filteredProducts) {
        suggestionsLista.innerHTML = ''; // Limpiar la lista de sugerencias

        filteredProducts.forEach(product => {
            const li = document.createElement('li');
            li.textContent = product.nombre; // Mostrar el nombre del producto
            li.addEventListener('click', () => {
                searchInput.value = product.nombre; // Al seleccionar, llenar el campo de búsqueda
                updatePriceDisplay(product); // Actualizar el precio al seleccionar el producto
                suggestionsLista.innerHTML = ''; // Limpiar las sugerencias
            });
            suggestionsLista.appendChild(li);
        });
    }

    // Función para filtrar productos
    function filterProducts() {
        const products = loadProducts();
        const searchValue = searchInput.value.toLowerCase();
        const selectedUnit = unitSelect.value;

        const filteredProducts = products.filter(product => 
            product.nombre.toLowerCase().includes(searchValue)
        );

        showSuggestions(filteredProducts);

        // Actualizar el precio según la unidad seleccionada
        if (searchValue) {
            const matchedProduct = filteredProducts.find(product => product.nombre.toLowerCase() === searchValue);
            if (matchedProduct) {
                updatePriceDisplay(matchedProduct);
            } else {
                priceDisplay.textContent = '0.00'; // Si no hay coincidencias, mostrar 0
            }
        } else {
            priceDisplay.textContent = '0.00'; // Si el campo de búsqueda está vacío, mostrar 0
        }
    }

    // Función para actualizar el precio según la unidad seleccionada
    // Función para actualizar el precio según la unidad seleccionada
function updatePriceDisplay(product) {
    const selectedUnit = unitSelect.value;

    switch (selectedUnit) {
        case 'unidad':
            priceDisplay.textContent = (Number(product.precioUnidad) || 0).toFixed(2);
            break;
        case 'media-docena':
            priceDisplay.textContent = (Number(product.precioMediaDocena) || 0).toFixed(2);
            break;
        case 'docena':
            priceDisplay.textContent = (Number(product.precioDocena) || 0).toFixed(2);
            break;
        case 'fardo':
            priceDisplay.textContent = (Number(product.precioFardo) || 0).toFixed(2);
            break;
        default:
            priceDisplay.textContent = '0.00';
            break;
    }
}


    // Event listeners
    searchInput.addEventListener('input', filterProducts);
    unitSelect.addEventListener('change', () => {
        const searchValue = searchInput.value.toLowerCase();
        const products = loadProducts();
        const matchedProduct = products.find(product => product.nombre.toLowerCase() === searchValue);
        if (matchedProduct) {
            updatePriceDisplay(matchedProduct); // Actualiza el precio cuando cambia la unidad
        }
    });

});

document.getElementById('limpiar').addEventListener('click', function() {
    // Obtener todos los botones de eliminar
    const deleteButtons = document.querySelectorAll('.deleteBtn');
    
    // Hacer clic en cada botón de eliminar
    deleteButtons.forEach(button => {
        button.click();  // Simula el clic en cada botón de eliminación
    });

    // Limpiar el localStorage
    localStorage.removeItem('invoiceItems');
    localStorage.removeItem('invoiceTotal');

    // Asegurar que el total sea 0
    
});




document.addEventListener('DOMContentLoaded', function () {
    // Cargar datos guardados del cliente al cargar la página
    loadClientData();

    const imprimirProductoBtn = document.getElementById('imprimirProductoBtn');
    
    imprimirProductoBtn.addEventListener('click', function() {
        // Guardar los datos del cliente cuando se agrega un producto
        saveClientData();
        // Aquí puedes agregar más lógica para agregar productos a la factura
    });

    // Evento para limpiar datos
    const limpiarBtn = document.getElementById('limpiar');
    limpiarBtn.addEventListener('click', function() {
        clearClientData();
    });

    function saveClientData() {
        const nombreCliente = document.getElementById('nombreCliente').value;
        const direccion = document.getElementById('direccion').value;
        
        // Guardar en localStorage
        localStorage.setItem('nombreCliente', nombreCliente);
        localStorage.setItem('direccion', direccion);
    }

    function loadClientData() {
        const nombreCliente = localStorage.getItem('nombreCliente');
        const direccion = localStorage.getItem('direccion');

        if (nombreCliente) {
            document.getElementById('nombreCliente').value = nombreCliente;
        }
        if (direccion) {
            document.getElementById('direccion').value = direccion;
        }
    }

    function clearClientData() {
        // Limpiar localStorage
        localStorage.removeItem('nombreCliente');
        localStorage.removeItem('direccion');

        // Limpiar los campos de entrada
        document.getElementById('nombreCliente').value = '';
        document.getElementById('direccion').value = '';
    // Limpiar la tabla de facturación
    document.getElementById('invoiceTableBody').innerHTML = '';

    // Reiniciar el total
    document.getElementById('total').textContent = '0.00';

    // Limpiar el valor del efectivo y cambio
    document.getElementById('cashInput').value = '';
    document.getElementById('change').textContent = '0.00';

    // Eliminar los valores guardados en localStorage para efectivo y cambio
    localStorage.removeItem('efectivo');
    localStorage.removeItem('cambio');

    // Opcional: muestra un mensaje o realiza alguna acción adicional
    alert("Los datos del cliente, factura, efectivo y cambio han sido limpiados.");
    }
});

document.getElementById('unidad').addEventListener('change', function() {
    const cantidadInput = document.getElementById('cantidad');
    const selectedValue = this.value;

    if (selectedValue === 'Unidad') {
        cantidadInput.value = 3; // Asigna el valor 3 cuando se selecciona 'Unidad'
    } else {
        cantidadInput.value = 1; // Puedes ajustar esto según sea necesario
    }
});

// Función para calcular el cambio
// Función para calcular el cambio
document.getElementById('calcularCambioBtn').addEventListener('click', function() {
    const totalElement = document.getElementById('total');
    const cashInput = document.getElementById('cashInput');
    const changeElement = document.getElementById('change');
    
    // Obtiene el valor del total y el efectivo ingresado
    const total = parseFloat(totalElement.textContent);
    const cash = parseFloat(cashInput.value);
    
    // Verifica que el efectivo sea un número válido y mayor o igual al total
    if (!isNaN(cash) && cash >= total) {
        const change = cash - total;
        
        // Actualiza el valor del cambio
        changeElement.textContent = change.toFixed(2);

        // Guarda el efectivo y el cambio en localStorage
        localStorage.setItem('efectivo', cash.toFixed(2));
        localStorage.setItem('cambio', change.toFixed(2));

    } else if (isNaN(cash)) {
        // Muestra un mensaje de error si el valor ingresado no es un número
        alert("Por favor, ingresa un valor numérico válido.");
    } else {
        // Muestra un mensaje de error si el efectivo es menor que el total
        alert("El efectivo es insuficiente para cubrir el total.");
    }
});
