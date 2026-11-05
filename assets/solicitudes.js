
document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:8003/api";

    const formulario = document.getElementById("form");
    const tipoServicio = document.getElementById("tipoServicio");
    const grupoContenedor = document.getElementById("grupoContenedor");
    const selectorContenedor = document.getElementById("idContenedor");
    const botonEnviar = document.getElementById("btnEnviarSolicitud");
    const mensaje = document.getElementById("mensajeSolicitud");

    if (!formulario) return;

    const requiereContenedor = () =>
        tipoServicio.value === "Contenedor Dañado" ||
        tipoServicio.value === "Contenedor Desbordado";

    async function cargarContenedores() {
        selectorContenedor.innerHTML =
            '<option value="">Cargando contenedores...</option>';

        try {
            const respuesta = await fetch(`${API_URL}/publico/contenedores`, {
                headers: { Accept: "application/json" }
            });

            if (!respuesta.ok) {
                throw new Error("No se pudieron cargar los contenedores");
            }

            const resultado = await respuesta.json();

            if (!resultado.success || !Array.isArray(resultado.data)) {
                throw new Error("Respuesta inválida de la API");
            }

            selectorContenedor.innerHTML =
                '<option value="">Seleccione un contenedor</option>';

            resultado.data.forEach(contenedor => {
                const opcion = document.createElement("option");
                opcion.value = contenedor.idContenedor;
                opcion.textContent = `Contenedor ${contenedor.idContenedor}`;
                selectorContenedor.appendChild(opcion);
            });
        } catch (error) {
            selectorContenedor.innerHTML =
                '<option value="">No se pudieron cargar los contenedores</option>';

            mensaje.textContent = error.message;
            mensaje.className = "mt-3 text-danger";
        }
    }

    function actualizarTipoServicio() {
        const necesitaContenedor = requiereContenedor();

        grupoContenedor.classList.toggle("d-none", !necesitaContenedor);
        selectorContenedor.required = necesitaContenedor;

        if (!necesitaContenedor) {
            selectorContenedor.value = "";
        }
    }

    tipoServicio.addEventListener("change", actualizarTipoServicio);

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!formulario.reportValidity()) return;

        const datos = {
            nombre: document.getElementById("nombre").value.trim(),
            correo: document.getElementById("correo").value.trim(),
            telefono: document.getElementById("telefono").value.trim(),
            direccion: document.getElementById("direccion").value.trim(),
            barrio: document.getElementById("barrio").value,
            tipoServicio: tipoServicio.value,
            descripcion: document.getElementById("descripcion").value.trim()
        };

        const fecha = document.getElementById("fechaSolicitada").value;

        if (fecha) {
            datos.fechaSolicitada = fecha;
        }

        if (requiereContenedor()) {
            datos.idContenedor = Number(selectorContenedor.value);
        }

        botonEnviar.disabled = true;
        mensaje.textContent = "Enviando solicitud...";
        mensaje.className = "mt-3 text-secondary";

        try {
            const respuesta = await fetch(`${API_URL}/publico/solicitudes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.success) {
                throw new Error(
                    resultado.message ||
                    resultado.mensaje ||
                    "No se pudo enviar la solicitud"
                );
            }

            mensaje.textContent = "Solicitud enviada correctamente.";
            mensaje.className = "mt-3 text-success";

            formulario.reset();
            actualizarTipoServicio();
        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.className = "mt-3 text-danger";
        } finally {
            botonEnviar.disabled = false;
        }
    });

    actualizarTipoServicio();
    cargarContenedores();
});
