document.addEventListener('DOMContentLoaded', function() {
    const nombreInput = document.getElementById('nombre');
    const proveedorInput = document.getElementById('proveedor');
    const precioFacturadoInput = document.getElementById('precioFacturado');
    const precioUnidadInput = document.getElementById('precioUnidad');
    const precioMediaDocenaInput = document.getElementById('precioMediaDocena');
    const precioDocenaInput = document.getElementById('precioDocena');
    const precioFardoInput = document.getElementById('precioFardo');
    const habilitarPrecioUnidad = document.getElementById('habilitarPrecioUnidad');
    const habilitarPrecioMediaDocena = document.getElementById('habilitarPrecioMediaDocena');
    const habilitarPrecioDocena = document.getElementById('habilitarPrecioDocena');
    const habilitarPrecioFardo = document.getElementById('habilitarPrecioFardo');
    const agregarProductoBtn = document.getElementById('agregarProductoBtn');
    const productList = document.getElementById('productList');
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.querySelector('.modal .close');

    let productListData = JSON.parse(localStorage.getItem('productos')) || [];

    function toggleInput(id, isEnabled) {
        const input = document.getElementById(id);
        input.disabled = !isEnabled;
    }

    function updateInputStates() {
        toggleInput('precioUnidad', habilitarPrecioUnidad.checked);
        toggleInput('precioMediaDocena', habilitarPrecioMediaDocena.checked);
        toggleInput('precioDocena', habilitarPrecioDocena.checked);
        toggleInput('precioFardo', habilitarPrecioFardo.checked);
    }

    habilitarPrecioUnidad.addEventListener('change', updateInputStates);
    habilitarPrecioMediaDocena.addEventListener('change', updateInputStates);
    habilitarPrecioDocena.addEventListener('change', updateInputStates);
    habilitarPrecioFardo.addEventListener('change', updateInputStates);

    
    
    function addProductToList(producto) {
        const li = document.createElement('li');
        li.className = 'product-item';
        li.dataset.id = producto.id;
    
        li.innerHTML = `
            <input type="text" class="product-name" value="${producto.nombre}" readonly>
            <input type="text" class="product-provider" value="${producto.proveedor}" readonly>
            <input type="text" class="product-facturado" value="${producto.precioFacturado}" readonly>
            <input type="text" class="product-unidad" value="${producto.precioUnidad}" readonly>
            <input type="text" class="product-media-docena" value="${producto.precioMediaDocena}" readonly>
            <input type="text" class="product-docena" value="${producto.precioDocena}" readonly>
            <input type="text" class="product-fardo" value="${producto.precioFardo}" readonly>
            <label>
                <input type="checkbox" class="enable-delete-checkbox" style="display:none;"> 
            </label>
            <button class="edit-btn">Editar</button>
            <button class="save-btn" style="display:none;">Guardar</button>
            <button class="delete-btn" style="display:none;">Eliminar</button>
        `;
    
        productList.appendChild(li);
    
        li.querySelector('.edit-btn').addEventListener('click', function() {
            li.querySelectorAll('input').forEach(input => {
                // Solo permitir la edición de los campos que no sean nombre ni proveedor
                if (!input.classList.contains('product-name') && !input.classList.contains('product-provider')) {
                    input.readOnly = false;
                }
            });
            li.querySelector('.edit-btn').style.display = 'none';
            li.querySelector('.save-btn').style.display = 'inline';
            
            // Show checkbox for enabling delete when editing
            const deleteCheckbox = li.querySelector('.enable-delete-checkbox');
            deleteCheckbox.style.display = 'inline'; // Show checkbox
            li.querySelector('.delete-btn').style.display = 'none'; // Ensure delete button is hidden initially
        });
    
        li.querySelector('.save-btn').addEventListener('click', function() {
            li.querySelectorAll('input').forEach(input => input.readOnly = true);
            li.querySelector('.edit-btn').style.display = 'inline';
            li.querySelector('.save-btn').style.display = 'none';
    
            // Hide the checkbox and delete button when saving
            li.querySelector('.enable-delete-checkbox').style.display = 'none'; // Hide checkbox when saving
            li.querySelector('.delete-btn').style.display = 'none'; // Hide delete button when saving
    
            updateProductInLocalStorage(li);
        });
    
        li.querySelector('.delete-btn').addEventListener('click', function() {
            deleteProductFromList(li);
        });
    
        // Enable/Disable delete button based on checkbox state
        const deleteCheckbox = li.querySelector('.enable-delete-checkbox');
        deleteCheckbox.addEventListener('change', function() {
            // Show or hide the delete button based on the checkbox state
            li.querySelector('.delete-btn').style.display = this.checked ? 'inline' : 'none';
        });
    }
    
    
    

    function updateProductInLocalStorage(li) {
        const productId = li.dataset.id; // Usar el ID del producto
        const index = productListData.findIndex(p => p.id === productId);

        if (index !== -1) {
            // Actualizar el producto en el array
            productListData[index] = {
                id: productId, // Mantener el mismo ID
                nombre: li.querySelector('.product-name').value,
                proveedor: li.querySelector('.product-provider').value,
                precioFacturado: li.querySelector('.product-facturado').value,
                precioUnidad: li.querySelector('.product-unidad').value,
                precioMediaDocena: li.querySelector('.product-media-docena').value,
                precioDocena: li.querySelector('.product-docena').value,
                precioFardo: li.querySelector('.product-fardo').value
            };

            // Guardar en localStorage
            localStorage.setItem('productos', JSON.stringify(productListData));
        } else {
            console.error("Producto no encontrado para actualizar");
        }
    }

    function deleteProductFromList(li) {
        const nombre = li.querySelector('.product-name').value;
        productListData = productListData.filter(producto => producto.nombre !== nombre);
        localStorage.setItem('productos', JSON.stringify(productListData));
        li.remove();
    }

    function updateProductList() {
        productList.innerHTML = '';
        productListData.forEach(producto => addProductToList(producto));
    }

    function showSuccessModal() {
        successModal.style.display = 'block';
        closeModalBtn.addEventListener('click', function() {
            successModal.style.display = 'none';
        });
        window.addEventListener('click', function(event) {
            if (event.target == successModal) {
                successModal.style.display = 'none';
            }
        });
    }

    agregarProductoBtn.addEventListener('click', function() {
        const nombre = nombreInput.value.trim();
        const proveedor = proveedorInput.value.trim();
        const precioFacturado = parseFloat(precioFacturadoInput.value) || null;
        const precioUnidad = habilitarPrecioUnidad.checked ? parseFloat(precioUnidadInput.value) || null : null;
        const precioMediaDocena = habilitarPrecioMediaDocena.checked ? parseFloat(precioMediaDocenaInput.value) || null : null;
        const precioDocena = habilitarPrecioDocena.checked ? parseFloat(precioDocenaInput.value) || null : null;
        const precioFardo = habilitarPrecioFardo.checked ? parseFloat(precioFardoInput.value) || null : null;

        if (!nombre || !proveedor || isNaN(precioFacturado) || 
            (habilitarPrecioUnidad.checked && isNaN(precioUnidad)) || 
            (habilitarPrecioMediaDocena.checked && isNaN(precioMediaDocena)) || 
            (habilitarPrecioDocena.checked && isNaN(precioDocena)) || 
            (habilitarPrecioFardo.checked && isNaN(precioFardo))) {
            alert('Por favor, complete todos los campos correctamente.');
            return;
        }

        const producto = {
            id: Date.now().toString(), // Asignar un ID único basado en la fecha actual
            nombre,
            proveedor,
            precioFacturado,
            precioUnidad,
            precioMediaDocena,
            precioDocena,
            precioFardo
        };

        productListData.push(producto);
        localStorage.setItem('productos', JSON.stringify(productListData));
        addProductToList(producto);
        showSuccessModal();
    });

    updateInputStates();
    updateProductList();
});
