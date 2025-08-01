document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('planoCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const planoImagen = document.getElementById('planoImagen');

    const TIPOS_PUESTO = {
        GERENCIAL: 'GERENCIAL',
        PIZZAS: 'PIZZAS',
        ESTANDAR: 'ESTANDAR'
    };

    const state = {
        empresas: [],
        puestos: [],
        activeEmpresaId: null,
        isPainting: false,
    };

    function initializeApp() {
        planoImagen.onload = () => {
            canvas.width = planoImagen.naturalWidth;
            canvas.height = planoImagen.naturalHeight;
            ctx.drawImage(planoImagen, 0, 0);
            cargarDatos();
        };
        if (planoImagen.complete) {
            planoImagen.onload();
        }
        setupEventListeners();
    }

    function setupEventListeners() {
        canvas.addEventListener('click', handleCanvasClick);
        document.getElementById('empresaForm').addEventListener('submit', agregarEmpresa);
        document.getElementById('limpiarTodo').addEventListener('click', limpiarTodo);
        document.getElementById('exportPDF').addEventListener('click', generarPDF);
    }

    function handleCanvasClick(event) {
        if (state.isPainting) return;
        if (!state.activeEmpresaId) {
            return alert('Por favor, selecciona una empresa de la lista antes de pintar.');
        }

        const activeEmpresa = state.empresas.find(e => e.id === state.activeEmpresaId);
        if (!activeEmpresa) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left) * (canvas.width / rect.width));
        const y = Math.round((event.clientY - rect.top) * (canvas.height / rect.height));

        const fillColor = hexToRgba(activeEmpresa.color);
        const targetColor = getPixelColor(ctx.getImageData(0, 0, canvas.width, canvas.height), x, y);

        const isErasing = colorsAreSimilar(targetColor, fillColor, 10);

        if (isErasing) {
            const puestoAEliminar = state.puestos.find(p => {
                const puestoColor = getPixelColor(ctx.getImageData(0, 0, canvas.width, canvas.height), p.x, p.y);
                return colorsAreSimilar(puestoColor, fillColor, 10);
            });
            if (puestoAEliminar) {
                state.puestos = state.puestos.filter(p => p.id !== puestoAEliminar.id);
            }
            floodFill(x, y, [255, 255, 255], () => {
                actualizarUI();
                guardarDatos();
            });
        } else {
            const nuevoPuesto = {
                id: Date.now(),
                tipo: prompt("Tipo de puesto (GERENCIAL, PIZZAS, ESTANDAR):", "ESTANDAR").toUpperCase() || "ESTANDAR",
                x: x,
                y: y,
                empresaId: activeEmpresa.id,
                ocupado: true
            };
            if (!Object.values(TIPOS_PUESTO).includes(nuevoPuesto.tipo)) {
                alert("Tipo de puesto inválido. Se asignará ESTANDAR.");
                nuevoPuesto.tipo = "ESTANDAR";
            }
            state.puestos.push(nuevoPuesto);
            floodFill(x, y, fillColor, () => {
                actualizarUI();
                guardarDatos();
            });
        }
    }

    function agregarEmpresa(e) {
        e.preventDefault();
        const nombreInput = document.getElementById('nombreEmpresa');
        const colorInput = document.getElementById('colorEmpresa');
        if (!nombreInput.value) return alert('El nombre es obligatorio.');

        const empresa = {
            id: Date.now().toString(),
            nombre: nombreInput.value,
            color: colorInput.value,
        };
        state.empresas.push(empresa);
        actualizarUI();
        guardarDatos();
        nombreInput.value = '';
    }

    function seleccionarEmpresa(id) {
        state.activeEmpresaId = id;
        actualizarListaEmpresas();
    }

    function eliminarEmpresa(id, event) {
        event.stopPropagation();
        if (!confirm('¿Seguro que quieres eliminar esta empresa? Los puestos y colores asignados se borrarán.')) return;

        const empresaAEliminar = state.empresas.find(e => e.id === id);
        if (!empresaAEliminar) return;

        const colorAEliminar = hexToRgba(empresaAEliminar.color);

        state.puestos = state.puestos.filter(p => p.empresaId !== id);
        state.empresas = state.empresas.filter(e => e.id !== id);
        if (state.activeEmpresaId === id) state.activeEmpresaId = null;

        redibujarCanvasEliminandoColor(colorAEliminar);
        actualizarUI();
        guardarDatos();
    }

    function redibujarCanvasEliminandoColor(colorAEliminar) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const blanco = [255, 255, 255];

        for (let i = 0; i < data.length; i += 4) {
            const pixelColor = [data[i], data[i + 1], data[i + 2]];
            if (colorsAreSimilar(pixelColor, colorAEliminar, 10)) {
                data[i] = blanco[0];
                data[i + 1] = blanco[1];
                data[i + 2] = blanco[2];
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function floodFill(startX, startY, fillColor, callback) {
        state.isPainting = true;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const targetColor = getPixelColor(imageData, startX, startY);
        const tolerance = 30;

        if (colorsAreSimilar(targetColor, fillColor, 10)) {
            state.isPainting = false;
            return;
        }

        const queue = [[startX, startY]];
        const visited = new Uint8Array(imageData.width * imageData.height);

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const index1D = y * imageData.width + x;
            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height || visited[index1D]) continue;

            if (colorsAreSimilar(getPixelColor(imageData, x, y), targetColor, tolerance)) {
                setPixelColor(imageData, x, y, fillColor);
                visited[index1D] = 1;
                queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        state.isPainting = false;
        if (callback) callback();
    }

    function hexToRgba(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return [r, g, b]; }
    function colorsAreSimilar(c1, c2, tol) { const dr = c1[0] - c2[0], dg = c1[1] - c2[1], db = c1[2] - c2[2]; return (dr * dr + dg * dg + db * db) < (tol * tol); }
    function getPixelColor(d, x, y) { const i = (y * d.width + x) * 4; return [d.data[i], d.data[i + 1], d.data[i + 2]]; }
    function setPixelColor(d, x, y, c) { const i = (y * d.width + x) * 4; d.data[i] = c[0]; d.data[i + 1] = c[1]; d.data[i + 2] = c[2]; d.data[i + 3] = 255; }

    function actualizarUI() {
        actualizarListaEmpresas();
        actualizarTablaResumen();
        actualizarTablaGeneral();
    }

    function actualizarListaEmpresas() {
        const lista = document.getElementById('listaEmpresas');
        lista.innerHTML = '';
        state.empresas.forEach(empresa => {
            const div = document.createElement('div');
            div.className = `empresa-item ${state.activeEmpresaId === empresa.id ? 'active' : ''}`;
            div.onclick = () => seleccionarEmpresa(empresa.id);
            div.innerHTML = `
                <div class="empresa-info">
                    <div class="empresa-color" style="background-color: ${empresa.color}"></div>
                    <span class="empresa-nombre">${empresa.nombre}</span>
                </div>
                <button class="btn-small btn-delete" onclick="eliminarEmpresa('${empresa.id}', event)">&times;</button>`;
            lista.appendChild(div);
        });
    }

    function actualizarTablaResumen() {
        const tbody = document.querySelector('#tablaEmpresas tbody');
        tbody.innerHTML = '';
        state.empresas.forEach(empresa => {
            const puestosAsignados = state.puestos.filter(p => p.empresaId === empresa.id);
            const gerencial = puestosAsignados.filter(p => p.tipo === TIPOS_PUESTO.GERENCIAL).length;
            const pizzas = puestosAsignados.filter(p => p.tipo === TIPOS_PUESTO.PIZZAS).length;
            const estandar = puestosAsignados.filter(p => p.tipo === TIPOS_PUESTO.ESTANDAR).length;
            const row = tbody.insertRow();
            row.innerHTML = `
                <td style="background-color: ${empresa.color}20; font-weight: bold;">${empresa.nombre}</td>
                <td>${gerencial}</td>
                <td>${pizzas}</td>
                <td>${estandar}</td>
                <td style="font-weight: bold;">${puestosAsignados.length}</td>`;
        });
    }

    function actualizarTablaGeneral() {
        const totalPuestos = state.puestos.length;
        let ocupados = { G: 0, P: 0, E: 0 };
        state.puestos.forEach(p => {
            if (p.ocupado) {
                if (p.tipo === TIPOS_PUESTO.GERENCIAL) ocupados.G++;
                if (p.tipo === TIPOS_PUESTO.PIZZAS) ocupados.P++;
                if (p.tipo === TIPOS_PUESTO.ESTANDAR) ocupados.E++;
            }
        });

        document.getElementById('ocupadosGerencial').textContent = ocupados.G;
        document.getElementById('ocupadosPizzas').textContent = ocupados.P;
        document.getElementById('ocupadosEstandar').textContent = ocupados.E;
        document.getElementById('ocupadosTotal').textContent = totalPuestos;

        document.getElementById('disponiblesGerencial').textContent = 0;
        document.getElementById('disponiblesPizzas').textContent = 0;
        document.getElementById('disponiblesEstandar').textContent = 0;
        document.getElementById('disponiblesTotal').textContent = 0;

        document.getElementById('totalGerencial').textContent = ocupados.G;
        document.getElementById('totalPizzas').textContent = ocupados.P;
        document.getElementById('totalEstandar').textContent = ocupados.E;
        document.getElementById('totalGeneral').textContent = totalPuestos;
    }

    function guardarDatos() {
        const data = { empresas: state.empresas, puestos: state.puestos, canvas: canvas.toDataURL() };
        localStorage.setItem('hubuxState', JSON.stringify(data));
    }

    function cargarDatos() {
        const dataJSON = localStorage.getItem('hubuxState');
        if (!dataJSON) {
            actualizarUI();
            return;
        }
        const data = JSON.parse(dataJSON);
        state.empresas = data.empresas || [];
        state.puestos = data.puestos || [];

        if (data.canvas) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                actualizarUI();
            };
            img.src = data.canvas;
        } else {
            actualizarUI();
        }
    }

    function limpiarTodo() {
        if (confirm('¿Seguro? Esto borrará todas las empresas, puestos y colores.')) {
            localStorage.removeItem('hubuxState');
            state.activeEmpresaId = null;
            state.empresas = [];
            state.puestos = [];
            ctx.drawImage(planoImagen, 0, 0);
            actualizarUI();
        }
    }

    function generarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFontSize(20);
        doc.text('Resumen de Ocupación Hubux', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 25, 180, 135);
        doc.autoTable({ html: '#tablaEmpresas', startY: 25, margin: { left: 200 }, theme: 'grid', headStyles: { fillColor: [102, 126, 234] } });
        doc.autoTable({ html: '.resumen-general-table table', startY: doc.lastAutoTable.finalY + 10, margin: { left: 200 }, theme: 'grid', headStyles: { fillColor: [255, 193, 7] } });
        doc.save(`Resumen_Hubux_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    initializeApp();
});