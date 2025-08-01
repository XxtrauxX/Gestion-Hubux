# Hubux: Sistema de Gestión Visual de Puestos
Sistema web interactivo para la gestión y asignación de puestos de trabajo mediante una interfaz visual basada en un plano de oficina.

🚀 Características Principales
Gestión Visual e Interactiva: Permite a los usuarios interactuar directamente con un plano de oficina para asignar espacios y recursos de forma intuitiva.

Pintado Automático por Áreas: Utiliza un algoritmo de "Relleno por Inundación" (Flood Fill) que permite colorear un área cerrada con un solo clic, detectando automáticamente los bordes.

Creación Dinámica de Puestos: Cada vez que se pinta un área, se crea dinámicamente un "puesto" de trabajo. El usuario puede especificar el tipo de puesto (GERENCIAL, PIZZAS, ESTANDAR) al momento de la creación.

Gestión de Empresas: Funcionalidad para añadir empresas, cada una con un nombre único y un color distintivo que se utiliza para el pintado en el plano.

Tablas de Resumen en Tiempo Real:

Resumen por Empresa: Desglosa la cantidad de puestos asignados a cada empresa, clasificados por tipo.

Resumen General: Muestra un conteo total de los puestos ocupados, disponibles y la capacidad total del plano.

Exportación a PDF: Genera un informe profesional en formato PDF que incluye:

Una captura del plano coloreado.

Las tablas de resumen con los datos actualizados.

Una marca de agua (marcaagua.png) en el fondo del documento.

Persistencia de Datos: El estado completo de la aplicación (empresas, puestos creados y el plano pintado) se guarda en el localStorage del navegador, permitiendo continuar el trabajo después de recargar la página.

🛠️ Cómo Funciona
El proyecto está construido con HTML, CSS y JavaScript (Vanilla). La lógica principal se encuentra en el archivo src/app.js.

Canvas y Flood Fill: La interactividad se logra a través de un elemento <canvas> de HTML5. La imagen del plano (src/plano.png) se dibuja en el canvas y el algoritmo Flood Fill manipula los píxeles para colorear las áreas.

Modelo de Datos Híbrido: La aplicación combina el estado visual del canvas con un modelo de datos en JavaScript. Un array puestos se puebla dinámicamente con cada clic que representa un nuevo puesto, sincronizando la información con lo que se ve en pantalla.

Dependencias: Se utilizan las librerías jsPDF y jspdf-autotable para la generación de reportes en PDF y Vite como herramienta de desarrollo y construcción.

⚡ Cómo Ejecutar el Proyecto
Asegúrate de tener Node.js instalado.

Clona el repositorio.

Abre una terminal en la raíz del proyecto e instala las dependencias:

Bash

