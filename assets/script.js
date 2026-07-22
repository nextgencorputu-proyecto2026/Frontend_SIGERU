
/* ---------------------
    CAMIONES
--------------------- */

//   JS para API
const BusquedaCamiones = document.getElementById("formBusquedaCamiones");

BusquedaCamiones.addEventListener("submit", async (e) => {

    e.preventDefault();

    const matricula = document.getElementById("inputMatricula").value.trim();

    let url = "../APIs/getCamiones.php";

    // Si el input tiene texto se envía como parámetro
    if (matricula !== "") {
        url += "?matricula=" + matricula;
    }

    const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    const camiones = await respuesta.json();

    cargarTabla(camiones);

});

// Funcion para cargar la tabla con los datos de los camiones
function cargarTabla(camiones) {

    const tabla = document.getElementById("tablaCamiones");

    tabla.innerHTML = "";

    camiones.forEach(camion => {

        tabla.innerHTML += `
            <tr>

                <th scope="row">${camion.id}</th>

                <td>${camion.matricula}</td>

                <td>${camion.tipo}</td>

                <td>${camion.ruta}</td>

                <td>${camion.estado}</td>

                <td>

                    <div class="list-group-horizontal">

                        <button class="verDatos btn btn-outline-primary btn-sm"
                            data-bs-toggle="modal" data-bs-target="#datosCamiones">
                            Ver
                        </button>

                        <button class="btn btn-outline-secondary btn-sm">
                            Editar
                        </button>

                        <button class="btn btn-outline-danger btn-sm">
                            Eliminar
                        </button>

                    </div>

                </td>

            </tr>
        `;

    });

}


/* --------------------
    CONTENEDORES
------------------------*/

// MAPA para contenedores

let mapa = null;
let capaContenedores = null;

async function cargarMapaContenedores() {

    // Crear el mapa solo una vez
    if (mapa === null) {

        mapa = L.map("mapa").setView(
            [-34.8965, -56.131],
            14
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap",
                maxZoom: 19
            }
        ).addTo(mapa);

        capaContenedores = L.layerGroup().addTo(mapa);

    } else {

        mapa.invalidateSize();

    }

    const respuesta = await fetch("../APIs/getContenedores.php", {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    const contenedores = await respuesta.json();

    dibujarContenedores(contenedores);


}

function dibujarContenedores(contenedores) {

    capaContenedores.clearLayers();

    contenedores.forEach(contenedor => {

        const marcador = L.marker([
            contenedor.Ubi_Y,
            contenedor.Ubi_X
        ]);

        marcador.on("click", () => {

            mostrarInformacion(contenedor);

        });

        marcador.addTo(capaContenedores);

    });

}

function mostrarInformacion(contenedor) {

    document.getElementById("id").value = contenedor.ID;
    document.getElementById("Nv_Llenado").value = contenedor.Nv_Llenado;
    document.getElementById("ubiX").value = contenedor.Ubi_X;
    document.getElementById("ubiY").value = contenedor.Ubi_Y;
    document.getElementById("Ruta").value = contenedor.Ruta;
    document.getElementById("Tipo_Residuo").value = contenedor.Tipo_Residuo;

}





